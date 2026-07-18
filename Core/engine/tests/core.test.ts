// Unit tests for the engine's core abstractions: Product Object, Event Bus,
// State Manager, Task Queue.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createProductObject, assertProductObject } from "../src/product-object.ts";
import { EventBus } from "../src/events.ts";
import { StateManager } from "../src/state.ts";
import { TaskQueue } from "../src/queue.ts";

async function tmpState(): Promise<StateManager> {
  const dir = await mkdtemp(join(tmpdir(), "etsyos-state-"));
  const state = new StateManager(dir);
  await state.init();
  return state;
}

test("createProductObject: valid slug, initial history, no stage", () => {
  const p = createProductObject({ slug: "retro-cat-mug", title: "Retro Cat Mug", category: "Mugs" });
  assert.equal(p.id, "prod_retro-cat-mug");
  assert.equal(p.stage, null);
  assert.equal(p.history.length, 1);
  assert.throws(() => createProductObject({ slug: "Bad Slug!", title: "x", category: "Mugs" }));
});

test("assertProductObject: rejects corrupted objects", () => {
  assert.throws(() => assertProductObject({ id: "nope" }), /Invalid ProductObject/);
  assert.throws(() => assertProductObject(null), /Invalid ProductObject/);
  const good = createProductObject({ slug: "ok", title: "Ok", category: "Mugs" });
  assert.equal(assertProductObject(JSON.parse(JSON.stringify(good))).slug, "ok");
});

test("EventBus: emits to subscribers, persists NDJSON, recent() replays newest first", async () => {
  const state = await tmpState();
  const bus = new EventBus(state.eventsDir);
  const seen: string[] = [];
  bus.on("*", (e) => seen.push(e.type));
  bus.on("step.completed", (e) => seen.push(`only:${e.step}`));
  await bus.emit({ type: "workflow.started", workflowId: "wf_x_1" });
  await bus.emit({ type: "step.completed", workflowId: "wf_x_1", step: "seo-generator" });
  // Exact-type listeners are notified before "*" listeners.
  assert.deepEqual(seen, ["workflow.started", "only:seo-generator", "step.completed"]);
  const recent = await bus.recent(10);
  assert.equal(recent.length, 2);
  assert.equal(recent[0].type, "step.completed"); // newest first
});

test("StateManager: product + workflow round-trip and index aggregation", async () => {
  const state = await tmpState();
  const p = createProductObject({ slug: "round-trip", title: "Round Trip", category: "Shirts" });
  await state.saveProduct(p);
  const loaded = await state.loadProduct(p.id);
  assert.equal(loaded?.slug, "round-trip");

  const wfId = await state.nextWorkflowId("round-trip");
  assert.equal(wfId, "wf_round-trip_1");
  await state.saveWorkflow({
    id: wfId, productId: p.id, slug: p.slug, pipeline: ["trend-discovery"], dryRun: true,
    status: "running", createdAt: "now", updatedAt: "now", pausedReason: null,
    steps: [{ id: "trend-discovery", status: "completed", startedAt: null, finishedAt: null, durationMs: 120, attempts: 1, logs: [], error: null, result: null }],
  });
  const index = await state.rebuildIndex();
  assert.equal(index.products.total, 1);
  assert.equal(index.workflows.byStatus.running, 1);
  assert.equal(index.workflows.active[0].id, wfId);
  assert.equal(index.avgStepDurationMs["trend-discovery"], 120);
});

test("TaskQueue: FIFO claim, retry until maxAttempts, then dead", async () => {
  const state = await tmpState();
  const q = new TaskQueue(state.queueDir);
  await q.enqueue("run-pipeline", { slug: "a" }, { maxAttempts: 2 });
  await q.enqueue("run-pipeline", { slug: "b" });

  const t1 = await q.claim();
  assert.equal((t1!.payload as { slug: string }).slug, "a");
  assert.equal(t1!.attempts, 1);

  const failed = await q.fail(t1!.id, "boom");
  assert.equal(failed.status, "pending"); // 1/2 attempts → retryable

  const t1again = await q.claim();
  assert.equal(t1again!.id, t1!.id); // FIFO: same task first
  const dead = await q.fail(t1again!.id, "boom again");
  assert.equal(dead.status, "dead"); // 2/2 → dead, never dropped

  const t2 = await q.claim();
  assert.equal((t2!.payload as { slug: string }).slug, "b");
  await q.complete(t2!.id);
  assert.deepEqual((await q.list()).map((t) => t.status).sort(), ["completed", "dead"]);
});
