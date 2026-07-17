import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TokenStore } from "../src/tokenStore.ts";

test("TokenStore: write then read round-trips", () => {
  const dir = mkdtempSync(join(tmpdir(), "etsyos-token-"));
  const path = join(dir, "tokens.json");
  const store = new TokenStore(path);

  assert.equal(store.read(), null);

  const tokens = { access_token: "12345.abc", refresh_token: "r-1", expires_at: Date.now() + 3600_000 };
  store.write(tokens);
  assert.deepEqual(store.read(), tokens);

  rmSync(dir, { recursive: true, force: true });
});
