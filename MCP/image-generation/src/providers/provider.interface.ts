import type { ProviderRequest, ProviderResult } from "../types.ts";

export interface ImageProvider {
  readonly name: string;
  generate(request: ProviderRequest): Promise<ProviderResult>;
  /** Cheap liveness/config check — false lets the manager skip this provider. */
  isHealthy(): boolean;
}
