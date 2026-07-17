# Third-Party Notices — EtsyOS

EtsyOS does not implement Etsy/Printify/Higgsfield API clients from scratch — it wraps existing MCP
servers. This file tracks what's vendored, from where, and under what license.

## `MCP/etsy/vendor/etsy-mcp-2026-complete`

- Source: https://github.com/BusyBee3333/etsy-mcp-2026-complete
- Integration: git submodule (pinned commit, see `.gitmodules` and the submodule ref in this repo's tree)
- License: MIT, per upstream `package.json` (`"license": "MIT"`) — no `LICENSE` file present upstream at
  time of vendoring; declared license taken at face value
- Vendored: 2026-07-17
- Not modified — used as-is, built via `npm run vendor:build` (see `MCP/etsy/package.json`)

## `@tsavo/printify-mcp` (npm dependency of `MCP/printify`)

- Source: https://github.com/TSavo/printify-mcp
- Integration: npm dependency (`^0.1.1`), published package — see `MCP/printify/package.json`
- License: ISC (confirmed via upstream `LICENSE` file)
- Not modified — used as-is

## Higgsfield MCP (`MCP/higgsfield`)

- Source: hosted service at `https://mcp.higgsfield.ai/mcp` (Higgsfield, Inc.)
- Integration: remote MCP connector (URL only, registered in `.mcp.json`), no code vendored
- No license applicable — third-party hosted API, not redistributed code

## Why vendor instead of building from scratch

`ROADMAP.md` Phase 1 originally scoped custom-built MCP servers for Etsy/Printify. Existing, actively
maintained, permissively-licensed servers already cover far more of each API's surface than a from-scratch
Phase 1 read-only build would have — reusing them means EtsyOS starts with full CRUD tool coverage instead
of two read-only tools per platform. The tradeoff (documented in each MCP's README under "⚠️ Not
read-only") is that nothing gates write operations yet — that's the `Quality-Agent` (Phase 4), still open.
