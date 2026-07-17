import { test } from "node:test";
import assert from "node:assert/strict";
import { userIdFromAccessToken } from "../src/auth.ts";

test("userIdFromAccessToken: extracts the numeric prefix", () => {
  assert.equal(userIdFromAccessToken("12345678.abcXYZ-opaquePart"), "12345678");
});

test("userIdFromAccessToken: throws on malformed token", () => {
  assert.throws(() => userIdFromAccessToken(""));
});
