// Workflow Visualizer — the pipeline as a vertical graph. Each node shows
// step state, duration, attempts, result summary and logs (disclosure).
// Status is conveyed by badge text + icon shape, never color alone.

import Link from "next/link";
import { STEP_LABELS, type StepState, type WorkflowState } from "@/lib/engine-types";
import { StatusBadge, fmtMs } from "./primitives";
import { cn } from "@/lib/utils";

function NodeIcon({ status }: { status: StepState["status"] }) {
  const base = "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold";
  switch (status) {
    case "completed":
      return <span className={cn(base, "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300")}>✓</span>;
    case "failed":
      return <span className={cn(base, "border-red-500/50 bg-red-500/15 text-red-700 dark:text-red-300")}>✕</span>;
    case "paused":
      return <span className={cn(base, "border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300")}>⏸</span>;
    case "running":
      return <span className={cn(base, "border-blue-500/50 bg-blue-500/15 text-blue-700 dark:text-blue-300")}>▶</span>;
    default:
      return <span className={cn(base, "border-border bg-muted text-muted-foreground")}>·</span>;
  }
}

export function WorkflowGraph({ workflow, compact = false }: { workflow: WorkflowState; compact?: boolean }) {
  return (
    <ol className="relative">
      {workflow.steps.map((step, i) => (
        <li key={step.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < workflow.steps.length - 1 ? (
            <span aria-hidden className="absolute left-[13px] top-8 h-[calc(100%-1.75rem)] w-px bg-border" />
          ) : null}
          <NodeIcon status={step.status} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{STEP_LABELS[step.id]}</span>
              <StatusBadge status={step.status} />
              <span className="text-xs tabular-nums text-muted-foreground">{fmtMs(step.durationMs)}</span>
              {step.attempts > 1 ? (
                <span className="text-xs text-muted-foreground">{step.attempts} tentatives</span>
              ) : null}
            </div>
            {step.error ? (
              <p className="mt-1 rounded bg-red-500/10 px-2 py-1 text-xs text-red-700 dark:text-red-300">
                {step.error}
              </p>
            ) : null}
            {!compact && step.result && Object.keys(step.result).length > 0 ? (
              <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                {Object.entries(step.result)
                  .slice(0, 4)
                  .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
                  .join("  ")}
              </p>
            ) : null}
            {!compact && step.logs.length > 0 ? (
              <details className="mt-1">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  {step.logs.length} ligne(s) de log
                </summary>
                <pre className="mt-1 overflow-x-auto rounded bg-muted/40 p-2 text-[11px] leading-relaxed">
                  {step.logs.join("\n")}
                </pre>
              </details>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

// Compact horizontal progress strip for workflow lists.
export function WorkflowProgress({ workflow }: { workflow: WorkflowState }) {
  return (
    <div className="flex items-center gap-1" title={workflow.steps.map((s) => `${s.id}: ${s.status}`).join("\n")}>
      {workflow.steps.map((s) => (
        <span
          key={s.id}
          className={cn(
            "h-2 w-4 rounded-sm",
            s.status === "completed" && "bg-emerald-500/70",
            s.status === "failed" && "bg-red-500/70",
            s.status === "paused" && "bg-amber-500/70",
            s.status === "running" && "bg-blue-500/70",
            (s.status === "pending" || s.status === "skipped") && "bg-muted",
          )}
        />
      ))}
    </div>
  );
}

export function WorkflowRowLink({ workflow }: { workflow: WorkflowState }) {
  const current = workflow.steps.find((s) => s.status !== "completed" && s.status !== "skipped");
  return (
    <Link href={`/workflows/${workflow.id}`} className="font-medium hover:underline">
      {workflow.id}
      {current ? (
        <span className="ml-2 text-xs font-normal text-muted-foreground">→ {STEP_LABELS[current.id]}</span>
      ) : null}
    </Link>
  );
}
