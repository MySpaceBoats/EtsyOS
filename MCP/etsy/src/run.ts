/**
 * Refreshes the Etsy access token (PKCE refresh_token flow) then execs the vendored
 * etsy-mcp-2026-complete server (MCP/etsy/vendor/etsy-mcp-2026-complete) with it injected —
 * that server has no OAuth/refresh logic of its own, it just reads a static access token.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ensureFreshAccessToken } from "./ensureToken.ts";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} — see MCP/etsy/.env.example`);
  return v;
}

const clientId = requireEnv("ETSY_CLIENT_ID");
const tokenCachePath = process.env.ETSY_TOKEN_CACHE_PATH ?? ".etsy-tokens.json";
const accessToken = await ensureFreshAccessToken(clientId, tokenCachePath);

const __dirname = dirname(fileURLToPath(import.meta.url));
const vendorEntry = join(__dirname, "..", "vendor", "etsy-mcp-2026-complete", "dist", "main.js");

const child = spawn("node", [vendorEntry], {
  stdio: "inherit",
  env: { ...process.env, ETSY_API_KEY: clientId, ETSY_ACCESS_TOKEN: accessToken },
});

child.on("exit", (code) => process.exit(code ?? 0));
