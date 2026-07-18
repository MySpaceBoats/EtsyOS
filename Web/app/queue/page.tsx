import { getQueue } from "@/lib/state";
import { PageHeader, SimpleTable, StatusBadge, EmptyState, fmtDate } from "@/components/control/primitives";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const tasks = (await getQueue()).slice().reverse();
  return (
    <>
      <PageHeader
        title="File d'attente"
        description="Task Queue du Workflow Engine (Core/state/queue/tasks.json). Une tâche échouée repasse en pending jusqu'à épuisement de ses tentatives, puis devient morte — jamais supprimée en silence. Le moteur est le seul exécuteur ; la console ne fait qu'ajouter des intentions."
      />
      {tasks.length === 0 ? (
        <EmptyState title="File vide" detail="Aucune tâche enregistrée." />
      ) : (
        <SimpleTable
          head={["Tâche", "Type", "Payload", "Statut", "Tentatives", "Dernière erreur", "Mise à jour"]}
          rows={tasks.map((t) => [
            <span key="id" className="font-mono text-xs">{t.id}</span>,
            <span key="k" className="font-mono text-xs">{t.kind}</span>,
            <span key="p" className="font-mono text-[11px] text-muted-foreground">
              {JSON.stringify(t.payload)}
            </span>,
            <StatusBadge key="s" status={t.status} />,
            <span key="a" className="tabular-nums">{t.attempts}/{t.maxAttempts}</span>,
            t.lastError ? (
              <span key="e" className="text-xs text-red-700 dark:text-red-300">{t.lastError}</span>
            ) : (
              "—"
            ),
            <span key="u" className="text-xs text-muted-foreground">{fmtDate(t.updatedAt)}</span>,
          ])}
        />
      )}
    </>
  );
}
