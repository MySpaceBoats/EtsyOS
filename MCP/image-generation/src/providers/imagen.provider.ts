import type { ImageProvider } from "./provider.interface.ts";
import { type ProviderRequest, type ProviderResult, errorFromStatus, ProviderError } from "../types.ts";
import { httpFetch } from "./http.ts";

export interface ImagenConfig {
  apiKey: string;
  model: string;
  timeoutMs?: number;
}

/**
 * Google AI Studio image generation over `generateContent` (API-key auth).
 *
 * The older Imagen `:predict` REST API (instances/predictions) 404s as "no longer available to
 * new users" on newly-created Google AI Studio projects — Google routes new projects through the
 * Gemini multimodal `gemini-*-image` family instead, which shares the standard generateContent
 * shape (inlineData in the response parts) rather than Imagen's own predict/predictions shape.
 * Default model is the stable (non-preview) `gemini-2.5-flash-image`.
 */
export class ImagenProvider implements ImageProvider {
  readonly name = "imagen";
  private readonly config: ImagenConfig;
  constructor(config: ImagenConfig) {
    this.config = config;
  }

  isHealthy(): boolean {
    return Boolean(this.config.apiKey);
  }

  async generate(request: ProviderRequest): Promise<ProviderResult> {
    const start = Date.now();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`;
    const parts: Array<Record<string, unknown>> = [{ text: request.prompt }];
    const res = await httpFetch(url, this.name, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        ...request.extra,
      }),
      timeoutMs: this.config.timeoutMs,
    });

    if (!res.ok) {
      throw errorFromStatus(res.status, `${this.name}: HTTP ${res.status} ${await res.text().catch(() => "")}`.slice(0, 300), this.name);
    }

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }>;
    };
    const imagePart = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      throw new ProviderError(`${this.name}: response missing candidates[0].content.parts[].inlineData`, {
        reason: "provider_error",
        retryable: false,
        provider: this.name,
      });
    }
    return {
      imageBase64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType ?? "image/png",
      provider: this.name,
      model: this.config.model,
      seed: request.seed,
      generationTimeMs: Date.now() - start,
    };
  }
}
