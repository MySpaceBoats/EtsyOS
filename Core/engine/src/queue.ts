// Task Queue — orchestrates work the engine should do next: pipeline runs,
// retries after failure, resumes after a human decision. File-backed
// (Core/state/queue/tasks.json) for the same reasons as the State Manager:
// survives interruption, committable, readable by the Web console.
//
// This is a single-worker queue by design — Claude Code (or a GitHub Actions
// routine) is the only consumer, so there is no locking beyond atomic writes.

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type TaskKind = "run-pipeline" | "resume-workflow" | "retry-step" | "publish";
export type TaskStatus = "pending" | "running" | "completed" | "failed" | "dead";

export interface QueueTask {
  id: string;
  kind: TaskKind;
  payload: Record<string, unknown>; // e.g. { slug, workflowId, dryRun }
  status: TaskStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  lastError: string | null;
}

interface QueueFile {
  tasks: QueueTask[];
}

export class TaskQueue {
  private path: string;

  constructor(queueDir: string) {
    this.path = join(queueDir, "tasks.json");
  }

  private async read(): Promise<QueueFile> {
    try {
      return JSON.parse(await readFile(this.path, "utf8")) as QueueFile;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return { tasks: [] };
      throw err;
    }
  }

  private async write(file: QueueFile): Promise<void> {
    await mkdir(join(this.path, ".."), { recursive: true });
    const tmp = `${this.path}.tmp-${process.pid}`;
    await writeFile(tmp, JSON.stringify(file, null, 2) + "\n", "utf8");
    await rename(tmp, this.path);
  }

  async enqueue(
    kind: TaskKind,
    payload: Record<string, unknown>,
    opts: { maxAttempts?: number } = {},
  ): Promise<QueueTask> {
    const file = await this.read();
    const now = new Date().toISOString();
    const task: QueueTask = {
      id: `task_${Date.now()}_${file.tasks.length + 1}`,
      kind,
      payload,
      status: "pending",
      attempts: 0,
      maxAttempts: opts.maxAttempts ?? 3,
      createdAt: now,
      updatedAt: now,
      lastError: null,
    };
    file.tasks.push(task);
    await this.write(file);
    return task;
  }

  // Claim the oldest pending task (FIFO). Returns null when the queue is idle.
  async claim(): Promise<QueueTask | null> {
    const file = await this.read();
    const task = file.tasks.find((t) => t.status === "pending");
    if (!task) return null;
    task.status = "running";
    task.attempts += 1;
    task.updatedAt = new Date().toISOString();
    await this.write(file);
    return task;
  }

  async complete(taskId: string): Promise<void> {
    await this.transition(taskId, (t) => {
      t.status = "completed";
      t.lastError = null;
    });
  }

  // A failed task goes back to pending until maxAttempts is exhausted, then
  // becomes dead — visible in the console, never silently dropped.
  async fail(taskId: string, error: string): Promise<QueueTask> {
    return this.transition(taskId, (t) => {
      t.lastError = error;
      t.status = t.attempts >= t.maxAttempts ? "dead" : "pending";
    });
  }

  async list(): Promise<QueueTask[]> {
    return (await this.read()).tasks;
  }

  private async transition(taskId: string, mutate: (t: QueueTask) => void): Promise<QueueTask> {
    const file = await this.read();
    const task = file.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error(`Unknown task: ${taskId}`);
    mutate(task);
    task.updatedAt = new Date().toISOString();
    await this.write(file);
    return task;
  }
}
