import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { recordAsset } from "../src/record-asset.ts";

const dirs: string[] = [];
function tmpBase(): string {
  const d = mkdtempSync(join(tmpdir(), "etsyos-assets-"));
  dirs.push(d);
  return d;
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

test("writes a fiche with frontmatter and the requested path shape", () => {
  const base = tmpBase();
  const { path } = recordAsset(
    {
      prompt: "watercolor fox",
      provider: "workers-ai",
      model: "flux-1-schnell",
      date: "2026-07-17",
      slug: "watercolor-fox",
      seed: 42,
      generationTimeMs: 800,
      retries: 1,
      estimatedCostUsd: 0,
      width: 1024,
      height: 1024,
      r2Url: "https://cdn.example.com/images/fox.png",
      r2Key: "images/fox.png",
      checksum: "abc123",
    },
    base,
  );

  assert.equal(path, join(base, "images", "2026-07-17-watercolor-fox.md"));
  const content = readFileSync(path, "utf8");
  assert.match(content, /^---\n/);
  assert.match(content, /type: "asset"/);
  assert.match(content, /layer: "assets"/);
  assert.match(content, /provider: "workers-ai"/);
  assert.match(content, /seed: 42/);
  assert.match(content, /generation_time_ms: 800/);
  assert.match(content, /r2_url: "https:\/\/cdn.example.com\/images\/fox.png"/);
  assert.match(content, /checksum: "abc123"/);
});

test("defaults category to Images and derives slug from prompt", () => {
  const base = tmpBase();
  const { path } = recordAsset(
    { prompt: "A Minimalist Coffee Mug!!", provider: "imagen", model: "imagen-3", date: "2026-01-02" },
    base,
  );
  assert.equal(path, join(base, "images", "2026-01-02-a-minimalist-coffee-mug.md"));
});

test("null-able fields are emitted as null, not omitted", () => {
  const base = tmpBase();
  const { path } = recordAsset({ prompt: "x", provider: "hf", model: "sdxl", date: "2026-01-02" }, base);
  const content = readFileSync(path, "utf8");
  assert.match(content, /negative_prompt: null/);
  assert.match(content, /seed: null/);
  assert.match(content, /estimated_cost_usd: null/);
});

test("category with traversal is sanitized, never escapes baseDir", () => {
  const base = tmpBase();
  const { path } = recordAsset(
    { prompt: "x", provider: "p", model: "m", category: "../../etc", date: "2026-01-02" },
    base,
  );
  assert.ok(path.startsWith(base), "path must stay under baseDir");
  assert.match(path, /etc/); // sanitized to a plain folder name, not a parent escape
});
