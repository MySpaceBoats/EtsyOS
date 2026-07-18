import { getRecentEvents, getWorkflows } from "@/lib/state";
import { PageHeader, EmptyState } from "@/components/control/primitives";
import { ActivityFeed } from "@/components/control/activity-feed";
import { STEP_LABELS } from "@/lib/engine-types";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Logs & événements : le journal complet de l'Event Bus + les logs par étape
// portés par chaque workflow. Les logs Etsy/Printify/Cloudflare viendront des
// providers MCP correspondants quand ils seront branchés en live — le moteur
// consignera alors leurs appels dans les mêmes step logs.
export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const [events, workflows] = await Promise.all([getRecentEvents(200), getWorkflows()]);
  const types = [...new Set(events.map((e) => e.type))].sort();
  const filtered = type ? events.filter((e) => e.type === type) : events;

  return (
    <>
      <PageHeader
        title="Logs & événements"
        description="Journal de l'Event Bus (Core/state/events, NDJSON append-only) et logs des étapes de chaque workflow."
      />
      <div className="mb-4 flex flex-wrap gap-1.5 text-xs">
        <a
          href="/logs"
          className={`rounded-full border px-2.5 py-1 ${!type ? "bg-accent font-medium" : "text-muted-foreground hover:text-foreground"}`}
        >
          Tous ({events.length})
        </a>
        {types.map((t) => (
          <a
            key={t}
            href={`/logs?type=${encodeURIComponent(t)}`}
            className={`rounded-full border px-2.5 py-1 font-mono ${type === t ? "bg-accent font-medium" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </a>
        ))}
      </div>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Événements</h2>
        {filtered.length === 0 ? <EmptyState title="Aucun événement pour ce filtre" /> : <ActivityFeed events={filtered} />}
      </section>

      <section className="mt-6 rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Logs des étapes (par workflow)</h2>
        <div className="space-y-2">
          {workflows.map((w) => (
            <details key={w.id} className="rounded-lg border">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
                {w.id} <span className="text-xs font-normal text-muted-foreground">({w.status})</span>
              </summary>
              <div className="space-y-2 border-t p-3">
                {w.steps
                  .filter((s) => s.logs.length > 0 || s.error)
                  .map((s) => (
                    <div key={s.id}>
                      <p className="text-xs font-medium text-muted-foreground">{STEP_LABELS[s.id]}</p>
                      <pre className="mt-1 overflow-x-auto rounded bg-muted/40 p-2 text-[11px] leading-relaxed">
                        {[...s.logs, ...(s.error ? [`ERROR: ${s.error}`] : [])].join("\n")}
                      </pre>
                    </div>
                  ))}
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
