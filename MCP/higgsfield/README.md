---
type: mcp-server
layer: mcp
created: 2026-07-17
updated: 2026-07-17
status: phase-3-hosted-remote
---

# MCP — higgsfield

## Role

Image/video generation (30+ models: Soul, Cinema Studio, Flux, Kling) for `Design-Agent` mockups and
product visuals — Phase 3, not Phase 1.

## No local server — hosted remote MCP

Unlike `etsy`/`printify`, there is no code to run here. Higgsfield hosts the MCP server itself at
`https://mcp.higgsfield.ai/mcp`. Integration is registering that URL as a remote MCP server (see root
`.mcp.json`) — auth happens via browser login through the Higgsfield account, not an API key/env var.

For a GitHub Actions runner (headless, no browser) this means the `Design-Agent`/`Mockup-Generation`
routine cannot authenticate the same way a local Claude Code session does. Not solved here — needs
Higgsfield's headless/service-account auth story investigated before Phase 3 (see ROADMAP.md).

## Configuration

See `config.example.json` — no credentials env var, just the server URL.

## Statut

`non-implemente` — remote endpoint identified and documented, not yet wired into any routine. Out of Phase
1 scope (auth for Etsy/Printify only).
