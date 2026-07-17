# Interface — MCP printify

Transport: stdio. Protocol: MCP `2024-11-05`. Server identifies itself as `Printify-MCP` (upstream's own
name).

## Tools

Full list: [upstream README "Available Tools"](https://github.com/TSavo/printify-mcp#available-tools) —
shop management, product CRUD, blueprint/variant catalog, image upload, AI image generation (optional,
needs `REPLICATE_API_TOKEN`). Also exposes an MCP prompt: "Generate Product Description".

## Auth (interior, not an MCP tool)

Reads `PRINTIFY_API_KEY` (required) and `PRINTIFY_SHOP_ID` (optional) from the environment at startup — set
via `.env` (see `.env.example`) or GitHub Actions secrets in production.

## Errors

Upstream's Printify SDK client surfaces HTTP errors with status + body (e.g. `401 Unauthorized`) — observed
directly during smoke testing with a dummy key.
