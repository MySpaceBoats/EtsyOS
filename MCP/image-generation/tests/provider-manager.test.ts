import { test } from "node:test";
import assert from "node:assert/strict";
import { ProviderManager, AllProvidersFailedError } from "../src/provider-manager.ts";
import { RetryManager } from "../src/retry-manager.ts";
import { HealthMonitor } from "../src/health-monitor.ts";
import { MetricsCollector } from "../src/metrics-collector.ts";
import { Logger } from "../src/logger.ts";
import { ProviderError, type ProviderRequest, type ProviderResult } from "../src/types.ts";
import type { ImageProvider } from "../src/providers/provider.interface.ts";

const request: ProviderRequest = { prompt: "a cat", width: 512, height: 512 };

function mockProvider(name: string, behavior: () => Promise<ProviderResult>, healthy = true): ImageProvider {
  return { name, isHealthy: () => healthy, generate: behavior };
}

function ok(name: string): ProviderResult {
  return { imageBase64: "AAAA", mimeType: "image/png", provider: name, model: "m", generationTimeMs: 10 };
}

function fail(name: string, reason: "quota" | "rate_limit" | "http_error" | "provider_error" = "http_error") {
  return () => Promise.reject(new ProviderError(`${name} boom`, { reason, retryable: false, provider: name }));
}

function buildManager(providers: ImageProvider[], order: string[]) {
  const metrics = new MetricsCollector();
  const manager = new ProviderManager({
    providers,
    order,
    retryManager: new RetryManager({ baseDelayMs: 1, maxDelayMs: 1, maxAttempts: 1 }, async () => {}),
    healthMonitor: new HealthMonitor(1000, () => 0),
    metrics,
    logger: new Logger(() => {}),
    costPerImageUsd: { a: 0.01, b: 0.02, c: 0.03 },
  });
  return { manager, metrics };
}

test("falls back to the next provider when earlier ones fail, records the winner", async () => {
  const providers = [
    mockProvider("a", fail("a")),
    mockProvider("b", fail("b")),
    mockProvider("c", () => Promise.resolve(ok("c"))),
  ];
  const { manager, metrics } = buildManager(providers, ["a", "b", "c"]);

  const result = await manager.generate(request);

  assert.equal(result.provider, "c");
  assert.equal(metrics.getActiveProvider(), "c");
  const stats = Object.fromEntries(metrics.getStats().map((s) => [s.provider, s]));
  assert.equal(stats.a.failureCount, 1);
  assert.equal(stats.b.failureCount, 1);
  assert.equal(stats.c.generatedCount, 1);
  assert.equal(stats.c.estimatedCostUsd, 0.03);
});

test("returns first provider without touching later ones", async () => {
  let bCalled = false;
  const providers = [
    mockProvider("a", () => Promise.resolve(ok("a"))),
    mockProvider("b", () => {
      bCalled = true;
      return Promise.resolve(ok("b"));
    }),
  ];
  const { manager } = buildManager(providers, ["a", "b"]);
  const result = await manager.generate(request);
  assert.equal(result.provider, "a");
  assert.equal(bCalled, false);
});

test("skips an unhealthy provider without calling it", async () => {
  let aCalled = false;
  const providers = [
    mockProvider(
      "a",
      () => {
        aCalled = true;
        return Promise.resolve(ok("a"));
      },
      false,
    ),
    mockProvider("b", () => Promise.resolve(ok("b"))),
  ];
  const { manager } = buildManager(providers, ["a", "b"]);
  const result = await manager.generate(request);
  assert.equal(result.provider, "b");
  assert.equal(aCalled, false);
});

test("throws AllProvidersFailedError listing every failure when all fail", async () => {
  const providers = [mockProvider("a", fail("a", "quota")), mockProvider("b", fail("b", "http_error"))];
  const { manager } = buildManager(providers, ["a", "b"]);
  await assert.rejects(
    () => manager.generate(request),
    (err: unknown) => {
      assert.ok(err instanceof AllProvidersFailedError);
      assert.deepEqual(err.failures, { a: "quota", b: "http_error" });
      return true;
    },
  );
});
