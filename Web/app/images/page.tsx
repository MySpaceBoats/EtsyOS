import { SectionPage } from "@/components/control/section-page";
import { SimpleTable } from "@/components/control/primitives";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function ImagesPage() {
  return (
    <SectionPage
      title="Image Generator"
      description="Assets image planifiés/générés par produit : clé R2, type, résolution, provider. Un asset « simulé » est planifié par la pipeline mais pas encore généré par le MCP image-generation — l'aperçu s'activera quand les binaires seront réellement dans R2."
      section="images"
      render={(_p, images) => (
        <SimpleTable
          head={["Clé R2", "Type", "Résolution", "Provider", "État"]}
          rows={images.assets.map((a) => [
            <span key="k" className="font-mono text-xs">{a.key}</span>,
            a.kind,
            <span key="r" className="tabular-nums">{a.width}×{a.height}</span>,
            <span key="p" className="font-mono text-xs text-muted-foreground">{a.provider}</span>,
            a.simulated ? (
              <span key="s" className="text-xs text-amber-700 dark:text-amber-300">planifié (simulé)</span>
            ) : (
              <span key="s" className="text-xs text-emerald-700 dark:text-emerald-300">généré</span>
            ),
          ])}
        />
      )}
    />
  );
}
