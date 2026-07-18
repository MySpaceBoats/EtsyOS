// State Manager — the persistence layer of the Workflow Engine. Everything is
// plain JSON files under Core/state/ so that (a) a workflow can resume after
// any interruption, (b) state is committable to git and therefore readable by
// the Web console through the GitHub Contents API, and (c) a human can always
// inspect the exact state of the system with nothing but a text editor.
//
// Layout:
//   Core/state/products/<productId>.json    — Product Objects
//   Core/state/workflows/<workflowId>.json  — workflow runs (steps, logs, timings)
//   Core/state/events/<YYYY-MM-DD>.ndjson   — event log (written by EventBus)
//   Core/state/queue/tasks.json             — task queue (written by TaskQueue)
//   Core/state/index.json                   — cheap aggregate for dashboards

import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { assertProductObject, type ProductObject, type StepId } from "./product-object.ts";

export type WorkflowStatus =
  | "running"
  | "paused" // waiting on a gate (human validation)
  | "failed"
  | "completed";

export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped" | "paused";

export interface StepState {
  id: StepId;
  status: StepStatus;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  attempts: number;
  logs: string[];
  error: string | null;
  // Small, display-oriented summary of what the step produced (full data
  // lives in the Product Object section the step wrote).
  result: Record<string, unknown> | null;
}

export interface WorkflowState {
  id: string; // "wf_<slug>_<n>"
  productId: string;
  slug: string;
  pipeline: StepId[];
  dryRun: boolean;
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
  steps: StepState[];
  pausedReason: string | null;
}

export interface StateIndex {
  updatedAt: string;
  products: { total: number; byStage: Record<string, number> };
  workflows: {
    total: number;
    byStatus: Record<string, number>;
    active: { id: string; slug: string; status: WorkflowStatus; currentStep: string | null; dryRun: boolean; updatedAt: string }[];
  };
  avgStepDurationMs: Record<string, number>;
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

// Write-then-rename so an interrupted process never leaves a torn JSON file —
// the resume guarantee depends on state files always parsing.
async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  const tmp = `${path}.tmp-${process.pid}`;
  await writeFile(tmp, JSON.stringify(value, null, 2) + "\n", "utf8");
  await rename(tmp, path);
}

export class StateManager {
  readonly productsDir: string;
  readonly workflowsDir: string;
  readonly eventsDir: string;
  readonly queueDir: string;
  private indexPath: string;
  readonly stateDir: string;

  constructor(stateDir: string) {
    this.stateDir = stateDir;
    this.productsDir = join(stateDir, "products");
    this.workflowsDir = join(stateDir, "workflows");
    this.eventsDir = join(stateDir, "events");
    this.queueDir = join(stateDir, "queue");
    this.indexPath = join(stateDir, "index.json");
  }

  async init(): Promise<void> {
    for (const dir of [this.productsDir, this.workflowsDir, this.eventsDir, this.queueDir]) {
      await mkdir(dir, { recursive: true });
    }
  }

  // --- Product Objects ------------------------------------------------------

  async saveProduct(product: ProductObject): Promise<void> {
    product.updatedAt = new Date().toISOString();
    await writeJsonAtomic(join(this.productsDir, `${product.id}.json`), product);
  }

  async loadProduct(productId: string): Promise<ProductObject | null> {
    const raw = await readJson<unknown>(join(this.productsDir, `${productId}.json`));
    return raw === null ? null : assertProductObject(raw);
  }

  async listProducts(): Promise<ProductObject[]> {
    const files = await readdir(this.productsDir).catch(() => [] as string[]);
    const out: ProductObject[] = [];
    for (const f of files.filter((f) => f.endsWith(".json")).sort()) {
      const raw = await readJson<unknown>(join(this.productsDir, f));
      if (raw !== null) out.push(assertProductObject(raw));
    }
    return out;
  }

  // --- Workflows ------------------------------------------------------------

  async saveWorkflow(wf: WorkflowState): Promise<void> {
    wf.updatedAt = new Date().toISOString();
    await writeJsonAtomic(join(this.workflowsDir, `${wf.id}.json`), wf);
  }

  async loadWorkflow(workflowId: string): Promise<WorkflowState | null> {
    return readJson<WorkflowState>(join(this.workflowsDir, `${workflowId}.json`));
  }

  async listWorkflows(): Promise<WorkflowState[]> {
    const files = await readdir(this.workflowsDir).catch(() => [] as string[]);
    const out: WorkflowState[] = [];
    for (const f of files.filter((f) => f.endsWith(".json")).sort()) {
      const wf = await readJson<WorkflowState>(join(this.workflowsDir, f));
      if (wf !== null) out.push(wf);
    }
    return out;
  }

  // Next workflow id for a slug: wf_<slug>_1, wf_<slug>_2, ...
  async nextWorkflowId(slug: string): Promise<string> {
    const existing = (await this.listWorkflows()).filter((w) => w.slug === slug);
    return `wf_${slug}_${existing.length + 1}`;
  }

  // --- Aggregate index (cheap dashboard reads) ------------------------------

  async rebuildIndex(): Promise<StateIndex> {
    const products = await this.listProducts();
    const workflows = await this.listWorkflows();

    const byStage: Record<string, number> = {};
    for (const p of products) {
      const key = p.stage ?? "created";
      byStage[key] = (byStage[key] ?? 0) + 1;
    }

    const byStatus: Record<string, number> = {};
    const durations: Record<string, { total: number; n: number }> = {};
    for (const w of workflows) {
      byStatus[w.status] = (byStatus[w.status] ?? 0) + 1;
      for (const s of w.steps) {
        if (s.durationMs !== null) {
          const d = (durations[s.id] ??= { total: 0, n: 0 });
          d.total += s.durationMs;
          d.n += 1;
        }
      }
    }

    const index: StateIndex = {
      updatedAt: new Date().toISOString(),
      products: { total: products.length, byStage },
      workflows: {
        total: workflows.length,
        byStatus,
        active: workflows
          .filter((w) => w.status === "running" || w.status === "paused")
          .map((w) => ({
            id: w.id,
            slug: w.slug,
            status: w.status,
            currentStep: w.steps.find((s) => s.status !== "completed" && s.status !== "skipped")?.id ?? null,
            dryRun: w.dryRun,
            updatedAt: w.updatedAt,
          })),
      },
      avgStepDurationMs: Object.fromEntries(
        Object.entries(durations).map(([id, d]) => [id, Math.round(d.total / d.n)]),
      ),
    };
    await writeJsonAtomic(this.indexPath, index);
    return index;
  }
}
