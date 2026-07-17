/**
 * storage MCP server (stdio). Wraps R2Client and exposes upload/download/delete/list/
 * getSignedUrl/publicUrl as MCP tools. Secrets come from env only — see .env.example.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { R2Client } from "./r2-client.ts";
import { loadConfigFromEnv } from "./config.ts";

const client = new R2Client(loadConfigFromEnv());

const tools = [
  {
    name: "upload",
    description: "Upload bytes to R2. Returns { key, url, checksum (sha256 hex) }.",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", description: "Object key (path) in the bucket." },
        contentBase64: { type: "string", description: "Base64-encoded file bytes." },
        contentType: { type: "string", description: "MIME type, e.g. image/png." },
      },
      required: ["key", "contentBase64", "contentType"],
    },
  },
  {
    name: "download",
    description: "Download an object from R2. Returns { contentBase64, contentType }.",
    inputSchema: {
      type: "object",
      properties: { key: { type: "string" } },
      required: ["key"],
    },
  },
  {
    name: "delete",
    description: "Delete an object from R2. Returns { deleted: true }.",
    inputSchema: {
      type: "object",
      properties: { key: { type: "string" } },
      required: ["key"],
    },
  },
  {
    name: "list",
    description: "List object keys, optionally filtered by prefix. Returns { keys }.",
    inputSchema: {
      type: "object",
      properties: { prefix: { type: "string" } },
    },
  },
  {
    name: "getSignedUrl",
    description: "Presigned GET URL for a private object. Returns { url }.",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string" },
        expiresInSeconds: { type: "number" },
      },
      required: ["key", "expiresInSeconds"],
    },
  },
  {
    name: "publicUrl",
    description: "Direct public URL (requires R2_PUBLIC_URL_BASE). Returns { url }.",
    inputSchema: {
      type: "object",
      properties: { key: { type: "string" } },
      required: ["key"],
    },
  },
] as const;

const server = new Server({ name: "storage", version: "0.1.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name } = req.params;
  const args = (req.params.arguments ?? {}) as Record<string, unknown>;
  let result: unknown;
  switch (name) {
    case "upload":
      result = await client.upload(args.key as string, args.contentBase64 as string, args.contentType as string);
      break;
    case "download":
      result = await client.download(args.key as string);
      break;
    case "delete":
      result = await client.delete(args.key as string);
      break;
    case "list":
      result = await client.list(args.prefix as string | undefined);
      break;
    case "getSignedUrl":
      result = await client.getSignedUrl(args.key as string, args.expiresInSeconds as number);
      break;
    case "publicUrl":
      result = client.publicUrl(args.key as string);
      break;
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
});

await server.connect(new StdioServerTransport());
