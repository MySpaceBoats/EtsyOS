/**
 * assets MCP server (stdio). Records generated-asset fiches into the vault.
 * Only record_asset is implemented — the wider asset lifecycle is future work.
 */
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { recordAsset, type AssetMetadata } from "./record-asset.ts";

// Default: <repo-root>/Assets. Overridable via ASSETS_BASE_DIR.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const baseDir = process.env.ASSETS_BASE_DIR || join(repoRoot, "Assets");

const tools = [
  {
    name: "record_asset",
    description: "Write an Obsidian fiche for a generated asset under Assets/<category>/. Returns { path }.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string" },
        provider: { type: "string" },
        model: { type: "string" },
        category: { type: "string", description: "Default: Images" },
        slug: { type: "string" },
        date: { type: "string", description: "YYYY-MM-DD; defaults to today" },
        negativePrompt: { type: "string" },
        seed: { type: "number" },
        generationTimeMs: { type: "number" },
        retries: { type: "number" },
        estimatedCostUsd: { type: "number" },
        width: { type: "number" },
        height: { type: "number" },
        r2Url: { type: "string" },
        r2Key: { type: "string" },
        checksum: { type: "string" },
        status: { type: "string" },
      },
      required: ["prompt", "provider", "model"],
    },
  },
] as const;

const server = new Server({ name: "assets", version: "0.1.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name !== "record_asset") throw new Error(`Unknown tool: ${req.params.name}`);
  const result = recordAsset((req.params.arguments ?? {}) as unknown as AssetMetadata, baseDir);
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

await server.connect(new StdioServerTransport());
