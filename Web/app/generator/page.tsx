import { SectionPage } from "@/components/control/section-page";
import { fmtMs } from "@/components/control/primitives";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function GeneratorPage() {
  return (
    <SectionPage
      title="Product Generator"
      description="Concepts et prompts générés pour chaque produit, avec versionnage : chaque régénération archive le prompt précédent."
      section="generation"
      render={(_p, g) => (
        <div className="space-y-3 text-sm">
          <p>{g.concept}</p>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Prompt (version {g.version} · générée en {fmtMs(g.meta.durationMs)})
            </p>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-muted/40 p-3 text-xs leading-relaxed">{g.prompt}</pre>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Negative prompt</p>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-muted/40 p-3 text-xs leading-relaxed">{g.negativePrompt}</pre>
          </div>
          {g.previousVersions.length > 0 ? (
            <details>
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                {g.previousVersions.length} version(s) précédente(s)
              </summary>
              <div className="mt-2 space-y-2">
                {g.previousVersions.map((prev, i) => (
                  <pre key={i} className="overflow-x-auto whitespace-pre-wrap rounded bg-muted/30 p-3 text-xs leading-relaxed">
                    v{i + 1}: {prev}
                  </pre>
                ))}
              </div>
            </details>
          ) : null}
        </div>
      )}
    />
  );
}
