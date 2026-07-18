// The Workflow Engine — the single orchestrator of EtsyOS. Every feature
// (trend discovery, SEO, QA, publication…) is a registered step of this
// engine, never a free-standing agent. The engine owns the run loop; steps
// own exactly one section of the Product Object each.
//
// Guarantees:
//  - every transition is persisted BEFORE and AFTER a step runs (resumable);
//  - every transition emits an event on the Event Bus (observable);
//  - a paused workflow (human validation gate) resumes with the same call;
//  - dry-run flows through the ENTIRE pipeline and is stored on the state,
//    so nothing downstream can forget it was a simulation.

import type { EventBus } from "./events.ts";
import type { ProductObject, StepId } from "./product-object.ts";
import type { StateManager, StepState, WorkflowState } from "./state.ts";

export interface StepContext {
  dryRun: boolean;
  repoRoot: string;
  state: StateManager;
  events: EventBus;
  log: (message: string) => void;
}

export interface StepOutcome {
  // Display-oriented summary persisted on the workflow step state.
  result: Record<string, unknown>;
  // Set to pause the workflow at this step (e.g. waiting for human
  // validation). The step will re-run on resume.
  pause?: string;
}

export interface WorkflowStep {
  id: StepId;
  title: string;
  run(product: ProductObject, ctx: StepContext): Promise<StepOutcome>;
}

interface EngineOptions {
  repoRoot: string;
  state: StateManager;
  events: EventBus;
  pipeline: StepId[];
}

export class WorkflowEngine {
  private steps = new Map<StepId, WorkflowStep>();
  private opts: EngineOptions;

  constructor(opts: EngineOptions) {
    this.opts = opts;
  }

  register(step: WorkflowStep): void {
    this.steps.set(step.id, step);
  }

  // Create a new workflow run for a product. Does not execute anything yet.
  async start(product: ProductObject, options: { dryRun: boolean }): Promise<WorkflowState> {
    const { state, events, pipeline } = this.opts;
    for (const id of pipeline) {
      if (!this.steps.has(id)) throw new Error(`Pipeline references unregistered step: ${id}`);
    }
    await state.saveProduct(product);
    const now = new Date().toISOString();
    const wf: WorkflowState = {
      id: await state.nextWorkflowId(product.slug),
      productId: product.id,
      slug: product.slug,
      pipeline: [...pipeline],
      dryRun: options.dryRun,
      status: "running",
      createdAt: now,
      updatedAt: now,
      pausedReason: null,
      steps: pipeline.map(
        (id): StepState => ({
          id,
          status: "pending",
          startedAt: null,
          finishedAt: null,
          durationMs: null,
          attempts: 0,
          logs: [],
          error: null,
          result: null,
        }),
      ),
    };
    await state.saveWorkflow(wf);
    await events.emit({
      type: "workflow.started",
      workflowId: wf.id,
      productId: product.id,
      data: { dryRun: wf.dryRun, pipeline: wf.pipeline },
    });
    return wf;
  }

  // Execute (or resume) a workflow until it completes, pauses or fails.
  // Idempotent over completed steps — this is the resume path too.
  async run(workflowId: string): Promise<WorkflowState> {
    const { state, events, repoRoot } = this.opts;
    const wf = await state.loadWorkflow(workflowId);
    if (!wf) throw new Error(`Unknown workflow: ${workflowId}`);
    const product = await state.loadProduct(wf.productId);
    if (!product) throw new Error(`Workflow ${workflowId} references missing product ${wf.productId}`);

    if (wf.status === "completed") return wf;
    wf.status = "running";
    wf.pausedReason = null;

    for (const stepState of wf.steps) {
      if (stepState.status === "completed" || stepState.status === "skipped") continue;
      const step = this.steps.get(stepState.id)!;

      stepState.status = "running";
      stepState.attempts += 1;
      stepState.startedAt = new Date().toISOString();
      stepState.error = null;
      await state.saveWorkflow(wf);
      await events.emit({
        type: "step.started",
        workflowId: wf.id,
        productId: product.id,
        step: step.id,
        data: { attempt: stepState.attempts, dryRun: wf.dryRun },
      });

      const t0 = Date.now();
      const ctx: StepContext = {
        dryRun: wf.dryRun,
        repoRoot,
        state,
        events,
        log: (m) => stepState.logs.push(`[${new Date().toISOString()}] ${m}`),
      };

      try {
        const outcome = await step.run(product, ctx);
        stepState.durationMs = Date.now() - t0;
        stepState.finishedAt = new Date().toISOString();
        stepState.result = outcome.result;

        if (outcome.pause) {
          stepState.status = "paused";
          wf.status = "paused";
          wf.pausedReason = outcome.pause;
          await state.saveProduct(product);
          await state.saveWorkflow(wf);
          await state.rebuildIndex();
          await events.emit({
            type: "workflow.paused",
            workflowId: wf.id,
            productId: product.id,
            step: step.id,
            data: { reason: outcome.pause },
          });
          return wf;
        }

        stepState.status = "completed";
        product.stage = step.id;
        product.history.push({
          at: new Date().toISOString(),
          step: step.id,
          event: "completed",
        });
        await state.saveProduct(product);
        await state.saveWorkflow(wf);
        await events.emit({
          type: "step.completed",
          workflowId: wf.id,
          productId: product.id,
          step: step.id,
          data: { durationMs: stepState.durationMs, ...outcome.result },
        });
      } catch (err) {
        stepState.durationMs = Date.now() - t0;
        stepState.finishedAt = new Date().toISOString();
        stepState.status = "failed";
        stepState.error = err instanceof Error ? err.message : String(err);
        wf.status = "failed";
        await state.saveProduct(product);
        await state.saveWorkflow(wf);
        await state.rebuildIndex();
        await events.emit({
          type: "step.failed",
          workflowId: wf.id,
          productId: product.id,
          step: step.id,
          data: { error: stepState.error, attempt: stepState.attempts },
        });
        return wf;
      }
    }

    wf.status = "completed";
    await state.saveWorkflow(wf);
    await state.rebuildIndex();
    await events.emit({
      type: "workflow.completed",
      workflowId: wf.id,
      productId: product.id,
      data: { dryRun: wf.dryRun },
    });
    return wf;
  }

  // Reset a failed step to pending and re-run the workflow from there.
  async retry(workflowId: string): Promise<WorkflowState> {
    const wf = await this.opts.state.loadWorkflow(workflowId);
    if (!wf) throw new Error(`Unknown workflow: ${workflowId}`);
    const failed = wf.steps.find((s) => s.status === "failed");
    if (!failed) return this.run(workflowId);
    failed.status = "pending";
    failed.error = null;
    wf.status = "running";
    await this.opts.state.saveWorkflow(wf);
    await this.opts.events.emit({
      type: "step.retried",
      workflowId: wf.id,
      step: failed.id,
    });
    return this.run(workflowId);
  }
}
