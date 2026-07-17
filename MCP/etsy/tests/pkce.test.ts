import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { generatePkcePair } from "../src/pkce.ts";

test("generatePkcePair: challenge is base64url(sha256(verifier))", () => {
  const { verifier, challenge } = generatePkcePair();
  const expected = createHash("sha256")
    .update(verifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  assert.equal(challenge, expected);
  assert.match(verifier, /^[A-Za-z0-9_-]+$/);
});

test("generatePkcePair: two calls produce different verifiers", () => {
  const a = generatePkcePair();
  const b = generatePkcePair();
  assert.notEqual(a.verifier, b.verifier);
});
