import { SectionPage } from "@/components/control/section-page";
import { Meter } from "@/components/control/primitives";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function ScoringPage() {
  return (
    <SectionPage
      title="Opportunity Scoring"
      description="Score global et sous-scores (SEO, concurrence, potentiel, difficulté, rentabilité) calculés par l'étape opportunity-scoring — avec l'explication complète du calcul, pondérations incluses."
      section="opportunity"
      render={(_p, o) => (
        <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
          <div>
            <div className="text-4xl font-semibold tabular-nums">{o.total}<span className="text-lg text-muted-foreground">/100</span></div>
            <div className="mt-3 space-y-1.5 text-sm">
              {(
                [
                  ["SEO", o.seo],
                  ["Concurrence", o.competition],
                  ["Potentiel", o.potential],
                  ["Difficulté", o.difficulty],
                  ["Rentabilité", o.profitability],
                ] as const
              ).map(([label, v]) => (
                <div key={label} className="grid grid-cols-[7rem_1fr] items-center gap-2">
                  <span className="text-muted-foreground">{label}</span>
                  <Meter value={v} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-medium">Explication du calcul</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {o.explanation.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    />
  );
}
