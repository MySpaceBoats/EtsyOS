// Unit tests for each pipeline step: every step writes its own Product Object
// section, results are deterministic, and QA catches real violations.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createProductObject, type ProductObject } from "../src/product-object.ts";
import { EventBus } from "../src/events.ts";
import { StateManager } from "../src/state.ts";
import type { StepContext } from "../src/engine.ts";
import { trendDiscovery, marketAnalysis, opportunityScoring, productPlanner } from "../src/steps/discovery.ts";
import { productGenerator, imageGenerator, mockupGenerator, seoGenerator } from "../src/steps/generation.ts";
import { qualityAssurance, publishing } from "../src/steps/gates.ts";

async function ctx(dryRun = true): Promise<StepContext> {
  const dir = await mkdtemp(join(tmpdir(), "etsyos-steps-"));
  const state = new StateManager(join(dir, "state"));
  await state.init();
  return { dryRun, repoRoot: dir, state, events: new EventBus(state.eventsDir), log: () => {} };
}

function freshProduct(): ProductObject {
  return createProductObject({ slug: "sunset-cat-mug", title: "Sunset Cat Mug", category: "Mugs" });
}

async function runThrough(product: ProductObject, c: StepContext, until: string): Promise<void> {
  const steps = [trendDiscovery, marketAnalysis, opportunityScoring, productPlanner,
    productGenerator, imageGenerator, mockupGenerator, seoGenerator, qualityAssurance];
  for (const s of steps) {
    await s.run(product, c);
    if (s.id === until) return;
  }
}

test("trend-discovery: deterministic keywords sorted by popularity", async () => {
  const c = await ctx();
  const a = freshProduct();
  const b = freshProduct();
  await trendDiscovery.run(a, c);
  await trendDiscovery.run(b, c);
  assert.deepEqual(a.trend!.keywords, b.trend!.keywords); // same input → same output
  assert.ok(a.trend!.keywords.length >= 5);
  const pops = a.trend!.keywords.map((k) => k.popularity);
  assert.deepEqual(pops, [...pops].sort((x, y) => y - x));
  assert.equal(a.trend!.meta.source, "offline-heuristic");
});

test("market-analysis: prices stay inside the category envelope; requires trend", async () => {
  const c = await ctx();
  const p = freshProduct();
  await assert.rejects(() => marketAnalysis.run(p, c), /requires trend-discovery/);
  await trendDiscovery.run(p, c);
  await marketAnalysis.run(p, c);
  const m = p.market!;
  assert.ok(m.priceLow <= m.priceMedian && m.priceMedian <= m.priceHigh);
  assert.ok(m.demand >= 0 && m.demand <= 100);
});

test("opportunity-scoring: weighted total in [0,100] with a full explanation", async () => {
  const c = await ctx();
  const p = freshProduct();
  await runThrough(p, c, "opportunity-scoring");
  const o = p.opportunity!;
  assert.ok(o.total >= 0 && o.total <= 100);
  assert.equal(o.explanation.length, 6); // one line per component + total
  const expected = Math.round(o.seo * 0.25 + o.competition * 0.2 + o.potential * 0.3 + o.profitability * 0.25);
  assert.equal(o.total, expected);
});

test("product-planner: variants and priority derived from score", async () => {
  const c = await ctx();
  const p = freshProduct();
  await runThrough(p, c, "product-planner");
  assert.equal(p.plan!.productType, "mug");
  assert.ok(["low", "medium", "high"].includes(p.plan!.priority));
  assert.ok(p.plan!.variants.length > 0);
});

test("product-generator: version increments and previous prompt is archived", async () => {
  const c = await ctx();
  const p = freshProduct();
  await runThrough(p, c, "product-generator");
  assert.equal(p.generation!.version, 1);
  const firstPrompt = p.generation!.prompt;
  await productGenerator.run(p, c);
  assert.equal(p.generation!.version, 2);
  assert.deepEqual(p.generation!.previousVersions, [firstPrompt]);
});

test("image + mockup generators: planned assets are marked simulated", async () => {
  const c = await ctx();
  const p = freshProduct();
  await runThrough(p, c, "mockup-generator");
  assert.equal(p.images!.assets.length, 3);
  assert.ok(p.images!.assets.every((a) => a.simulated));
  assert.ok(p.images!.assets[0].key.startsWith("products/sunset-cat-mug/v1/"));
  assert.equal(p.mockups!.assets.length, 4); // Mugs has 4 scenes
});

test("seo-generator: Etsy budgets respected (title ≤140, ≤13 tags of ≤20 chars)", async () => {
  const c = await ctx();
  const p = freshProduct();
  await runThrough(p, c, "seo-generator");
  const s = p.seo!;
  assert.ok(s.title.length <= 140);
  assert.ok(s.tags.length <= 13);
  assert.ok(s.tags.every((t) => t.length <= 20));
  assert.ok(s.score > 0 && s.score <= 100);
});

test("quality-assurance: passes a clean product, fails on trademarked terms", async () => {
  const c = await ctx();
  const clean = freshProduct();
  await runThrough(clean, c, "quality-assurance");
  assert.equal(clean.qa!.passed, true);

  const dirty = createProductObject({ slug: "disney-fan-mug", title: "Disney Fan Mug", category: "Mugs" });
  await runThrough(dirty, c, "quality-assurance");
  assert.equal(dirty.qa!.passed, false);
  const copyright = dirty.qa!.checks.find((ch) => ch.id === "copyright")!;
  assert.equal(copyright.passed, false);
  assert.match(copyright.detail, /disney/);
});

test("quality-assurance: detects duplicate titles across the product store", async () => {
  const c = await ctx();
  const first = freshProduct();
  await runThrough(first, c, "quality-assurance");
  await c.state.saveProduct(first);

  const clone = createProductObject({ slug: "sunset-cat-mug-2", title: "Sunset Cat Mug", category: "Mugs" });
  await runThrough(clone, c, "quality-assurance");
  assert.equal(clone.qa!.checks.find((ch) => ch.id === "duplicates")!.passed, false);
});

test("publishing: hard-blocked without QA pass or human approval, simulated in dry-run", async () => {
  const c = await ctx(true);
  const p = freshProduct();
  await runThrough(p, c, "quality-assurance");

  // No validation at all → blocked even though QA passed.
  await publishing.run(p, c);
  assert.equal(p.publication!.published, false);
  assert.match(p.publication!.blockedReason!, /Validation humaine/);

  // Human approval present + dry-run → simulated, still nothing published.
  p.validation = {
    meta: { source: "human", generatedAt: "now", durationMs: 0 },
    fiche_status: "Approved", approved: true, decidedBy: "console",
  };
  await publishing.run(p, c);
  assert.equal(p.publication!.published, false);
  assert.equal(p.publication!.simulated, true);
  assert.equal(p.publication!.blockedReason, null);

  // Live mode without the MCP write gate → refused, never silently published.
  const live = await ctx(false);
  await publishing.run(p, live);
  assert.equal(p.publication!.published, false);
  assert.match(p.publication!.blockedReason!, /routine contrôlée/);
});
