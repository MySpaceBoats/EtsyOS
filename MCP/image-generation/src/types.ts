export interface ProviderRequest {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  seed?: number;
  steps?: number;
  /** Provider-specific params passed through untouched. */
  extra?: Record<string, unknown>;
}

export interface ProviderResult {
  imageBase64: string;
  mimeType: string;
  provider: string;
  model: string;
  seed?: number;
  generationTimeMs: number;
}

export type ProviderErrorReason =
  | "quota"
  | "rate_limit"
  | "timeout"
  | "network"
  | "http_error"
  | "provider_error";

export class ProviderError extends Error {
  readonly retryable: boolean;
  readonly reason: ProviderErrorReason;
  readonly provider?: string;

  constructor(
    message: string,
    opts: { reason: ProviderErrorReason; retryable: boolean; provider?: string },
  ) {
    super(message);
    this.name = "ProviderError";
    this.reason = opts.reason;
    this.retryable = opts.retryable;
    this.provider = opts.provider;
  }
}

/** Maps an HTTP status to a ProviderError reason + retryability. */
export function errorFromStatus(status: number, message: string, provider: string): ProviderError {
  if (status === 429) return new ProviderError(message, { reason: "rate_limit", retryable: true, provider });
  if (status === 402 || status === 403) return new ProviderError(message, { reason: "quota", retryable: false, provider });
  if (status >= 500) return new ProviderError(message, { reason: "http_error", retryable: true, provider });
  return new ProviderError(message, { reason: "provider_error", retryable: false, provider });
}
