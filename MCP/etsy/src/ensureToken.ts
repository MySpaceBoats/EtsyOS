import { refreshTokens } from "./auth.ts";
import { TokenStore } from "./tokenStore.ts";

const EXPIRY_SKEW_MS = 60_000;

/** Returns a valid access token, refreshing (and persisting the rotated refresh_token) if needed. */
export async function ensureFreshAccessToken(clientId: string, tokenCachePath: string): Promise<string> {
  const store = new TokenStore(tokenCachePath);
  const cached = store.read();
  if (!cached) {
    throw new Error("No Etsy tokens found. Run `npm run authorize` once to complete the OAuth flow.");
  }
  if (cached.expires_at - EXPIRY_SKEW_MS > Date.now()) return cached.access_token;

  const refreshed = await refreshTokens(clientId, cached.refresh_token);
  store.write(refreshed);
  return refreshed.access_token;
}
