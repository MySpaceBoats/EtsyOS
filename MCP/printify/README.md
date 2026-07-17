---
type: mcp-server
layer: mcp
created: 2026-07-17
updated: 2026-07-17
status: phase-1-vendored
---

# MCP — printify

## Role

Printify API access via the published npm package
[`@tsavo/printify-mcp`](https://github.com/TSavo/printify-mcp) (ISC license). No custom code needed — this
folder is a thin dependency + env wrapper.

## ⚠️ Not read-only

Exposes full CRUD (product create/update/delete/publish, image upload), not just reads. Same caveat as
`MCP/etsy` — treat write tools as off-limits by convention until the `Quality-Agent` gate exists (Phase 4).

## Setup

```bash
cd MCP/printify
npm install
cp .env.example .env   # Printify > My Profile > Connections > Generate personal access token
npm start                # runs the `printify-mcp` bin (stdio)
```

## Tools

Shop management, product CRUD, blueprint/variant browsing, image upload, plus optional AI image generation
(Replicate) — full list in the
[upstream README](https://github.com/TSavo/printify-mcp#available-tools). Out of scope for Phase 1: only
auth + the read tools (`list shops`, `list products`, catalog browsing) should be used until Phase 4.

## Auth

Personal access token (Bearer), no OAuth, no expiry. `PRINTIFY_SHOP_ID` is optional — the server
auto-selects the account's first shop if unset.

## Updating

Bump the pinned version in `package.json` (`@tsavo/printify-mcp`), then `npm install`.

## Tests

`npm test` — smoke-tests the `printify-mcp` binary against a real MCP `initialize` handshake (Node's
built-in test runner, no framework).

## Statut

Phase 1 — auth wired to the upstream `@tsavo/printify-mcp` package, smoke-tested end to end.
