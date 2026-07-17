/**
 * One-time interactive Etsy OAuth2 PKCE authorization.
 * Run: npm run authorize   (reads ETSY_CLIENT_ID / ETSY_REDIRECT_URI / ETSY_SCOPES from .env)
 * Prints the authorize URL, waits for the browser redirect, exchanges the code, caches tokens,
 * then prints the account's shop IDs so ETSY_SHOP_ID can be filled in.
 */
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { generatePkcePair } from "../src/pkce.ts";
import { exchangeCodeForTokens, userIdFromAccessToken } from "../src/auth.ts";
import { TokenStore } from "../src/tokenStore.ts";

const clientId = requireEnv("ETSY_CLIENT_ID");
const redirectUri = process.env.ETSY_REDIRECT_URI ?? "http://localhost:3945/callback";
const scopes = process.env.ETSY_SCOPES ?? "shops_r listings_r transactions_r";
const tokenCachePath = process.env.ETSY_TOKEN_CACHE_PATH ?? ".etsy-tokens.json";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} — copy .env.example to .env and fill it in.`);
  return v;
}

const { verifier, challenge } = generatePkcePair();
const state = randomBytes(16).toString("hex");

const authorizeUrl = new URL("https://www.etsy.com/oauth/connect");
authorizeUrl.searchParams.set("response_type", "code");
authorizeUrl.searchParams.set("client_id", clientId);
authorizeUrl.searchParams.set("redirect_uri", redirectUri);
authorizeUrl.searchParams.set("scope", scopes);
authorizeUrl.searchParams.set("state", state);
authorizeUrl.searchParams.set("code_challenge", challenge);
authorizeUrl.searchParams.set("code_challenge_method", "S256");

const port = Number(new URL(redirectUri).port || 80);
const callbackPath = new URL(redirectUri).pathname;

console.log("\nOpen this URL in a browser and approve access:\n");
console.log(authorizeUrl.toString());
console.log(`\nWaiting for redirect on ${redirectUri} ...\n`);

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", redirectUri);
  if (url.pathname !== callbackPath) {
    res.writeHead(404).end();
    return;
  }

  const returnedState = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code || returnedState !== state) {
    res.writeHead(400, { "Content-Type": "text/plain" }).end("Authorization failed — check the terminal.");
    console.error("Authorization failed:", error ?? "state mismatch or missing code");
    server.close();
    process.exit(1);
  }

  res.writeHead(200, { "Content-Type": "text/plain" }).end("Authorized — you can close this tab.");
  server.close();

  const tokens = await exchangeCodeForTokens({ clientId, redirectUri, code: code!, codeVerifier: verifier });
  new TokenStore(tokenCachePath).write(tokens);
  console.log(`\nTokens cached at ${tokenCachePath}\n`);

  const userId = userIdFromAccessToken(tokens.access_token);
  const shopsRes = await fetch(`https://api.etsy.com/v3/application/users/${userId}/shops`, {
    headers: { "x-api-key": clientId, Authorization: `Bearer ${tokens.access_token}` },
  });
  const shops = await shopsRes.json();
  console.log("Shop(s) on this account — set ETSY_SHOP_ID to the right one:\n");
  console.log(JSON.stringify(shops, null, 2));
});

server.listen(port);
