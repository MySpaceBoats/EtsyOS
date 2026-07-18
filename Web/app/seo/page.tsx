import { SectionPage } from "@/components/control/section-page";
import { Meter } from "@/components/control/primitives";
import { Badge } from "@/components/ui/badge";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default function SeoPage() {
  return (
    <SectionPage
      title="SEO Generator"
      description="Titre, description, tags (budget Etsy : 13 max, 20 caractères) et catégories générés par l'étape seo-generator, avec score et suggestions d'amélioration."
      section="seo"
      render={(_p, seo) => (
        <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Titre ({seo.title.length}/140)
              </p>
              <p className="mt-0.5">{seo.title}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tags ({seo.tags.length}/13)
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {seo.tags.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Catégories</p>
              <p className="mt-0.5 text-muted-foreground">{seo.categories.join(" › ")}</p>
            </div>
            <details>
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">Description</summary>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded bg-muted/40 p-3 text-xs leading-relaxed">{seo.description}</pre>
            </details>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Score SEO</p>
            <Meter value={seo.score} />
            {seo.suggestions.length > 0 ? (
              <>
                <p className="mb-1 mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Suggestions</p>
                <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                  {seo.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </div>
      )}
    />
  );
}
