import type { R2Config } from "./r2-client.ts";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} — see MCP/storage/.env.example`);
  return v;
}

export function loadConfigFromEnv(): R2Config {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  return {
    accountId,
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    bucket: requireEnv("R2_BUCKET"),
    endpoint: process.env.R2_ENDPOINT || undefined,
    publicUrlBase: process.env.R2_PUBLIC_URL_BASE || undefined,
  };
}
