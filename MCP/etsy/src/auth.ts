import type { TokenSet } from "./tokenStore.ts";

const TOKEN_URL = "https://api.etsy.com/v3/public/oauth/token";

export interface ExchangeCodeParams {
  clientId: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
}

export async function exchangeCodeForTokens(params: ExchangeCodeParams): Promise<TokenSet> {
  return postToken({
    grant_type: "authorization_code",
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    code: params.code,
    code_verifier: params.codeVerifier,
  });
}

export async function refreshTokens(clientId: string, refreshToken: string): Promise<TokenSet> {
  return postToken({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
  });
}

async function postToken(body: Record<string, string>): Promise<TokenSet> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  if (!res.ok) {
    throw new Error(`Etsy token request failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token, // rotates on every refresh — caller must persist
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

/** Etsy access tokens are formatted "<numeric_user_id>.<opaque>" */
export function userIdFromAccessToken(accessToken: string): string {
  const [userId] = accessToken.split(".");
  if (!userId) throw new Error(`Malformed Etsy access token: ${accessToken}`);
  return userId;
}
