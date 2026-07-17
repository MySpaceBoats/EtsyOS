/**
 * image-generation MCP server (stdio). Exposes a single `generate_image` tool that tries
 * providers in configured priority order with automatic failover. Secrets come from env.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { loadConfig } from "./config.ts";
import { buildImageGenerator } from "./index.ts";

const generator = buildImageGenerator(loadConfig());

const tools = [
  {
    name: "generate_image",
    description:
      "Generate an image from a prompt with automatic multi-provider failover. Returns a unified result; provider used is in the metadata.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string" },
        options: {
          type: "object",
          properties: {
            negativePrompt: { type: "string" },
            width: { type: "number" },
            height: { type: "number" },
            seed: { type: "number" },
            steps: { type: "number" },
            extra: { type: "object", additionalProperties: true },
          },
        },
      },
      required: ["prompt"],
    },
  },
] as const;

const server = new Server({ name: "image-generation", version: "0.1.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name !== "generate_image") throw new Error(`Unknown tool: ${req.params.name}`);
  const args = (req.params.arguments ?? {}) as { prompt: string; options?: Record<string, unknown> };
  const result = await generator.generate(args.prompt, args.options ?? {});
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

await server.connect(new StdioServerTransport());
