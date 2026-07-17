import type { ImageProvider } from "./providers/provider.interface.ts";
import { WorkersAiProvider } from "./providers/workers-ai.provider.ts";
import { ImagenProvider } from "./providers/imagen.provider.ts";
import { HuggingFaceProvider } from "./providers/huggingface.provider.ts";
import { ProviderManager } from "./provider-manager.ts";
import { RetryManager } from "./retry-manager.ts";
import { HealthMonitor } from "./health-monitor.ts";
import { MetricsCollector } from "./metrics-collector.ts";
import { Logger } from "./logger.ts";
import type { ImageGenConfig } from "./config.ts";
import type { ProviderRequest, ProviderResult } from "./types.ts";

export interface GenerateOptions {
  negativePrompt?: string;
  width?: number;
  height?: number;
  seed?: number;
  steps?: number;
  extra?: Record<string, unknown>;
}

export interface ImageGenerator {
  generate(prompt: string, options?: GenerateOptions): Promise<ProviderResult>;
  metrics: MetricsCollector;
}

type Env = Record<string, string | undefined>;

/** Wires providers (secrets from env), manager, retry, health, metrics, logger. */
export function buildImageGenerator(config: ImageGenConfig, env: Env = process.env): ImageGenerator {
  const providers: ImageProvider[] = [];

  const wa = config.providers["workers-ai"];
  if (wa) {
    providers.push(
      new WorkersAiProvider({
        accountId: env.CF_ACCOUNT_ID ?? "",
        apiToken: env.CF_API_TOKEN ?? "",
        model: wa.model,
        timeoutMs: wa.timeoutMs,
      }),
    );
  }
  const im = config.providers["imagen"];
  if (im) {
    providers.push(
      new ImagenProvider({ apiKey: env.GOOGLE_AI_STUDIO_API_KEY ?? "", model: im.model, timeoutMs: im.timeoutMs }),
    );
  }
  const hf = config.providers["huggingface"];
  if (hf) {
    providers.push(
      new HuggingFaceProvider({ apiKey: env.HUGGINGFACE_API_KEY ?? "", model: hf.model, provider: hf.provider, timeoutMs: hf.timeoutMs }),
    );
  }

  const metrics = new MetricsCollector();
  const costPerImageUsd: Record<string, number> = {};
  for (const [name, entry] of Object.entries(config.providers)) {
    costPerImageUsd[name] = entry.costPerImageUsd ?? 0;
  }

  const manager = new ProviderManager({
    providers,
    order: config.priority,
    retryManager: new RetryManager(config.retry),
    healthMonitor: new HealthMonitor(config.health.cooldownMs),
    metrics,
    logger: new Logger(),
    costPerImageUsd,
  });

  return {
    metrics,
    async generate(prompt, options = {}) {
      const request: ProviderRequest = {
        prompt,
        negativePrompt: options.negativePrompt,
        width: options.width ?? config.defaults.width,
        height: options.height ?? config.defaults.height,
        seed: options.seed,
        steps: options.steps ?? config.defaults.steps,
        extra: options.extra,
      };
      return manager.generate(request);
    },
  };
}
