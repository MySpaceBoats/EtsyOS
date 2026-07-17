# Interface — MCP higgsfield

Hosted remote MCP server — `https://mcp.higgsfield.ai/mcp`. No local process, no stdio transport: this is a
URL-based MCP connector (streamable HTTP, per Higgsfield's own docs at `higgsfield.ai/mcp`).

## Tools

Not enumerated here — discovered dynamically via the MCP `tools/list` call once connected (image/video
generation, character training, video-to-prompt analysis, generation history). See
`https://higgsfield.ai/mcp` for the current feature marketing page; no machine-readable tool reference was
publicly available at the time of writing.

## Auth

Browser-based, through the user's Higgsfield account — not an API key. Nothing to store in `.env` or
GitHub Actions secrets for this one.
