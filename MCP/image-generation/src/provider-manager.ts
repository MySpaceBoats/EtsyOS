import type { ImageProvider } from "./providers/provider.interface.ts";
import { type ProviderRequest, type ProviderResult, ProviderError } from "./types.ts";
import type { RetryManager } from "./retry-manager.ts";
import type { HealthMonitor } from "./health-monitor.ts";
import type { MetricsCollector } from "./metrics-collector.ts";
import type { Logger } from "./logger.ts";

export interface ProviderManagerDeps {
  providers: ImageProvider[];
  /** Priority order of provider names. */
  order: string[];
  retryManager: RetryManager;
  healthMonitor: HealthMonitor;
  metrics: MetricsCollector;
  logger: Logger;
  /** Per-provider cost-per-image in USD, accumulated on success. */
  costPerImageUsd?: Record<string, number>;
}

/** Aggregate error thrown when every provider in the priority order failed. */
export class AllProvidersFailedError extends Error {
  readonly failures: Record<string, string>;
  constructor(failures: Record<string, string>) {
    super(`All image providers failed: ${JSON.stringify(failures)}`);
    this.name = "AllProvidersFailedError";
    this.failures = failures;
  }
}

export class ProviderManager {
  private readonly byName: Map<string, ImageProvider>;
  private readonly deps: ProviderManagerDeps;
  constructor(deps: ProviderManagerDeps) {
    this.deps = deps;
    this.byName = new Map(deps.providers.map((p) => [p.name, p]));
  }

  async generate(request: ProviderRequest): Promise<ProviderResult> {
    const { order, retryManager, healthMonitor, metrics, logger } = this.deps;
    const cost = this.deps.costPerImageUsd ?? {};
    const failures: Record<string, string> = {};
    logger.requested({ order, width: request.width, height: request.height });

    for (const name of order) {
      const provider = this.byName.get(name);
      if (!provider) {
        failures[name] = "not_configured";
        continue;
      }
      if (!healthMonitor.isAvailable(name)) {
        logger.skipped(name, "cooldown");
        failures[name] = "cooldown";
        continue;
      }
      if (!provider.isHealthy()) {
        logger.skipped(name, "unhealthy");
        failures[name] = "unhealthy";
        continue;
      }

      logger.tried(name);
      try {
        const result = await retryManager.run(() => provider.generate(request));
        healthMonitor.recordSuccess(name);
        metrics.recordSuccess(name, result.generationTimeMs, cost[name] ?? 0);
        logger.succeeded(name, result.generationTimeMs);
        return result;
      } catch (err) {
        const reason = err instanceof ProviderError ? err.reason : "provider_error";
        healthMonitor.recordFailure(name, reason);
        metrics.recordFailure(name);
        logger.failed(name, reason, (err as Error).message);
        failures[name] = reason;
      }
    }

    logger.exhausted(failures);
    throw new AllProvidersFailedError(failures);
  }
}
