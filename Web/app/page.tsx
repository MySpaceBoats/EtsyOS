import Link from "next/link";
import { getProducts, getQueue, getRecentEvents, getStateIndex, getWorkflows } from "@/lib/state";
import { STEP_IDS, STEP_LABELS, type StepId } from "@/lib/engine-types";
import { PageHeader, StatCard, Meter, StatusBadge, EmptyState, fmtMs, fmtDate } from "@/components/control/primitives";
import { WorkflowProgress, WorkflowRowLink } from "@/components/control/workflow-graph";
import { ActivityFeed } from "@/components/control/activity-feed";
import printifySnapshot from "@/lib/printify-snapshot.json";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [index, workflows, products, events, queue] = await Promise.all([
    getStateIndex(),
    getWorkflows(),
    getProducts(),
    getRecentEvents(40),
    getQueue(),
  ]);

  if (!index) {
    return (
      <EmptyState
        title="Aucun état de pipeline"
        detail="Core/state est vide — lancer `npm run pipeline -- run-all --dry-run` dans Core/engine."
      />
    );
  }

  const published = products.filter((p) => p.publication?.published).length;
  const simulated = products.filter((p) => p.publication?.simulated && !p.publication.blockedReason).length;
  const awaiting = workflows.filter((w) => w.status === "paused").length;
  const rejected = products.filter((p) => p.validation && !p.validation.approved).length;
  const failed = workflows.filter((w) => w.status === "failed").length;
  const pendingTasks = queue.filter((t) => t.status === "pending" || t.status === "running").length;
  const deadTasks = queue.filter((t) => t.status === "dead").length;

  const totalDuration = (w: (typeof workflows)[number]) =>
    w.steps.reduce((s, st) => s + (st.durationMs ?? 0), 0);
  const doneWfs = workflows.filter((w) => w.status === "completed");
  const avgWorkflowMs = doneWfs.length
    ? Math.round(doneWfs.reduce((s, w) => s + totalDuration(w), 0) / doneWfs.length)
    : null;

  // Products per pipeline stage — magnitude, single hue.
  const stageCounts = STEP_IDS.map((id) => ({
    id,
    count: products.filter((p) => p.stage === id).length,
  }));
  const maxStage = Math.max(1, ...stageCounts.map((s) => s.count));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="État temps réel du système : workflows, files d'attente, produits et activité du Workflow Engine."
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Workflows actifs" value={index.workflows.active.length} hint={`${index.workflows.total} au total`} />
        <StatCard label="En attente de validation" value={awaiting} hint="pause au gate humain" />
        <StatCard label="Produits" value={index.products.total} hint={`${published} publiés · ${simulated} simulés (dry-run)`} />
        <StatCard label="Rejetés" value={rejected} hint="décision humaine" />
        <StatCard label="Erreurs workflow" value={failed} hint={failed ? "voir Workflows" : "aucune"} />
        <StatCard label="Tâches en file" value={pendingTasks} hint={deadTasks ? `${deadTasks} morte(s)` : "file saine"} />
        <StatCard label="Durée moyenne pipeline" value={fmtMs(avgWorkflowMs)} hint={`${doneWfs.length} run(s) terminés`} />
        <StatCard label="Dernière activité" value={<span className="text-base">{fmtDate(index.updatedAt)}</span>} />
      </div>

      <section className="mt-6 rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Boutique Printify connectée</h2>
          <span className="text-xs text-muted-foreground">
            Snapshot statique — jamais d&apos;appel live depuis cette page (voir /mcp) · relevé le{" "}
            {fmtDate(printifySnapshot.fetchedAt)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Boutique" value={printifySnapshot.shopTitle} hint={`canal ${printifySnapshot.salesChannel}`} />
          <StatCard
            label="Produits"
            value={printifySnapshot.totalProducts}
            hint={`${printifySnapshot.visibleProducts} visibles`}
          />
          <StatCard label="Blueprints distincts" value={printifySnapshot.distinctBlueprints} />
          <StatCard
            label="Prix"
            value={`$${printifySnapshot.avgPriceUsd}`}
            hint={`moy. · $${printifySnapshot.minPriceUsd}–$${printifySnapshot.maxPriceUsd}`}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Workflows en cours</h2>
            <Link href="/workflows" className="text-xs text-muted-foreground hover:underline">
              Tout voir →
            </Link>
          </div>
          {index.workflows.active.length === 0 ? (
            <EmptyState title="Aucun workflow actif" detail="Tous les runs sont terminés ou en échec." />
          ) : (
            <ul className="divide-y">
              {workflows
                .filter((w) => w.status === "running" || w.status === "paused")
                .map((w) => (
                  <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <WorkflowRowLink workflow={w} />
                      {w.pausedReason ? (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{w.pausedReason}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      {w.dryRun ? <span className="rounded border px-1.5 text-[10px] text-muted-foreground">DRY-RUN</span> : null}
                      <StatusBadge status={w.status} />
                      <WorkflowProgress workflow={w} />
                    </div>
                  </li>
                ))}
            </ul>
          )}

          <h2 className="mb-3 mt-6 text-sm font-semibold">Produits par étape de pipeline</h2>
          <ul className="space-y-1.5">
            {stageCounts
              .filter((s) => s.count > 0)
              .map((s) => (
                <li key={s.id} className="grid grid-cols-[10rem_1fr] items-center gap-2 text-sm">
                  <span className="truncate text-muted-foreground">{STEP_LABELS[s.id as StepId]}</span>
                  <Meter value={s.count} max={maxStage} />
                </li>
              ))}
          </ul>
        </section>

        <section className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Activité récente</h2>
            <Link href="/logs" className="text-xs text-muted-foreground hover:underline">
              Logs & événements →
            </Link>
          </div>
          <ActivityFeed events={events} limit={14} />
        </section>
      </div>
    </>
  );
}
