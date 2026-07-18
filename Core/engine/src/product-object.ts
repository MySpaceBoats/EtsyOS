// The Product Object — the single data structure that flows through the whole
// pipeline. Every step reads the sections written by the steps before it and
// writes exactly one section of its own. Nothing in EtsyOS is allowed to carry
// product data in any other shape: the Web console, the queue, the event log
// and the fiches all reference Product Objects by id.

export const STEP_IDS = [
  "trend-discovery",
  "market-analysis",
  "opportunity-scoring",
  "product-planner",
  "product-generator",
  "image-generator",
  "mockup-generator",
  "seo-generator",
  "quality-assurance",
  "validation",
  "publishing",
] as const;
export type StepId = (typeof STEP_IDS)[number];

// Where the data of a section came from. Offline providers are deterministic
// heuristics that let the whole pipeline run end-to-end today, without spending
// money or calling any external API; MCP providers replace them one by one as
// they come online. The source is stored on every section so nothing offline
// can ever be mistaken for live market data.
export type DataSource =
  | "offline-heuristic"
  | "mcp-etsy"
  | "mcp-printify"
  | "mcp-image-generation"
  | "mcp-storage"
  | "human";

export interface SectionMeta {
  source: DataSource;
  generatedAt: string;
  durationMs: number;
}

export interface TrendKeyword {
  keyword: string;
  popularity: number; // 0..100
  momentum: number; // -1..1 (falling..rising)
  source: string;
}

export interface TrendResult {
  meta: SectionMeta;
  keywords: TrendKeyword[];
  season: string;
  summary: string;
}

export interface MarketResult {
  meta: SectionMeta;
  competition: number; // 0..100 (high = crowded)
  demand: number; // 0..100
  priceLow: number;
  priceMedian: number;
  priceHigh: number;
  monthlyVolumeEstimate: number;
  seasonality: string;
  notes: string;
}

export interface OpportunityResult {
  meta: SectionMeta;
  total: number; // 0..100
  seo: number;
  competition: number;
  potential: number;
  difficulty: number;
  profitability: number;
  explanation: string[];
}

export interface PlanVariant {
  name: string;
  options: string[];
}

export interface PlanResult {
  meta: SectionMeta;
  productType: string;
  collection: string;
  priority: "low" | "medium" | "high";
  variants: PlanVariant[];
  colors: string[];
  formats: string[];
}

export interface GenerationResult {
  meta: SectionMeta;
  prompt: string;
  negativePrompt: string;
  version: number;
  previousVersions: string[];
  concept: string;
}

export interface ImageAsset {
  key: string; // R2 object key (or planned key in dry-run)
  kind: "design" | "variant" | "thumbnail";
  width: number;
  height: number;
  provider: string;
  simulated: boolean;
}

export interface ImageResult {
  meta: SectionMeta;
  assets: ImageAsset[];
}

export interface MockupAsset {
  key: string;
  scene: string;
  provider: string;
  simulated: boolean;
}

export interface MockupResult {
  meta: SectionMeta;
  assets: MockupAsset[];
}

export interface SeoResult {
  meta: SectionMeta;
  title: string;
  description: string;
  tags: string[]; // Etsy max 13
  categories: string[];
  score: number; // 0..100
  suggestions: string[];
}

export interface QaCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface QaResult {
  meta: SectionMeta;
  passed: boolean;
  checks: QaCheck[];
}

// Mirror of the human decision recorded in the fiche frontmatter by the Web
// console. The engine only ever READS this — the console is the only writer.
export interface ValidationResult {
  meta: SectionMeta;
  fiche_status: string;
  approved: boolean;
  decidedBy: string | null;
}

export interface PublicationResult {
  meta: SectionMeta;
  published: boolean;
  simulated: boolean; // true = dry-run, nothing left the machine
  printifyProductId: string | null;
  etsyListingId: string | null;
  blockedReason: string | null;
}

export interface ProductHistoryEntry {
  at: string;
  step: StepId | "engine";
  event: string;
  note?: string;
}

export interface ProductObject {
  id: string; // "prod_<slug>"
  slug: string;
  title: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  // Last successfully completed pipeline step (null before the first one).
  stage: StepId | null;
  // The human-readable fiche this object is bound to, if one exists yet.
  listingPath: string | null;
  trend?: TrendResult;
  market?: MarketResult;
  opportunity?: OpportunityResult;
  plan?: PlanResult;
  generation?: GenerationResult;
  images?: ImageResult;
  mockups?: MockupResult;
  seo?: SeoResult;
  qa?: QaResult;
  validation?: ValidationResult;
  publication?: PublicationResult;
  history: ProductHistoryEntry[];
}

export function createProductObject(input: {
  slug: string;
  title: string;
  category: string;
  listingPath?: string | null;
}): ProductObject {
  const now = new Date().toISOString();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(input.slug)) {
    throw new Error(`Invalid product slug: ${JSON.stringify(input.slug)}`);
  }
  return {
    id: `prod_${input.slug}`,
    slug: input.slug,
    title: input.title,
    category: input.category,
    createdAt: now,
    updatedAt: now,
    stage: null,
    listingPath: input.listingPath ?? null,
    history: [{ at: now, step: "engine", event: "created" }],
  };
}

// Structural validation — cheap, dependency-free, run on every load so a
// corrupted state file fails loudly instead of flowing through the pipeline.
export function assertProductObject(value: unknown): ProductObject {
  const p = value as ProductObject;
  const fail = (why: string): never => {
    throw new Error(`Invalid ProductObject: ${why}`);
  };
  if (typeof p !== "object" || p === null) fail("not an object");
  if (typeof p.id !== "string" || !p.id.startsWith("prod_")) fail("bad id");
  if (typeof p.slug !== "string" || p.slug.length === 0) fail("bad slug");
  if (typeof p.category !== "string") fail("bad category");
  if (p.stage !== null && !STEP_IDS.includes(p.stage)) fail(`unknown stage ${String(p.stage)}`);
  if (!Array.isArray(p.history)) fail("history not an array");
  return p;
}
