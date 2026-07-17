# Changelog — EtsyOS

## [Unreleased]

### Added

- Phase 1 auth: `MCP/etsy` — OAuth2 PKCE wrapper (`npm run authorize`, automatic token refresh) in front of
  the vendored `etsy-mcp-2026-complete` server (git submodule, 50+ tools, MIT)
- Phase 1 auth: `MCP/printify` — thin wrapper around the published `@tsavo/printify-mcp` npm package (ISC)
- `MCP/higgsfield` documented as a hosted remote MCP (`mcp.higgsfield.ai/mcp`), no local code
- Root `.mcp.json` registering all three servers for Claude Code
- `THIRD_PARTY_NOTICES.md` tracking vendored/dependency provenance and licenses
- Both Etsy and Printify wrappers smoke-tested end-to-end against a real MCP `initialize` handshake

### Changed

- Etsy/Printify MCP servers pivoted from custom-built (2 read-only tools each, Phase 0 plan) to vendored
  existing servers (full CRUD, 50+ and ~15 tools respectively) — see ROADMAP.md Phase 1 and each server's
  README "⚠️ Not read-only" section for the resulting scope caveat

## [0.1.0] - 2026-07-17

### Added

- Fondation initiale du depot : architecture complete, structure Obsidian (25 dossiers), structure logicielle
  (16 dossiers racine), 13 agents, 15 serveurs MCP, 15 routines, 12 workflows GitHub Actions (squelettes),
  documentation complete a la racine.
