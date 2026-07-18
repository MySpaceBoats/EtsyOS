// The one production pipeline. Order matters: each step consumes sections
// written by earlier steps, and the two gates (validation, publishing) sit
// at the end — nothing reaches Etsy/Printify around them.

import { WorkflowEngine } from "./engine.ts";
import { EventBus } from "./events.ts";
import { StateManager } from "./state.ts";
import type { StepId } from "./product-object.ts";
import { trendDiscovery, marketAnalysis, opportunityScoring, productPlanner } from "./steps/discovery.ts";
import { productGenerator, imageGenerator, mockupGenerator, seoGenerator } from "./steps/generation.ts";
import { qualityAssurance, validation, publishing } from "./steps/gates.ts";

export const PRODUCTION_PIPELINE: StepId[] = [
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
];

export interface EngineBundle {
  engine: WorkflowEngine;
  state: StateManager;
  events: EventBus;
}

export function createEngine(repoRoot: string, stateDir: string): EngineBundle {
  const state = new StateManager(stateDir);
  const events = new EventBus(state.eventsDir);
  const engine = new WorkflowEngine({ repoRoot, state, events, pipeline: PRODUCTION_PIPELINE });
  for (const step of [
    trendDiscovery, marketAnalysis, opportunityScoring, productPlanner,
    productGenerator, imageGenerator, mockupGenerator, seoGenerator,
    qualityAssurance, validation, publishing,
  ]) {
    engine.register(step);
  }
  return { engine, state, events };
}
