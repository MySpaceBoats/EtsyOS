import { test } from "node:test";
import assert from "node:assert/strict";
import { HealthMonitor } from "../src/health-monitor.ts";

test("disables a provider on quota/rate_limit for the cooldown window", () => {
  let now = 1000;
  const hm = new HealthMonitor(5000, () => now);

  assert.equal(hm.isAvailable("workers-ai"), true);
  hm.recordFailure("workers-ai", "rate_limit");
  assert.equal(hm.isAvailable("workers-ai"), false);

  now = 1000 + 4999;
  assert.equal(hm.isAvailable("workers-ai"), false);

  now = 1000 + 5000;
  assert.equal(hm.isAvailable("workers-ai"), true);
});

test("does not disable on transient reasons like timeout/network/http_error", () => {
  const hm = new HealthMonitor(5000, () => 0);
  hm.recordFailure("imagen", "timeout");
  hm.recordFailure("imagen", "network");
  hm.recordFailure("imagen", "http_error");
  assert.equal(hm.isAvailable("imagen"), true);
});

test("recordSuccess clears a disabled state", () => {
  let now = 0;
  const hm = new HealthMonitor(5000, () => now);
  hm.recordFailure("hf", "quota");
  assert.equal(hm.isAvailable("hf"), false);
  hm.recordSuccess("hf");
  assert.equal(hm.isAvailable("hf"), true);
  assert.equal(hm.getState("hf"), "available");
});
