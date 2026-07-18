import { SectionPage } from "@/components/control/section-page";
import { SimpleTable } from "@/components/control/primitives";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function MockupsPage() {
  return (
    <SectionPage
      title="Mockup Generator"
      description="Scènes de mockup planifiées par produit (mise en situation du design). Même convention que les images : « simulé » = planifié par la pipeline, en attente de génération réelle via le MCP image-generation."
      section="mockups"
      render={(_p, mockups) => (
        <SimpleTable
          head={["Clé R2", "Scène", "Provider", "État"]}
          rows={mockups.assets.map((a) => [
            <span key="k" className="font-mono text-xs">{a.key}</span>,
            a.scene,
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
