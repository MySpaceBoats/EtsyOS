// Bridge between the engine and the human-readable fiches under
// Products/<Category>/Listings/<slug>.md. The fiche stays the interface the
// Web validation console reads and writes (GitHub Contents API); the engine
// reads the human decision from it and, when a product was born inside the
// pipeline, writes the initial Draft fiche so it appears in the console.
//
// Deliberately tiny YAML handling: fiches are machine-written with a stable
// field set, and the engine only needs `status` on read. Full YAML round-trips
// stay the Web console's job (js-yaml there).

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ProductObject } from "./product-object.ts";

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---/;

export function listingRelPath(category: string, slug: string): string {
  return `Products/${category}/Listings/${slug}.md`;
}

export async function readListingStatus(
  repoRoot: string,
  relPath: string,
): Promise<string | null> {
  let raw: string;
  try {
    raw = await readFile(join(repoRoot, relPath), "utf8");
  } catch {
    return null;
  }
  const fm = raw.match(FRONTMATTER_RE)?.[1];
  if (!fm) return null;
  const status = fm.match(/^status:\s*"?([A-Za-z]+)"?\s*$/m)?.[1];
  return status ?? null;
}

function yamlList(items: string[]): string {
  if (items.length === 0) return " []";
  return "\n" + items.map((i) => `  - ${JSON.stringify(i)}`).join("\n");
}

// Write the initial Draft fiche for a pipeline-born product. Never overwrites:
// an existing fiche is the human's territory.
export async function writeDraftListing(
  repoRoot: string,
  product: ProductObject,
): Promise<string> {
  const relPath = listingRelPath(product.category, product.slug);
  const abs = join(repoRoot, relPath);
  try {
    await readFile(abs, "utf8");
    return relPath; // already exists — leave it alone
  } catch {
    // fall through and create
  }
  const seo = product.seo;
  const plan = product.plan;
  const today = new Date().toISOString().slice(0, 10);
  const fm = [
    `type: product-listing`,
    `layer: products`,
    `created: "${today}"`,
    `updated: "${today}"`,
    `status: Draft`,
    `slug: ${product.slug}`,
    `category: ${product.category}`,
    `collection: ${plan ? JSON.stringify(plan.collection) : "null"}`,
    `store: null`,
    `title_etsy: ${JSON.stringify(seo?.title ?? product.title)}`,
    `description_long: ${JSON.stringify(seo?.description ?? "")}`,
    `description_short: ${JSON.stringify((seo?.description ?? "").slice(0, 160))}`,
    `tags:${yamlList(seo?.tags ?? [])}`,
    `categories_etsy:${yamlList(seo?.categories ?? [])}`,
    `price: ${product.market?.priceMedian ?? 0}`,
    `currency: EUR`,
    `sku: ${product.slug.toUpperCase().replace(/-/g, "").slice(0, 12)}`,
    `pod_provider: printify`,
    `materials: []`,
    `variants:${
      plan && plan.variants.length > 0
        ? "\n" +
          plan.variants
            .map((v) => `  - name: ${JSON.stringify(v.name)}\n    options:${yamlList(v.options).replace(/\n {2}/g, "\n    ")}`)
            .join("\n")
        : " []"
    }`,
    `colors:${yamlList(plan?.colors ?? [])}`,
    `sizes: []`,
    `images:${yamlList((product.images?.assets ?? []).map((a) => a.key))}`,
    `mockups:${yamlList((product.mockups?.assets ?? []).map((a) => a.key))}`,
    `video_url: null`,
    `image_provider: ${product.images?.assets[0]?.provider ?? "none"}`,
    `image_model: none`,
    `quality_score: ${product.qa ? (product.qa.passed ? 100 : 0) : "null"}`,
    `favorite: false`,
    `printify_product_id: null`,
    `etsy_listing_id: null`,
    `regeneration_requested: null`,
    `history:`,
    `  - date: "${new Date().toISOString()}"`,
    `    action: created`,
    `    actor: workflow-engine`,
    `    note: "Draft fiche written by the pipeline — awaiting human validation"`,
  ].join("\n");
  const body = `\n# ${seo?.title ?? product.title}\n\nFiche générée par le Workflow Engine (produit \`${product.id}\`). À valider dans la console.\n`;
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, `---\n${fm}\n---\n${body}`, "utf8");
  return relPath;
}
