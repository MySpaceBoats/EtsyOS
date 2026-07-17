interface ProviderCounters {
  generatedCount: number;
  failureCount: number;
  totalTimeMs: number;
  estimatedCostUsd: number;
}

export interface ProviderStats extends ProviderCounters {
  provider: string;
  avgTimeMs: number;
}

export class MetricsCollector {
  private readonly counters = new Map<string, ProviderCounters>();
  private lastActiveProvider: string | null = null;

  private counterFor(provider: string): ProviderCounters {
    let c = this.counters.get(provider);
    if (!c) {
      c = { generatedCount: 0, failureCount: 0, totalTimeMs: 0, estimatedCostUsd: 0 };
      this.counters.set(provider, c);
    }
    return c;
  }

  recordSuccess(provider: string, timeMs: number, costUsd: number): void {
    const c = this.counterFor(provider);
    c.generatedCount++;
    c.totalTimeMs += timeMs;
    c.estimatedCostUsd += costUsd;
    this.lastActiveProvider = provider;
  }

  recordFailure(provider: string): void {
    this.counterFor(provider).failureCount++;
  }

  getActiveProvider(): string | null {
    return this.lastActiveProvider;
  }

  getStats(): ProviderStats[] {
    return [...this.counters.entries()].map(([provider, c]) => ({
      provider,
      ...c,
      avgTimeMs: c.generatedCount > 0 ? c.totalTimeMs / c.generatedCount : 0,
    }));
  }
}
