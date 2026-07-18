// Steps 1–4: trend-discovery, market-analysis, opportunity-scoring,
// product-planner. Offline heuristic providers (deterministic, reproducible,
// zero external calls) — swapped for MCP-backed providers when the market
// MCPs come online. Each step writes exactly one Product Object section.

import type { WorkflowStep } from "../engine.ts";
import type { SectionMeta, TrendKeyword } from "../product-object.ts";
import { pick, titleWords } from "../util.ts";
import { profileFor } from "./catalog.ts";

function meta(t0: number): SectionMeta {
  return { source: "offline-heuristic", generatedAt: new Date().toISOString(), durationMs: Date.now() - t0 };
}

const SEASONS: Record<number, string> = {
  0: "new-year", 1: "valentine", 2: "spring", 3: "easter", 4: "mothers-day",
  5: "fathers-day", 6: "summer", 7: "back-to-school", 8: "autumn",
  9: "halloween", 10: "christmas-early", 11: "christmas-peak",
};

export const trendDiscovery: WorkflowStep = {
  id: "trend-discovery",
  title: "Trend Discovery",
  async run(product, ctx) {
    const t0 = Date.now();
    const profile = profileFor(product.category);
    const words = titleWords(product.title);
    const candidates = [...new Set([...words.map((w) => `${w} ${profile.productType}`), ...profile.seedKeywords])];
    const keywords: TrendKeyword[] = candidates.slice(0, 10).map((keyword) => ({
      keyword,
      popularity: pick(product.slug, `pop:${keyword}`, 35, 95),
      momentum: (pick(product.slug, `mom:${keyword}`, -10, 10)) / 10,
      source: "offline-heuristic",
    }));
    keywords.sort((a, b) => b.popularity - a.popularity);
    const season = SEASONS[new Date().getMonth()];
    ctx.log(`Derived ${keywords.length} keywords for "${product.title}" (season: ${season})`);
    product.trend = {
      meta: meta(t0),
      keywords,
      season,
      summary: `Top keyword "${keywords[0].keyword}" (popularity ${keywords[0].popularity}/100), season window: ${season}.`,
    };
    return { result: { keywords: keywords.length, topKeyword: keywords[0].keyword, season } };
  },
};

export const marketAnalysis: WorkflowStep = {
  id: "market-analysis",
  title: "Market Analysis",
  async run(product, ctx) {
    const t0 = Date.now();
    if (!product.trend) throw new Error("market-analysis requires trend-discovery output");
    const profile = profileFor(product.category);
    const top = product.trend.keywords[0];
    const competition = pick(product.slug, "competition", 30, 90);
    const demand = Math.min(100, Math.round(top.popularity * 0.7 + pick(product.slug, "demand", 0, 30)));
    const spread = profile.priceHigh - profile.priceLow;
    const priceMedian = Math.round((profile.priceLow + spread * (demand / 100)) * 100) / 100;
    product.market = {
      meta: meta(t0),
      competition,
      demand,
      priceLow: profile.priceLow,
      priceMedian,
      priceHigh: profile.priceHigh,
      monthlyVolumeEstimate: demand * pick(product.slug, "volume", 8, 25),
      seasonality: product.trend.season,
      notes: `Heuristic estimate for "${top.keyword}": demand ${demand}/100 vs competition ${competition}/100 in ${product.category}.`,
    };
    ctx.log(`Market: demand ${demand}, competition ${competition}, median price ${priceMedian}€`);
    return { result: { demand, competition, priceMedian } };
  },
};

export const opportunityScoring: WorkflowStep = {
  id: "opportunity-scoring",
  title: "Opportunity Scoring",
  async run(product, ctx) {
    const t0 = Date.now();
    const { trend, market } = product;
    if (!trend || !market) throw new Error("opportunity-scoring requires trend + market output");
    const seo = Math.round(trend.keywords.reduce((s, k) => s + k.popularity, 0) / trend.keywords.length);
    const competition = 100 - market.competition; // inverted: low competition = high score
    const potential = market.demand;
    const difficulty = Math.round((market.competition + (100 - seo)) / 2);
    const profitability = Math.round(((market.priceMedian - market.priceLow) / Math.max(1, market.priceHigh - market.priceLow)) * 100);
    const total = Math.round(seo * 0.25 + competition * 0.2 + potential * 0.3 + profitability * 0.25);
    product.opportunity = {
      meta: meta(t0),
      total, seo, competition, potential, difficulty, profitability,
      explanation: [
        `SEO ${seo}/100 — moyenne de popularité des ${trend.keywords.length} mots-clés détectés (poids 25%).`,
        `Concurrence ${competition}/100 — inverse de la saturation marché (${market.competition}/100 de concurrence brute, poids 20%).`,
        `Potentiel ${potential}/100 — demande estimée (poids 30%).`,
        `Rentabilité ${profitability}/100 — position du prix médian ${market.priceMedian}€ dans la fourchette ${market.priceLow}–${market.priceHigh}€ (poids 25%).`,
        `Difficulté ${difficulty}/100 — indicatif, non pondéré dans le total.`,
        `Score global: ${total}/100.`,
      ],
    };
    ctx.log(`Opportunity score ${total}/100`);
    return { result: { total, seo, competition, potential, difficulty, profitability } };
  },
};

export const productPlanner: WorkflowStep = {
  id: "product-planner",
  title: "Product Planner",
  async run(product, ctx) {
    const t0 = Date.now();
    if (!product.opportunity || !product.trend) throw new Error("product-planner requires scoring output");
    const profile = profileFor(product.category);
    const priority = product.opportunity.total >= 70 ? "high" : product.opportunity.total >= 45 ? "medium" : "low";
    product.plan = {
      meta: meta(t0),
      productType: profile.productType,
      collection: `${product.trend.season}-${product.category.toLowerCase()}`,
      priority,
      variants: profile.variants,
      colors: profile.colors,
      formats: profile.formats,
    };
    ctx.log(`Plan: ${profile.productType}, priority ${priority}, ${profile.variants.length} variant group(s)`);
    return { result: { priority, productType: profile.productType, collection: product.plan.collection } };
  },
};
