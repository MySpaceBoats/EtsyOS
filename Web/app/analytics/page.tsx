import { getProducts, getStateIndex, getWorkflows } from "@/lib/state";
import { PageHeader, StatCard, Meter, EmptyState, fmtMs } from "@/components/control/primitives";
import { STEP_LABELS, type StepId } from "@/lib/engine-types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Analytics : aujourd'hui, les métriques de production réelles du moteur
// (débit de pipeline, durées, taux de passage des gates). Ventes / CTR /
// conversion / favoris arriveront de l'API Etsy via le MCP etsy (Phase 5) —
// affichés ici dès que le provider live existera. Pas de chiffres inventés.
export default async function AnalyticsPage() {
  const [index, products, workflows] = await Promise.all([getStateIndex(), getProducts(), getWorkflows()]);
  if (!index) return <EmptyState title="Aucun état de pipeline" />;

  const done = workflows.filter((w) => w.status === "completed").length;
  const qaPass = products.filter((p) => p.qa?.passed).length;
  const qaTotal = products.filter((p) => p.qa).length;
  const approved = products.filter((p) => p.validation?.approved).length;
  const decided = products.filter((p) => p.validation).length;
  const avgSeo = products.filter((p) => p.seo).length
    ? Math.round(products.reduce((s, p) => s + (p.seo?.score ?? 0), 0) / products.filter((p) => p.seo).length)
    : 0;
  const avgOpp = products.filter((p) => p.opportunity).length
    ? Math.round(products.reduce((s, p) => s + (p.opportunity?.total ?? 0), 0) / products.filter((p) => p.opportunity).length)
    : 0;

  const durations = Object.entries(index.avgStepDurationMs) as [StepId, number][];
  const maxDur = Math.max(1, ...durations.map(([, v]) => v));

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Métriques de production du Workflow Engine. Les métriques de vente (revenus, CTR, conversion, favoris, visites) seront alimentées par le MCP etsy en Phase 5 — cette page ne montre jamais de chiffres simulés comme s'ils étaient réels."
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Pipelines terminées" value={done} hint={`${workflows.length} exécutions`} />
        <StatCard label="Taux de passage QA" value={qaTotal ? `${Math.round((qaPass / qaTotal) * 100)}%` : "—"} hint={`${qaPass}/${qaTotal} produits`} />
        <StatCard label="Taux d'approbation humaine" value={decided ? `${Math.round((approved / decided) * 100)}%` : "—"} hint={`${approved}/${decided} décisions`} />
        <StatCard label="Scores moyens" value={`${avgOpp} · ${avgSeo}`} hint="opportunité · SEO (sur 100)" />
      </div>

      <section className="mt-6 rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Durée moyenne par étape</h2>
        <ul className="space-y-1.5">
          {durations.map(([id, v]) => (
            <li key={id} className="grid grid-cols-[11rem_1fr_4rem] items-center gap-2 text-sm">
              <span className="truncate text-muted-foreground">{STEP_LABELS[id] ?? id}</span>
              <Meter value={v} max={maxDur} />
              <span className="text-right text-xs tabular-nums text-muted-foreground">{fmtMs(v)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <h2 className="mb-1 font-medium text-foreground">Métriques de vente — en attente du provider live</h2>
        <p>
          Ventes, revenus, CTR, conversion, favoris et visites nécessitent l&apos;API Etsy (MCP etsy, lecture seule) branchée
          comme provider de l&apos;étape analytics — planifié en Phase 5 de la ROADMAP. Aucune donnée fictive n&apos;est affichée ici.
        </p>
      </section>
    </>
  );
}
