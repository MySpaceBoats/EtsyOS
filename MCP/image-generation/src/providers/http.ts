import { ProviderError } from "../types.ts";

export interface HttpOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}

/** fetch with an abort timeout, normalizing transport failures to ProviderError. */
export async function httpFetch(url: string, provider: string, opts: HttpOptions = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 60_000);
  try {
    return await fetch(url, {
      method: opts.method ?? "GET",
      headers: opts.headers,
      body: opts.body,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ProviderError(`${provider}: request timed out`, { reason: "timeout", retryable: true, provider });
    }
    throw new ProviderError(`${provider}: network error: ${(err as Error).message}`, {
      reason: "network",
      retryable: true,
      provider,
    });
  } finally {
    clearTimeout(timeout);
  }
}
