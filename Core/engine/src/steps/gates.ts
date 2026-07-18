// Steps 9–11: quality-assurance, validation (human gate), publishing (hard
// gate). These three steps are the safety boundary of EtsyOS: NOTHING can be
// published without passing QA checks AND an explicit human approval recorded
// in the fiche by the Web console. The engine cannot bypass them — publishing
// re-verifies both conditions itself, and dry-run never leaves the machine.

import type { WorkflowStep } from "../engine.ts";
import type { QaCheck, SectionMeta } from "../product-object.ts";
import { listingRelPath, readListingStatus, writeDraftListing } from "../listing-bridge.ts";
import { TRADEMARK_BLOCKLIST } from "./catalog.ts";

function meta(t0: number, source: SectionMeta["source"] = "offline-heuristic"): SectionMeta {
  return { source, generatedAt: new Date().toISOString(), durationMs: Date.now() - t0 };
}

export const qualityAssurance: WorkflowStep = {
  id: "quality-assurance",
  title: "Quality Assurance",
  async run(product, ctx) {
    const t0 = Date.now();
    const { seo, images, mockups, market } = product;
    if (!seo || !images) throw new Error("quality-assurance requires seo + images output");

    const text = `${seo.title} ${seo.description} ${seo.tags.join(" ")}`.toLowerCase();
    const hits = TRADEMARK_BLOCKLIST.filter((t) => text.includes(t));

    const others = (await ctx.state.listProducts()).filter((p) => p.id !== product.id);
    const dupTitle = others.find((p) => p.seo?.title === seo.title || p.title === product.title);

    const design = images.assets.find((a) => a.kind === "design");

    const checks: QaCheck[] = [
      { id: "tags-budget", label: "Tags ≤ 13 (limite Etsy)", passed: seo.tags.length <= 13, detail: `${seo.tags.length}/13 tags` },
      { id: "tag-length", label: "Tags ≤ 20 caractères", passed: seo.tags.every((tg) => tg.length <= 20), detail: seo.tags.filter((tg) => tg.length > 20).join(", ") || "ok" },
      { id: "title-length", label: "Titre ≤ 140 caractères", passed: seo.title.length <= 140, detail: `${seo.title.length}/140` },
      { id: "has-design", label: "Au moins un design", passed: images.assets.length > 0, detail: `${images.assets.length} asset(s)` },
      { id: "has-mockups", label: "Au moins un mockup", passed: (mockups?.assets.length ?? 0) > 0, detail: `${mockups?.assets.length ?? 0} mockup(s)` },
      { id: "resolution", label: "Design ≥ 2000px (print-ready)", passed: !!design && design.width >= 2000 && design.height >= 2000, detail: design ? `${design.width}x${design.height}` : "aucun design" },
      { id: "copyright", label: "Aucune marque protégée (copyright / politique Etsy)", passed: hits.length === 0, detail: hits.length ? `Termes bloqués: ${hits.join(", ")}` : "aucun terme bloqué" },
      { id: "duplicates", label: "Pas de doublon de titre", passed: !dupTitle, detail: dupTitle ? `Doublon avec ${dupTitle.id}` : "unique" },
      { id: "price", label: "Prix > 0", passed: (market?.priceMedian ?? 0) > 0, detail: `${market?.priceMedian ?? 0}€` },
    ];

    const passed = checks.every((c) => c.passed);
    product.qa = { meta: meta(t0), passed, checks };
    ctx.log(`QA ${passed ? "PASSED" : "FAILED"} — ${checks.filter((c) => c.passed).length}/${checks.length} checks ok`);
    return { result: { passed, checks: checks.length, failed: checks.filter((c) => !c.passed).map((c) => c.id) } };
  },
};

// Human validation gate. The engine only READS the fiche status written by the
// Web console. No fiche / not yet decided → the workflow PAUSES and resumes
// after the human clicks. Approved → continue. Rejected/Archived → continue
// with approved:false (publishing will refuse).
export const validation: WorkflowStep = {
  id: "validation",
  title: "Validation humaine",
  async run(product, ctx) {
    const t0 = Date.now();
    let relPath = product.listingPath ?? listingRelPath(product.category, product.slug);
    let status = await readListingStatus(ctx.repoRoot, relPath);

    if (status === null) {
      // Pipeline-born product: write the Draft fiche so it shows up in the
      // validation console, then wait for the human.
      relPath = await writeDraftListing(ctx.repoRoot, product);
      product.listingPath = relPath;
      status = "Draft";
      ctx.log(`Draft fiche written at ${relPath} — awaiting human validation`);
    } else {
      product.listingPath = relPath;
      ctx.log(`Fiche status: ${status}`);
    }

    if (status === "Approved" || status === "PublishRequested" || status === "Published") {
      product.validation = { meta: meta(t0, "human"), fiche_status: status, approved: true, decidedBy: "console" };
      return { result: { fiche_status: status, approved: true } };
    }
    if (status === "Rejected" || status === "Archived") {
      product.validation = { meta: meta(t0, "human"), fiche_status: status, approved: false, decidedBy: "console" };
      return { result: { fiche_status: status, approved: false } };
    }
    // Draft / OnHold / anything else → wait for the human decision.
    return {
      result: { fiche_status: status, approved: false },
      pause: `En attente de validation humaine (fiche ${relPath}, statut ${status})`,
    };
  },
};

export const publishing: WorkflowStep = {
  id: "publishing",
  title: "Publishing",
  async run(product, ctx) {
    const t0 = Date.now();
    const blocked = (reason: string) => {
      product.publication = {
        meta: meta(t0),
        published: false,
        simulated: ctx.dryRun,
        printifyProductId: null,
        etsyListingId: null,
        blockedReason: reason,
      };
      ctx.log(`Publication BLOCKED: ${reason}`);
      return { result: { published: false, blockedReason: reason } };
    };

    // Hard gate — re-verified here regardless of what upstream steps say.
    if (!product.qa?.passed) return blocked("Contrôles QA non passés — publication interdite.");
    if (!product.validation?.approved) return blocked("Validation humaine absente ou refusée — publication interdite.");

    if (ctx.dryRun) {
      product.publication = {
        meta: meta(t0),
        published: false,
        simulated: true,
        printifyProductId: null,
        etsyListingId: null,
        blockedReason: null,
      };
      ctx.log("Dry-run: publication simulée — aurait créé le produit Printify puis le listing Etsy (draft) via les MCP.");
      return { result: { published: false, simulated: true, note: "dry-run — aucun appel Printify/Etsy" } };
    }

    // Live path: requires the publishing gate (MCP printify + etsy invoked
    // from a controlled routine). Not wired yet — refuse rather than pretend.
    return blocked(
      "Chemin de publication réel non activé: les MCP printify/etsy doivent être invoqués depuis une routine contrôlée (gate d'écriture Phase 4). Utiliser --dry-run.",
    );
  },
};
