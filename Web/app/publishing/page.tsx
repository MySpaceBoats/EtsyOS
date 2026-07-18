import { SectionPage } from "@/components/control/section-page";
import { StatusBadge } from "@/components/control/primitives";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function PublishingPage() {
  return (
    <SectionPage
      title="Publishing"
      description="État des publications Printify/Etsy par produit. Le gate est absolu : QA passée ET validation humaine re-vérifiées par l'étape elle-même ; en dry-run rien ne quitte la machine ; le chemin live restera refusé tant que le gate d'écriture MCP (Phase 4) n'existe pas."
      section="publication"
      render={(_p, pub) => (
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <StatusBadge
              status={pub.published ? "completed" : pub.blockedReason ? "failed" : pub.simulated ? "paused" : "pending"}
            />
            {pub.published
              ? "Publié"
              : pub.blockedReason
                ? "Bloqué"
                : pub.simulated
                  ? "Simulé (dry-run) — aurait créé le produit Printify puis le listing Etsy en draft"
                  : "Non publié"}
          </p>
          {pub.blockedReason ? (
            <p className="rounded bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">{pub.blockedReason}</p>
          ) : null}
          <div className="grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
            <p>Printify product ID : <span className="font-mono">{pub.printifyProductId ?? "—"}</span></p>
            <p>Etsy listing ID : <span className="font-mono">{pub.etsyListingId ?? "—"}</span></p>
          </div>
        </div>
      )}
    />
  );
}
