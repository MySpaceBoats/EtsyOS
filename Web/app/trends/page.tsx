import { SectionPage } from "@/components/control/section-page";
import { Meter, SimpleTable } from "@/components/control/primitives";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function TrendsPage() {
  return (
    <SectionPage
      title="Trend Discovery"
      description="Mots-clés détectés par l'étape trend-discovery de la pipeline, avec popularité et momentum. Source offline-heuristic tant que les MCP marché ne sont pas branchés — la provenance est affichée sur chaque section."
      section="trend"
      render={(_p, trend) => (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {trend.summary} <span className="font-medium">Fenêtre saisonnière : {trend.season}.</span>
          </p>
          <SimpleTable
            head={["Mot-clé", "Popularité", "Momentum", "Source"]}
            rows={trend.keywords.map((k) => [
              k.keyword,
              <Meter key="p" value={k.popularity} className="max-w-52" />,
              <span key="m" className="tabular-nums">
                {k.momentum > 0 ? "↑" : k.momentum < 0 ? "↓" : "→"} {k.momentum.toFixed(1)}
              </span>,
              <span key="s" className="font-mono text-xs text-muted-foreground">{k.source}</span>,
            ])}
          />
        </>
      )}
    />
  );
}
