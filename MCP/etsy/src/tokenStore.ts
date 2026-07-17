import { readFileSync, writeFileSync, existsSync } from "node:fs";

export interface TokenSet {
  access_token: string;
  refresh_token: string;
  /** epoch ms */
  expires_at: number;
}

// ponytail: local JSON file cache. Fine for local dev; GitHub Actions runners are ephemeral so
// production needs the refresh token persisted externally (e.g. rewritten to a GH secret via
// `gh secret set` at the end of each run, or stored in /Storage-R2). Not implemented yet — see
// MCP/etsy/README.md "Known limitation".
export class TokenStore {
  private path: string;

  constructor(path: string) {
    this.path = path;
  }

  read(): TokenSet | null {
    if (!existsSync(this.path)) return null;
    return JSON.parse(readFileSync(this.path, "utf-8"));
  }

  write(tokens: TokenSet): void {
    writeFileSync(this.path, JSON.stringify(tokens, null, 2) + "\n", { mode: 0o600 });
  }
}
