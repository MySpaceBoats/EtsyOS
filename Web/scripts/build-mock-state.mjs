// Bundles Core/state/** (real output of a Workflow Engine dry-run) into
// Web/lib/mock-state.json so MOCK_DATA=1 (dev/CI) serves genuine pipeline
// data without a GitHub token. Re-run after re-seeding Core/state:
//
//   node scripts/build-mock-state.mjs

import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const stateDir = join(root, "Core/state");

async function readJsonDir(dir) {
  const out = [];
  for (const f of (await readdir(dir).catch(() => [])).filter((f) => f.endsWith(".json")).sort()) {
    out.push(JSON.parse(await readFile(join(dir, f), "utf8")));
  }
  return out;
}

const events = [];
for (const f of (await readdir(join(stateDir, "events")).catch(() => [])).sort().reverse()) {
  const lines = (await readFile(join(stateDir, "events", f), "utf8")).trim().split("\n");
  for (let i = lines.length - 1; i >= 0; i--) if (lines[i]) events.push(JSON.parse(lines[i]));
  if (events.length > 300) break;
}

const snapshot = {
  builtAt: new Date().toISOString(),
  index: JSON.parse(await readFile(join(stateDir, "index.json"), "utf8")),
  products: await readJsonDir(join(stateDir, "products")),
  workflows: await readJsonDir(join(stateDir, "workflows")),
  events,
  queue: JSON.parse(await readFile(join(stateDir, "queue/tasks.json"), "utf8").catch(() => '{"tasks":[]}')),
};

const dest = join(root, "Web/lib/mock-state.json");
await writeFile(dest, JSON.stringify(snapshot, null, 1) + "\n", "utf8");
console.log(
  `mock-state.json: ${snapshot.products.length} products, ${snapshot.workflows.length} workflows, ${snapshot.events.length} events`,
);
