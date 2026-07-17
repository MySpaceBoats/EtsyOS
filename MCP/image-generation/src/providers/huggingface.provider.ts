import type { ImageProvider } from "./provider.interface.ts";
import { type ProviderRequest, type ProviderResult, errorFromStatus } from "../types.ts";
import { httpFetch } from "./http.ts";

export interface HuggingFaceConfig {
  apiKey: string;
  /** Swappable via config — default black-forest-labs/FLUX.1-schnell. */
  model: string;
  /** Inference Providers backend routing this model (e.g. "together", "nscale", "fal-ai"). Defaults to "together". */
  provider?: string;
  timeoutMs?: number;
}

/**
 * HuggingFace Inference Providers (router) — returns raw image bytes.
 *
 * `api-inference.huggingface.co` (the old serverless Inference API) is fully decommissioned —
 * the domain no longer resolves. HF now routes all inference through `router.huggingface.co/<provider>/models/<providerModelId>`,
 * proxying to third-party backends (together, fal-ai, nscale, replicate, ...). The request/response
 * shape (inputs/parameters in, raw image bytes out) is unchanged from the old API — only the host
 * changed — but each provider only serves specific models, so `model` must be one that provider
 * actually hosts (see https://huggingface.co/docs/inference-providers). Routing to any paid provider
 * also requires a payment method or PRO subscription on the HF account, even at pay-as-you-go rates.
 */
export class HuggingFaceProvider implements ImageProvider {
  readonly name = "huggingface";
  private readonly config: HuggingFaceConfig;
  constructor(config: HuggingFaceConfig) {
    this.config = config;
  }

  isHealthy(): boolean {
    return Boolean(this.config.apiKey && this.config.model);
  }

  async generate(request: ProviderRequest): Promise<ProviderResult> {
    const start = Date.now();
    const url = `https://router.huggingface.co/${this.config.provider ?? "together"}/models/${this.config.model}`;
    const res = await httpFetch(url, this.name, {
      method: "POST",
      headers: { authorization: `Bearer ${this.config.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        inputs: request.prompt,
        parameters: {
          negative_prompt: request.negativePrompt,
          width: request.width,
          height: request.height,
          num_inference_steps: request.steps,
          seed: request.seed,
          ...request.extra,
        },
      }),
      timeoutMs: this.config.timeoutMs,
    });

    if (!res.ok) {
      throw errorFromStatus(res.status, `${this.name}: HTTP ${res.status} ${await res.text().catch(() => "")}`.slice(0, 300), this.name);
    }

    const mimeType = res.headers.get("content-type") ?? "image/png";
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      imageBase64: buf.toString("base64"),
      mimeType,
      provider: this.name,
      model: this.config.model,
      seed: request.seed,
      generationTimeMs: Date.now() - start,
    };
  }
}
