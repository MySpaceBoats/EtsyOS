// Mirror of the Workflow Engine's public state shapes (Core/engine/src).
// The Web console reads Core/state/** through the GitHub Contents API and
// renders these — it never imports engine code (separate runtimes: engine is
// Node inside Claude Code / Actions, the console is the Cloudflare Pages edge).
// Keep in sync with Core/engine/src/{product-object,state,events,queue}.ts.

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

export const STEP_LABELS: Record<StepId, string> = {
  "trend-discovery": "Trend Discovery",
  "market-analysis": "Market Analysis",
  "opportunity-scoring": "Opportunity Scoring",
  "product-planner": "Product Planner",
  "product-generator": "Product Generator",
  "image-generator": "Image Generator",
  "mockup-generator": "Mockup Generator",
  "seo-generator": "SEO Generator",
  "quality-assurance": "Quality Assurance",
  validation: "Validation",
  publishing: "Publishing",
};

export interface SectionMeta {
  source: string;
  generatedAt: string;
  durationMs: number;
}

export interface ProductObject {
  id: string;
  slug: string;
  title: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  stage: StepId | null;
  listingPath: string | null;
  trend?: {
    meta: SectionMeta;
    keywords: { keyword: string; popularity: number; momentum: number; source: string }[];
    season: string;
    summary: string;
  };
  market?: {
    meta: SectionMeta;
    competition: number;
    demand: number;
    priceLow: number;
    priceMedian: number;
    priceHigh: number;
    monthlyVolumeEstimate: number;
    seasonality: string;
    notes: string;
  };
  opportunity?: {
    meta: SectionMeta;
    total: number;
    seo: number;
    competition: number;
    potential: number;
    difficulty: number;
    profitability: number;
    explanation: string[];
  };
  plan?: {
    meta: SectionMeta;
    productType: string;
    collection: string;
    priority: "low" | "medium" | "high";
    variants: { name: string; options: string[] }[];
    colors: string[];
    formats: string[];
  };
  generation?: {
    meta: SectionMeta;
    prompt: string;
    negativePrompt: string;
    version: number;
    previousVersions: string[];
    concept: string;
  };
  images?: {
    meta: SectionMeta;
    assets: { key: string; kind: string; width: number; height: number; provider: string; simulated: boolean }[];
  };
  mockups?: {
    meta: SectionMeta;
    assets: { key: string; scene: string; provider: string; simulated: boolean }[];
  };
  seo?: {
    meta: SectionMeta;
    title: string;
    description: string;
    tags: string[];
    categories: string[];
    score: number;
    suggestions: string[];
  };
  qa?: {
    meta: SectionMeta;
    passed: boolean;
    checks: { id: string; label: string; passed: boolean; detail: string }[];
  };
  validation?: {
    meta: SectionMeta;
    fiche_status: string;
    approved: boolean;
    decidedBy: string | null;
  };
  publication?: {
    meta: SectionMeta;
    published: boolean;
    simulated: boolean;
    printifyProductId: string | null;
    etsyListingId: string | null;
    blockedReason: string | null;
  };
  history: { at: string; step: string; event: string; note?: string }[];
}

export type WorkflowStatus = "running" | "paused" | "failed" | "completed";
export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped" | "paused";

export interface StepState {
  id: StepId;
  status: StepStatus;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  attempts: number;
  logs: string[];
  error: string | null;
  result: Record<string, unknown> | null;
}

export interface WorkflowState {
  id: string;
  productId: string;
  slug: string;
  pipeline: StepId[];
  dryRun: boolean;
  status: WorkflowStatus;
  createdAt: string;
  updatedAt: string;
  steps: StepState[];
  pausedReason: string | null;
}

export interface EtsyEvent {
  at: string;
  type: string;
  workflowId?: string;
  productId?: string;
  step?: string;
  data?: Record<string, unknown>;
}

export interface QueueTask {
  id: string;
  kind: string;
  payload: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "failed" | "dead";
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  lastError: string | null;
}

export interface StateIndex {
  updatedAt: string;
  products: { total: number; byStage: Record<string, number> };
  workflows: {
    total: number;
    byStatus: Record<string, number>;
    active: {
      id: string;
      slug: string;
      status: WorkflowStatus;
      currentStep: string | null;
      dryRun: boolean;
      updatedAt: string;
    }[];
  };
  avgStepDurationMs: Record<string, number>;
}
