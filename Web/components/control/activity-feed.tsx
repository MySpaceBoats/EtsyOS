// Activity feed — renders Event Bus entries (Core/state/events NDJSON).

import Link from "next/link";
import type { EtsyEvent } from "@/lib/engine-types";
import { fmtDate } from "./primitives";
import { cn } from "@/lib/utils";

const TYPE_STYLES: Record<string, string> = {
  "workflow.started": "text-blue-700 dark:text-blue-300",
  "workflow.completed": "text-emerald-700 dark:text-emerald-300",
  "workflow.paused": "text-amber-700 dark:text-amber-300",
  "step.failed": "text-red-700 dark:text-red-300",
  "step.retried": "text-amber-700 dark:text-amber-300",
};

export function ActivityFeed({ events, limit }: { events: EtsyEvent[]; limit?: number }) {
  const shown = limit ? events.slice(0, limit) : events;
  if (shown.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun événement enregistré.</p>;
  }
  return (
    <ul className="divide-y">
      {shown.map((e, i) => (
        <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-2 text-sm">
          <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{fmtDate(e.at)}</span>
          <span className={cn("font-mono text-xs font-medium", TYPE_STYLES[e.type] ?? "")}>{e.type}</span>
          {e.workflowId ? (
            <Link href={`/workflows/${e.workflowId}`} className="font-mono text-xs text-muted-foreground hover:underline">
              {e.workflowId}
            </Link>
          ) : null}
          {e.step ? <span className="font-mono text-xs text-muted-foreground">{e.step}</span> : null}
          {e.data && Object.keys(e.data).length > 0 ? (
            <span className="truncate font-mono text-[11px] text-muted-foreground">
              {Object.entries(e.data)
                .slice(0, 3)
                .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
                .join(" ")}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
