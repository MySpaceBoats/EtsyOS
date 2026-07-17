import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const bin = join(__dirname, "..", "node_modules", ".bin", "printify-mcp");

test("printify-mcp: responds to the MCP initialize handshake", async () => {
  const child = spawn(bin, [], {
    env: { ...process.env, PRINTIFY_API_KEY: "smoke-test-dummy-key" },
    stdio: ["pipe", "pipe", "pipe"],
  });

  const response = await new Promise((resolve, reject) => {
    let out = "";
    const timer = setTimeout(() => reject(new Error("timed out waiting for response")), 5000);
    child.stdout.on("data", (d) => {
      out += d.toString();
      if (out.includes('"serverInfo"')) {
        clearTimeout(timer);
        resolve(out);
      }
    });
    child.on("error", reject);
    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test", version: "0" } },
      }) + "\n",
    );
  });

  child.kill();
  const parsed = JSON.parse(response.trim().split("\n").pop());
  assert.equal(parsed.result.serverInfo.name, "Printify-MCP");
});
