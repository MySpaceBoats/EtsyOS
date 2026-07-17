---
type: mcp-server
layer: mcp
created: 2026-07-17
updated: 2026-07-17
status: phase-1-vendored
---

# MCP — etsy

## Role

Etsy API v3 access for EtsyOS. Two parts:

1. **Our OAuth2 PKCE auth/refresh wrapper** (`src/`, `scripts/authorize.ts`) — Etsy access tokens expire
   in 1h and refresh tokens rotate on every use; this repo owns that lifecycle.
2. **Vendored MCP server** — [`etsy-mcp-2026-complete`](https://github.com/BusyBee3333/etsy-mcp-2026-complete)
   (MIT, per upstream `package.json`), pulled in as a git submodule at
   `vendor/etsy-mcp-2026-complete`. It has no auth logic of its own — it just reads a static
   `ETSY_API_KEY` / `ETSY_ACCESS_TOKEN` from the environment. Our wrapper (`src/run.ts`) refreshes the
   token if needed and execs the vendored server with it injected.

50+ tools across the entire Etsy API v3 surface (listings, images, inventory, shop, receipts, payments,
reviews...) — see upstream README for the full index, or `vendor/etsy-mcp-2026-complete/src/tools/`.

## ⚠️ Not read-only

Unlike the Phase 0 plan, the vendored server exposes **full CRUD** (`etsy_listing_create`,
`etsy_listing_delete`, `etsy_receipt_update`, etc.), not just reads. There is no built-in read-only mode.
Until the `Quality-Agent` gate exists (Phase 4), treat write tools as **off-limits by convention** — do not
invoke them from a routine or agent prompt. This is a process discipline, not an enforced restriction; a
proper gate (tool allowlist at the MCP client config level, or a proxying layer) is real follow-up work, not
implemented here.

## Setup

```bash
git submodule update --init MCP/etsy/vendor/etsy-mcp-2026-complete   # first time only
cd MCP/etsy
npm install
cp .env.example .env       # fill in ETSY_CLIENT_ID from https://www.etsy.com/developers/your-apps
npm run authorize          # one-time OAuth PKCE flow -> caches tokens, prints shop IDs
                            # report the shop_id into ETSY_SHOP_ID (.env)
npm run vendor:build       # npm install + tsc build inside the submodule
npm start                  # refreshes the token if needed, execs the vendored MCP server (stdio)
```

## Auth

OAuth2 + PKCE (S256). `npm run authorize` is interactive, run once per Etsy account. `npm start` refreshes
the access token automatically (60s expiry skew) before handing off to the vendored server.

**Known limitation**: the refresh token is cached in a local file (`.etsy-tokens.json`, gitignored, never
committed). On an ephemeral GitHub Actions runner this doesn't persist between runs — production needs it
written back to a GitHub secret (`gh secret set`) or to `/Storage` (R2) at the end of each run. Not
implemented yet; blocks any automated routine that uses this MCP server (`Printify-Sync`, `Market-Scan`,
etc. — see ROADMAP.md Phase 1).

## Updating the vendored server

```bash
cd MCP/etsy/vendor/etsy-mcp-2026-complete
git fetch && git checkout <new-commit-or-tag>
cd ../../../..
git add MCP/etsy/vendor/etsy-mcp-2026-complete
git commit -m "Bump etsy-mcp-2026-complete to <ref>"
```

## Tests

`npm test` — Node's built-in test runner, covers our wrapper only (PKCE, token parsing, token cache). The
vendored server is upstream's responsibility to test.

## Statut

Phase 1 — OAuth2 PKCE auth wired to the vendored `etsy-mcp-2026-complete` server, smoke-tested end to end
(initialize handshake). Refresh-token persistence for CI runners still open.
