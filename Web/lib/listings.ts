import yaml from "js-yaml";

// The set of product statuses the console can move a fiche through. Every value
// is a *request* recorded in frontmatter — no status change here ever calls an
// external API. A future GitHub Actions routine acts on them. See Web/README.md.
export const STATUSES = [
  "Draft",
  "Approved",
  "PublishRequested",
  "Published",
  "Rejected",
  "OnHold",
  "Archived",
] as const;
export type Status = (typeof STATUSES)[number];

export const REGENERATION_TYPES = [
  "images",
  "mockups",
  "video",
  "title",
  "description",
  "tags",
  "all",
] as const;
export type RegenerationType = (typeof REGENERATION_TYPES)[number];

// Product categories that hold a Listings/ subfolder with seed data. Only these
// are scanned — the other category folders are left untouched per the brief.
export const CATEGORIES_WITH_LISTINGS = ["Mugs", "Shirts", "Wall-Art"] as const;

export interface HistoryEntry {
  date: string;
  action: string;
  actor: string;
  note?: string;
  [key: string]: unknown;
}

export interface Variant {
  name: string;
  options: string[];
}

export interface Listing {
  type: string;
  layer: string;
  created: string;
  updated: string;
  status: Status;
  slug: string;
  category: string;
  collection: string | null;
  store: string | null;
  title_etsy: string;
  description_long: string;
  description_short: string;
  tags: string[];
  categories_etsy: string[];
  price: number;
  currency: string;
  sku: string;
  pod_provider: string;
  materials: string[];
  variants: Variant[];
  colors: string[];
  sizes: string[];
  images: string[];
  mockups: string[];
  video_url: string | null;
  image_provider: string;
  image_model: string;
  quality_score: number | null;
  favorite: boolean;
  printify_product_id: string | null;
  etsy_listing_id: string | null;
  regeneration_requested: RegenerationType | null;
  history: HistoryEntry[];
}

// A parsed fiche = its frontmatter (typed) + the raw markdown body + the git
// blob SHA (needed to write back through the GitHub Contents API).
export interface ParsedListing {
  data: Listing;
  body: string;
  sha: string | null;
  path: string;
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseListing(
  content: string,
  path: string,
  sha: string | null,
): ParsedListing {
  const match = content.match(FRONTMATTER_RE);
  if (!match) {
    throw new Error(`Fiche has no YAML frontmatter: ${path}`);
  }
  const data = yaml.load(match[1]) as Listing;
  return { data, body: match[2] ?? "", sha, path };
}

export function serializeListing(data: Listing, body: string): string {
  const frontmatter = yaml.dump(data, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });
  const trimmedBody = body.replace(/^\n+/, "");
  return `---\n${frontmatter}---\n\n${trimmedBody}`;
}

export function listingPath(category: string, slug: string): string {
  return `Products/${category}/Listings/${slug}.md`;
}

export function isMarkdownFile(name: string): boolean {
  return name.endsWith(".md");
}
