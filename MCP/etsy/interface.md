# Interface — MCP etsy

Transport: stdio. Protocol: MCP `2024-11-05`. Server identifies itself as `@mcpengine/etsy` (the vendored
server's own name — see `vendor/etsy-mcp-2026-complete/src/main.ts`).

## Tools

50+ tools, one module per Etsy API domain. Full index:
[upstream README](https://github.com/BusyBee3333/etsy-mcp-2026-complete#tools-index), or browse
`vendor/etsy-mcp-2026-complete/src/tools/*.ts` directly (one file per domain: listings, images, inventory,
shop, receipts, payments, reviews, taxonomy...). Every tool has a Zod-validated input schema;
`readOnlyHint`/`destructiveHint` annotations mark GET/list vs. delete operations.

## Auth (interior to our wrapper, not an MCP tool)

- `npm run authorize` — one-time OAuth2 PKCE flow, caches `{access_token, refresh_token, expires_at}`
- `src/run.ts` — refreshes if `expires_at` is within 60s of now, then execs the vendored server with:
  - `ETSY_API_KEY` = our `ETSY_CLIENT_ID` (Etsy's "API key"/keystring and OAuth client_id are the same value)
  - `ETSY_ACCESS_TOKEN` = the current (possibly just-refreshed) access token

## Errors

The vendored client normalizes HTTP errors to `Error("[<status>] <message>")` — propagated as-is through
MCP tool responses.
