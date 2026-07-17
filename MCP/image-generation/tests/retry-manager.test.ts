import { test } from "node:test";
import assert from "node:assert/strict";
import { RetryManager } from "../src/retry-manager.ts";
import { ProviderError } from "../src/types.ts";

function retryable(msg: string) {
  return new ProviderError(msg, { reason: "rate_limit", retryable: true });
}
function nonRetryable(msg: string) {
  return new ProviderError(msg, { reason: "quota", retryable: false });
}

test("retries retryable errors up to maxAttempts then throws", async () => {
  const delays: number[] = [];
  const rm = new RetryManager({ baseDelayMs: 100, maxDelayMs: 10_000, maxAttempts: 3 }, async (ms) => {
    delays.push(ms);
  });
  let attempts = 0;
  await assert.rejects(
    () =>
      rm.run(async () => {
        attempts++;
        throw retryable("still failing");
      }),
    /still failing/,
  );
  assert.equal(attempts, 3);
  // Backoff between the 3 attempts: 100 * 2^0, 100 * 2^1 = 2 sleeps.
  assert.deepEqual(delays, [100, 200]);
});

test("does not retry non-retryable errors", async () => {
  const rm = new RetryManager({ baseDelayMs: 1, maxDelayMs: 1, maxAttempts: 5 }, async () => {});
  let attempts = 0;
  await assert.rejects(
    () =>
      rm.run(async () => {
        attempts++;
        throw nonRetryable("quota gone");
      }),
    /quota gone/,
  );
  assert.equal(attempts, 1);
});

test("backoff is capped at maxDelayMs", async () => {
  const delays: number[] = [];
  const rm = new RetryManager({ baseDelayMs: 1000, maxDelayMs: 1500, maxAttempts: 4 }, async (ms) => {
    delays.push(ms);
  });
  await assert.rejects(() => rm.run(async () => Promise.reject(retryable("x"))));
  assert.deepEqual(delays, [1000, 1500, 1500]);
});

test("returns the value on eventual success", async () => {
  const rm = new RetryManager({ baseDelayMs: 1, maxDelayMs: 1, maxAttempts: 3 }, async () => {});
  let attempts = 0;
  const result = await rm.run(async () => {
    attempts++;
    if (attempts < 2) throw retryable("transient");
    return "ok";
  });
  assert.equal(result, "ok");
  assert.equal(attempts, 2);
});
