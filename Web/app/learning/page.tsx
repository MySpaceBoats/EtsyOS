import { getProducts } from "@/lib/state";
import { PageHeader, EmptyState, SimpleTable, StatusBadge } from "@/components/control/primitives";
import Link from "next/link";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Learning : ce que le système peut déjà apprendre de son propre état —
// décisions humaines vs scores, échecs QA récurrents, régénérations. Le vrai
// Learning-Agent (règles qui modifient les prompts/providers) est en Phase 5 ;
// cette page rend visibles les signaux qu'il consommera.
export default async function LearningPage() {
  const products = await getProducts();
  const decided = products.filter((p) => p.validation);
  if (products.length === 0) return <><PageHeader title="Learning" /><EmptyState title="Aucun produit" /></>;

  const observations: string[] = [];
  const approvedScores = decided.filter((p) => p.validation!.approved).map((p) => p.opportunity?.total ?? 0);
  const rejectedScores = decided.filter((p) => !p.validation!.approved).map((p) => p.opportunity?.total ?? 0);
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
  const avgA = avg(approvedScores);
  const avgR = avg(rejectedScores);
  if (avgA !== null && avgR !== null) {
    observations.push(
      avgA > avgR
        ? `Les produits approuvés ont un score d'opportunité moyen plus élevé (${avgA}) que les rejetés (${avgR}) — le scoring va dans le sens des décisions humaines.`
        : `Les produits rejetés ont un score d'opportunité moyen ≥ aux approuvés (${avgR} vs ${avgA}) — le scoring heuristique ne prédit pas encore la décision humaine.`,
    );
  }
  const qaFails = products.flatMap((p) => p.qa?.checks.filter((c) => !c.passed).map((c) => c.id) ?? []);
  if (qaFails.length) {
    const counts = qaFails.reduce<Record<string, number>>((m, id) => ((m[id] = (m[id] ?? 0) + 1), m), {});
    observations.push(
      `Contrôles QA en échec les plus fréquents : ${Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([id, n]) => `${id} (${n})`).join(", ")}.`,
    );
  }
  const regens = products.filter((p) => p.generation && p.generation.version > 1);
  if (regens.length) {
    observations.push(`${regens.length} produit(s) ont nécessité une régénération de prompt (versions multiples).`);
  }
  if (observations.length === 0) {
    observations.push("Pas encore assez de décisions humaines pour dégager un signal — les observations apparaîtront au fil des validations.");
  }

  return (
    <>
      <PageHeader
        title="Learning"
        description="Signaux d'apprentissage extraits de l'état réel : décisions humaines vs scores, échecs QA récurrents, régénérations. Le Learning-Agent (Phase 5) transformera ces signaux en règles et en prompts améliorés."
      />
      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Observations</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {observations.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">Produits — décision humaine vs scores</h2>
        <SimpleTable
          head={["Produit", "Score opportunité", "Score SEO", "QA", "Décision humaine"]}
          rows={products.map((p) => [
            <Link key="t" href={`/products/${p.slug}`} className="hover:underline">{p.title}</Link>,
            <span key="o" className="tabular-nums">{p.opportunity?.total ?? "—"}</span>,
            <span key="s" className="tabular-nums">{p.seo?.score ?? "—"}</span>,
            p.qa ? <StatusBadge key="q" status={p.qa.passed ? "completed" : "failed"} /> : "—",
            p.validation ? (
              <StatusBadge key="v" status={p.validation.fiche_status} />
            ) : (
              <span key="v" className="text-xs text-muted-foreground">en attente</span>
            ),
          ])}
        />
      </section>
    </>
  );
}
