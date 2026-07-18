import { getWorkflows } from "@/lib/state";
import { PageHeader, SimpleTable, StatusBadge, EmptyState, fmtDate, fmtMs } from "@/components/control/primitives";
import { WorkflowProgress, WorkflowRowLink } from "@/components/control/workflow-graph";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  const workflows = (await getWorkflows()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <>
      <PageHeader
        title="Workflows"
        description="Toutes les exécutions de la pipeline (Core/state/workflows). Un workflow en pause attend une décision humaine ; un workflow en échec se relance depuis l'étape fautive via la file d'attente."
      />
      {workflows.length === 0 ? (
        <EmptyState title="Aucun workflow" />
      ) : (
        <SimpleTable
          head={["Workflow", "Statut", "Progression", "Mode", "Durée totale", "Mis à jour"]}
          rows={workflows.map((w) => [
            <div key="id">
              <WorkflowRowLink workflow={w} />
              {w.pausedReason ? (
                <p className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">{w.pausedReason}</p>
              ) : null}
            </div>,
            <StatusBadge key="st" status={w.status} />,
            <WorkflowProgress key="pg" workflow={w} />,
            w.dryRun ? "dry-run" : "live",
            fmtMs(w.steps.reduce((s, st) => s + (st.durationMs ?? 0), 0)),
            <span key="up" className="text-xs text-muted-foreground">{fmtDate(w.updatedAt)}</span>,
          ])}
        />
      )}
    </>
  );
}
