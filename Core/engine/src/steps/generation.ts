// Steps 5–8: product-generator, image-generator, mockup-generator,
// seo-generator. Generation steps PLAN assets deterministically (R2 keys,
// prompts, scenes) and mark them simulated until the image-generation /
// storage MCPs are wired in as live providers — the pipeline shape, state
// and events are identical either way.

import type { WorkflowStep } from "../engine.ts";
import type { ImageAsset, MockupAsset, SectionMeta } from "../product-object.ts";
import { titleWords } from "../util.ts";
import { profileFor } from "./catalog.ts";

function meta(t0: number): SectionMeta {
  return { source: "offline-heuristic", generatedAt: new Date().toISOString(), durationMs: Date.now() - t0 };
}

export const productGenerator: WorkflowStep = {
  id: "product-generator",
  title: "Product Generator",
  async run(product, ctx) {
    const t0 = Date.now();
    const { plan, trend } = product;
    if (!plan || !trend) throw new Error("product-generator requires planner output");
    const top = trend.keywords.slice(0, 3).map((k) => k.keyword);
    const version = (product.generation?.version ?? 0) + 1;
    const previous = product.generation
      ? [...product.generation.previousVersions, product.generation.prompt]
      : [];
    const concept = `${product.title} — ${plan.productType} design for the "${plan.collection}" collection, aimed at the "${top[0]}" niche.`;
    product.generation = {
      meta: meta(t0),
      prompt: [
        `Design for a ${plan.productType}: "${product.title}".`,
        `Style keywords: ${top.join(", ")}.`,
        `Colors: ${plan.colors.join(", ")}. Formats: ${plan.formats.join(", ")}.`,
        `High resolution, print-ready, no text artifacts, no watermark.`,
      ].join(" "),
      negativePrompt: "blurry, low quality, watermark, trademarked characters, brand logos",
      version,
      previousVersions: previous,
      concept,
    };
    ctx.log(`Prompt v${version} built (${product.generation.prompt.length} chars)`);
    return { result: { version, concept } };
  },
};

export const imageGenerator: WorkflowStep = {
  id: "image-generator",
  title: "Image Generator",
  async run(product, ctx) {
    const t0 = Date.now();
    const gen = product.generation;
    if (!gen) throw new Error("image-generator requires product-generator output");
    // Live provider = MCP image-generation → R2 via MCP storage. Until that
    // path is enabled from a routine, assets are planned + simulated.
    const simulated = true;
    const base = `products/${product.slug}/v${gen.version}`;
    const assets: ImageAsset[] = [
      { key: `${base}/design.png`, kind: "design", width: 4000, height: 4000, provider: "image-generation-mcp", simulated },
      { key: `${base}/design-alt.png`, kind: "variant", width: 4000, height: 4000, provider: "image-generation-mcp", simulated },
      { key: `${base}/thumb.png`, kind: "thumbnail", width: 800, height: 800, provider: "image-generation-mcp", simulated },
    ];
    product.images = { meta: meta(t0), assets };
    ctx.log(
      simulated
        ? `Planned ${assets.length} assets under ${base}/ (simulated — image-generation MCP not invoked from this run)`
        : `Generated ${assets.length} assets`,
    );
    return { result: { assets: assets.length, simulated, baseKey: base } };
  },
};

export const mockupGenerator: WorkflowStep = {
  id: "mockup-generator",
  title: "Mockup Generator",
  async run(product, ctx) {
    const t0 = Date.now();
    if (!product.images) throw new Error("mockup-generator requires image-generator output");
    const profile = profileFor(product.category);
    const version = product.generation?.version ?? 1;
    const assets: MockupAsset[] = profile.mockupScenes.map((scene) => ({
      key: `products/${product.slug}/v${version}/mockup-${scene}.png`,
      scene,
      provider: "image-generation-mcp",
      simulated: true,
    }));
    product.mockups = { meta: meta(t0), assets };
    ctx.log(`Planned ${assets.length} mockup scenes: ${profile.mockupScenes.join(", ")}`);
    return { result: { mockups: assets.length, scenes: profile.mockupScenes } };
  },
};

const TITLE_MAX = 140;
const TAGS_MAX = 13;
const TAG_CHAR_MAX = 20;

export const seoGenerator: WorkflowStep = {
  id: "seo-generator",
  title: "SEO Generator",
  async run(product, ctx) {
    const t0 = Date.now();
    const { trend, plan, market, generation } = product;
    if (!trend || !plan || !market || !generation) throw new Error("seo-generator requires upstream output");
    const profile = profileFor(product.category);
    const kws = trend.keywords.map((k) => k.keyword);

    let title = `${product.title} | ${kws[0]}`;
    for (const kw of kws.slice(1)) {
      const candidate = `${title} | ${kw}`;
      if (candidate.length > TITLE_MAX) break;
      title = candidate;
    }

    const tags = [...new Set([...kws, ...titleWords(product.title), plan.collection])]
      .map((t) => t.slice(0, TAG_CHAR_MAX).trim())
      .filter(Boolean)
      .slice(0, TAGS_MAX);

    const description = [
      generation.concept,
      ``,
      `• ${plan.variants.map((v) => `${v.name}: ${v.options.join(" / ")}`).join("\n• ")}`,
      `• Colors: ${plan.colors.join(", ")}`,
      ``,
      `Perfect for: ${kws.slice(0, 3).join(", ")}.`,
      `Ships worldwide via print-on-demand.`,
    ].join("\n");

    // Score: keyword coverage in title, tag budget usage, description length.
    const titleCoverage = kws.filter((k) => title.toLowerCase().includes(k.toLowerCase())).length / kws.length;
    const score = Math.round(
      titleCoverage * 40 + (tags.length / TAGS_MAX) * 30 + Math.min(1, description.length / 400) * 30,
    );
    const suggestions: string[] = [];
    if (tags.length < TAGS_MAX) suggestions.push(`Utiliser les ${TAGS_MAX} tags (actuellement ${tags.length}).`);
    if (title.length < 80) suggestions.push("Allonger le titre (80–140 caractères) avec des mots-clés longue traîne.");
    if (titleCoverage < 0.5) suggestions.push("Couvrir plus de mots-clés tendance dans le titre.");

    product.seo = {
      meta: meta(t0),
      title,
      description,
      tags,
      categories: profile.etsyCategories,
      score,
      suggestions,
    };
    ctx.log(`SEO: title ${title.length} chars, ${tags.length} tags, score ${score}/100`);
    return { result: { score, tags: tags.length, titleLength: title.length } };
  },
};
