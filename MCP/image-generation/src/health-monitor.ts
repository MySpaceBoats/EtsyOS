import type { ProviderErrorReason } from "./types.ts";

export type HealthState = "available" | { disabledUntil: number; reason: ProviderErrorReason };

export type NowFn = () => number;

/** Reasons that temporarily disable a provider (don't hammer a known-down one). */
const COOLDOWN_REASONS: ReadonlySet<ProviderErrorReason> = new Set(["quota", "rate_limit"]);

/** In-memory per-provider health cache. */
export class HealthMonitor {
  private readonly states = new Map<string, HealthState>();
  private readonly cooldownMs: number;
  private readonly now: NowFn;

  constructor(cooldownMs: number, now: NowFn = Date.now) {
    this.cooldownMs = cooldownMs;
    this.now = now;
  }

  isAvailable(provider: string): boolean {
    const state = this.states.get(provider);
    if (!state || state === "available") return true;
    if (this.now() >= state.disabledUntil) {
      this.states.set(provider, "available");
      return true;
    }
    return false;
  }

  recordFailure(provider: string, reason: ProviderErrorReason): void {
    if (COOLDOWN_REASONS.has(reason)) {
      this.states.set(provider, { disabledUntil: this.now() + this.cooldownMs, reason });
    }
  }

  recordSuccess(provider: string): void {
    this.states.set(provider, "available");
  }

  getState(provider: string): HealthState {
    return this.states.get(provider) ?? "available";
  }
}
