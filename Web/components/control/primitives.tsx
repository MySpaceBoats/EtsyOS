// Control Center primitives: page header, stat tiles, meters, status badges,
// tables, empty states, JSON inspector. Design notes: meters are single-hue
// (sequential = magnitude), status colors are reserved for states and always
// paired with a text label — never color alone; values and labels stay in
// ink tokens, the colored mark carries identity.

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

// Single-hue magnitude meter (0–100). Value is always shown as text next to
// the bar so the color never carries the number alone.
export function Meter({ value, max = 100, className }: { value: number; max?: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 w-full min-w-16 overflow-hidden rounded-full bg-muted" role="presentation">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {Math.round(value)}
      </span>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  // workflow / step states
  running: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  paused: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  failed: "bg-red-500/15 text-red-700 dark:text-red-300",
  pending: "bg-muted text-muted-foreground",
  skipped: "bg-muted text-muted-foreground",
  dead: "bg-red-500/15 text-red-700 dark:text-red-300",
  // fiche statuses
  Draft: "bg-muted text-muted-foreground",
  Approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  PublishRequested: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  Published: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Rejected: "bg-red-500/15 text-red-700 dark:text-red-300",
  OnHold: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Archived: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

export function SimpleTable({
  head,
  rows,
  className,
}: {
  head: ReactNode[];
  rows: ReactNode[][];
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2 font-medium text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
              {cells.map((c, j) => (
                <td key={j} className="px-3 py-2 align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      {detail ? <p className="mt-1 text-sm text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

export function JsonInspector({ label, value }: { label: string; value: unknown }) {
  return (
    <details className="group rounded-lg border">
      <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        {label}
      </summary>
      <pre className="max-h-96 overflow-auto border-t bg-muted/30 p-3 text-xs leading-relaxed">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

export function SourceTag({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
      {source}
    </span>
  );
}

export function fmtMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" });
}
