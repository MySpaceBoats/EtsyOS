/**
 * Writes an Obsidian-style fiche for a generated asset under
 * <baseDir>/<category>/<YYYY-MM-DD>-<slug>.md. This is the only lifecycle op implemented for now.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";

export interface AssetMetadata {
  prompt: string;
  provider: string;
  model: string;
  category?: string;
  slug?: string;
  date?: string;
  negativePrompt?: string;
  seed?: number | null;
  generationTimeMs?: number | null;
  retries?: number | null;
  estimatedCostUsd?: number | null;
  width?: number | null;
  height?: number | null;
  r2Url?: string | null;
  r2Key?: string | null;
  checksum?: string | null;
  status?: string;
}

/** Lowercase, strip to [a-z0-9-], collapse/trim hyphens. Prevents path traversal. */
function slugify(input: string, fallback: string): string {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || fallback;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** YAML scalar: numbers/null bare, everything else JSON double-quoted (safe escaping). */
function yamlScalar(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(String(value));
}

export interface RecordAssetResult {
  path: string;
}

export function recordAsset(metadata: AssetMetadata, baseDir: string): RecordAssetResult {
  const category = slugify(metadata.category ?? "Images", "images");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(metadata.date ?? "") ? (metadata.date as string) : today();
  const slug = slugify(metadata.slug ?? metadata.prompt, "asset");

  const now = today();
  const fields: Record<string, unknown> = {
    type: "asset",
    layer: "assets",
    created: date,
    updated: now,
    status: metadata.status ?? "generated",
    provider: metadata.provider,
    model: metadata.model,
    prompt: metadata.prompt,
    negative_prompt: metadata.negativePrompt ?? null,
    seed: metadata.seed ?? null,
    generation_time_ms: metadata.generationTimeMs ?? null,
    retries: metadata.retries ?? null,
    estimated_cost_usd: metadata.estimatedCostUsd ?? null,
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    r2_url: metadata.r2Url ?? null,
    r2_key: metadata.r2Key ?? null,
    checksum: metadata.checksum ?? null,
  };

  const frontmatter = Object.entries(fields)
    .map(([k, v]) => `${k}: ${yamlScalar(v)}`)
    .join("\n");

  const body = [
    "---",
    frontmatter,
    "---",
    "",
    `# ${slug}`,
    "",
    "## Prompt",
    "",
    metadata.prompt,
    "",
    metadata.r2Url ? `## Asset\n\n![](${metadata.r2Url})\n` : "",
  ].join("\n");

  const dir = resolve(baseDir, category);
  // Guard: resolved dir must stay under baseDir.
  const root = resolve(baseDir);
  if (dir !== root && !dir.startsWith(root + sep)) {
    throw new Error(`Refusing to write outside baseDir: ${dir}`);
  }
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${date}-${slug}.md`);
  writeFileSync(path, body);
  return { path };
}
