import type { ImageProvider } from "./provider.interface.ts";
import { type ProviderRequest, type ProviderResult, errorFromStatus, ProviderError } from "../types.ts";
import { httpFetch } from "./http.ts";

export interface WorkersAiConfig {
  accountId: string;
  apiToken: string;
  model: string;
  timeoutMs?: number;
}

/** Cloudflare Workers AI REST — @cf/black-forest-labs/flux-1-schnell by default. */
export class WorkersAiProvider implements ImageProvider {
  readonly name = "workers-ai";
  private readonly config: WorkersAiConfig;
  constructor(config: WorkersAiConfig) {
    this.config = config;
  }

  isHealthy(): boolean {
    return Boolean(this.config.accountId && this.config.apiToken);
  }

  async generate(request: ProviderRequest): Promise<ProviderResult> {
    const start = Date.now();
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/ai/run/${this.config.model}`;
    const res = await httpFetch(url, this.name, {
      method: "POST",
      headers: { authorization: `Bearer ${this.config.apiToken}`, "content-type": "application/json" },
      body: JSON.stringify({
        prompt: request.prompt,
        negative_prompt: request.negativePrompt,
        width: request.width,
        height: request.height,
        seed: request.seed,
        steps: request.steps,
        ...request.extra,
      }),
      timeoutMs: this.config.timeoutMs,
    });

    if (!res.ok) {
      throw errorFromStatus(res.status, `${this.name}: HTTP ${res.status} ${await res.text().catch(() => "")}`.slice(0, 300), this.name);
    }

    const json = (await res.json()) as { result?: { image?: string }; success?: boolean };
    const image = json.result?.image;
    if (!image) {
      throw new ProviderError(`${this.name}: response missing result.image`, {
        reason: "provider_error",
        retryable: false,
        provider: this.name,
      });
    }
    return {
      imageBase64: image,
      mimeType: "image/jpeg",
      provider: this.name,
      model: this.config.model,
      seed: request.seed,
      generationTimeMs: Date.now() - start,
    };
  }
}
