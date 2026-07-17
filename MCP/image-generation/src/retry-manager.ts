import { ProviderError } from "./types.ts";

export interface RetryConfig {
  baseDelayMs: number;
  maxDelayMs: number;
  maxAttempts: number;
}

export type SleepFn = (ms: number) => Promise<void>;

const defaultSleep: SleepFn = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Bounded exponential-backoff retry. Retries only ProviderError with retryable=true,
 * up to maxAttempts total tries — it can never loop forever.
 */
export class RetryManager {
  private readonly config: RetryConfig;
  private readonly sleep: SleepFn;

  constructor(config: RetryConfig, sleep: SleepFn = defaultSleep) {
    this.config = config;
    this.sleep = sleep;
  }

  private delayFor(attempt: number): number {
    return Math.min(this.config.maxDelayMs, this.config.baseDelayMs * 2 ** (attempt - 1));
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        const retryable = err instanceof ProviderError && err.retryable;
        if (!retryable || attempt === this.config.maxAttempts) break;
        await this.sleep(this.delayFor(attempt));
      }
    }
    throw lastError;
  }
}
