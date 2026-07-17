import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export interface ProviderConfigEntry {
  model: string;
  /** huggingface only — which Inference Providers backend hosts `model` (e.g. "together", "nscale"). */
  provider?: string;
  costPerImageUsd?: number;
  timeoutMs?: number;
}

export interface ImageGenConfig {
  providers: Record<string, ProviderConfigEntry>;
  priority: string[];
  retry: { baseDelayMs: number; maxDelayMs: number; maxAttempts: number };
  health: { cooldownMs: number };
  defaults: { width: number; height: number; steps: number };
}

/** Loads config.json if present, else falls back to config.example.json. */
export function loadConfig(): ImageGenConfig {
  const dir = join(dirname(fileURLToPath(import.meta.url)), "..");
  const configPath = join(dir, "config.json");
  const examplePath = join(dir, "config.example.json");
  const path = existsSync(configPath) ? configPath : examplePath;
  return JSON.parse(readFileSync(path, "utf8")) as ImageGenConfig;
}
