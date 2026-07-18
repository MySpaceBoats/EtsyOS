// Integration tests: full pipeline runs through the engine — pause at the
// human validation gate, resume after approval, failure + retry, and the
// dry-run guarantee.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createEngine } from "../src/pipeline.ts";
import { createProductObject } from "../src/product-object.ts";
import { listingRelPath } from "../src/listing-bridge.ts";

async function tmpRepo(): Promise<string> {
  return mkdtemp(join(tmpdir(), "etsyos-repo-"));
}

async function writeFiche(repoRoot: string, category: string, slug: string, status: string): Promise<void> {
  const rel = listingRelPath(category, slug);
  const abs = join(repoRoot, rel);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(
    abs,
    `---\ntype: product-listing\nstatus: ${status}\nslug: ${slug}\ncategory: ${category}\ntitle_etsy: "Test ${slug}"\n---\n\nBody\n`,
    "utf8",
  );
}

test("pipeline pauses at validation gate, then resumes to completion after approval", async () => {
  const repoRoot = await tmpRepo();
  const { engine, state, events } = createEngine(repoRoot, join(repoRoot, "Core/state"));
  await state.init();
  const types: string[] = [];
  events.on("*", (e) => types.push(e.type));

  await writeFiche(repoRoot, "Mugs", "gate-mug", "Draft");
  const product = createProductObject({
    slug: "gate-mug", title: "Gate Mug", category: "Mugs",
    listingPath: listingRelPath("Mugs", "gate-mug"),
  });
  const wf = await engine.start(product, { dryRun: true });
  let result = await engine.run(wf.id);

  assert.equal(result.status, "paused");
  assert.match(result.pausedReason!, /validation humaine/i);
  const validationStep = result.steps.find((s) => s.id === "validation")!;
  assert.equal(validationStep.status, "paused");
  // The 9 steps before the gate all completed and were persisted.
  assert.equal(result.steps.filter((s) => s.status === "completed").length, 9);
  assert.ok(types.includes("workflow.paused"));

  // Human clicks "Approve" in the console → fiche status changes → resume.
  await writeFiche(repoRoot, "Mugs", "gate-mug", "Approved");
  result = await engine.run(wf.id);
  assert.equal(result.status, "completed");
  assert.ok(types.includes("workflow.completed"));

  const final = (await state.loadProduct(product.id))!;
  assert.equal(final.validation!.approved, true);
  assert.equal(final.publication!.simulated, true); // dry-run: nothing left the machine
  assert.equal(final.publication!.published, false);
  assert.equal(final.stage, "publishing");

  // Resume is idempotent: completed steps ran exactly once (validation ran twice).
  for (const s of result.steps) {
    assert.equal(s.attempts, s.id === "validation" ? 2 : 1, `step ${s.id}`);
  }
});

test("rejected fiche: workflow completes but publication is blocked", async () => {
  const repoRoot = await tmpRepo();
  const { engine, state } = createEngine(repoRoot, join(repoRoot, "Core/state"));
  await state.init();

  await writeFiche(repoRoot, "Shirts", "rejected-tee", "Rejected");
  const product = createProductObject({
    slug: "rejected-tee", title: "Rejected Tee", category: "Shirts",
    listingPath: listingRelPath("Shirts", "rejected-tee"),
  });
  const wf = await engine.start(product, { dryRun: true });
  const result = await engine.run(wf.id);

  assert.equal(result.status, "completed");
  const final = (await state.loadProduct(product.id))!;
  assert.equal(final.validation!.approved, false);
  assert.equal(final.publication!.published, false);
  assert.match(final.publication!.blockedReason!, /Validation humaine/);
});

test("pipeline-born product: validation writes the Draft fiche for the console", async () => {
  const repoRoot = await tmpRepo();
  const { engine, state } = createEngine(repoRoot, join(repoRoot, "Core/state"));
  await state.init();

  const product = createProductObject({ slug: "born-in-pipeline", title: "Born In Pipeline", category: "Wall-Art" });
  const wf = await engine.start(product, { dryRun: true });
  const result = await engine.run(wf.id);

  assert.equal(result.status, "paused");
  const rel = listingRelPath("Wall-Art", "born-in-pipeline");
  const fiche = await readFile(join(repoRoot, rel), "utf8");
  assert.match(fiche, /status: Draft/);
  assert.match(fiche, /actor: workflow-engine/);
  const final = (await state.loadProduct(product.id))!;
  assert.equal(final.listingPath, rel);
});

test("failed step marks workflow failed; retry resumes from the failed step only", async () => {
  const repoRoot = await tmpRepo();
  const { engine, state } = createEngine(repoRoot, join(repoRoot, "Core/state"));
  await state.init();

  let bombArmed = true;
  engine.register({
    id: "market-analysis",
    title: "Market Analysis (flaky for test)",
    async run(product, ctx) {
      if (bombArmed) throw new Error("transient upstream failure");
      product.market = {
        meta: { source: "offline-heuristic", generatedAt: "now", durationMs: 0 },
        competition: 50, demand: 50, priceLow: 10, priceMedian: 15, priceHigh: 20,
        monthlyVolumeEstimate: 100, seasonality: "none", notes: "test",
      };
      void ctx;
      return { result: {} };
    },
  });

  await writeFiche(repoRoot, "Mugs", "flaky-mug", "Approved");
  const product = createProductObject({
    slug: "flaky-mug", title: "Flaky Mug", category: "Mugs",
    listingPath: listingRelPath("Mugs", "flaky-mug"),
  });
  const wf = await engine.start(product, { dryRun: true });
  let result = await engine.run(wf.id);

  assert.equal(result.status, "failed");
  const failed = result.steps.find((s) => s.id === "market-analysis")!;
  assert.equal(failed.status, "failed");
  assert.match(failed.error!, /transient upstream failure/);
  assert.equal(result.steps[0].status, "completed"); // trend-discovery kept

  bombArmed = false;
  result = await engine.retry(wf.id);
  assert.equal(result.status, "completed");
  assert.equal(result.steps[0].attempts, 1); // earlier step NOT re-run
  assert.equal(result.steps.find((s) => s.id === "market-analysis")!.attempts, 2);
});

test("state index reflects paused workflows for the dashboard", async () => {
  const repoRoot = await tmpRepo();
  const { engine, state } = createEngine(repoRoot, join(repoRoot, "Core/state"));
  await state.init();
  await writeFiche(repoRoot, "Mugs", "index-mug", "Draft");
  const product = createProductObject({
    slug: "index-mug", title: "Index Mug", category: "Mugs",
    listingPath: listingRelPath("Mugs", "index-mug"),
  });
  const wf = await engine.start(product, { dryRun: true });
  await engine.run(wf.id);

  const index = await state.rebuildIndex();
  assert.equal(index.workflows.byStatus.paused, 1);
  assert.equal(index.workflows.active[0].currentStep, "validation");
  assert.equal(index.workflows.active[0].dryRun, true);
});
