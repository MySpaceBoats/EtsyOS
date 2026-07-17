import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { R2Client } from "../src/r2-client.ts";

const config = {
  accountId: "acct123",
  accessKeyId: "AKIAEXAMPLE",
  secretAccessKey: "secretExample",
  bucket: "etsyos-assets",
};

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

type Captured = { url: string; method: string; body?: unknown; headers?: Headers };

function fakeFetch(handler: (c: Captured) => Response): Captured[] {
  const calls: Captured[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    // aws4fetch signs and calls fetch(Request); other paths may pass (url, init).
    const req = input instanceof Request ? input : null;
    const url = req ? req.url : input instanceof URL ? input.toString() : String(input);
    const c: Captured = {
      url,
      method: req ? req.method : init?.method ?? "GET",
      headers: req ? req.headers : new Headers(init?.headers as HeadersInit),
    };
    calls.push(c);
    return handler(c);
  }) as typeof fetch;
  return calls;
}

test("upload: PUTs bytes and returns sha256 checksum + object url", async () => {
  const calls = fakeFetch(() => new Response(null, { status: 200 }));
  const client = new R2Client(config);
  const bytes = Buffer.from("hello world");
  const b64 = bytes.toString("base64");

  const res = await client.upload("images/a.png", b64, "image/png");

  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "PUT");
  assert.equal(calls[0].url, "https://acct123.r2.cloudflarestorage.com/etsyos-assets/images/a.png");
  assert.equal(res.key, "images/a.png");
  assert.equal(res.checksum, createHash("sha256").update(bytes).digest("hex"));
});

test("upload: throws on non-2xx with status in message", async () => {
  fakeFetch(() => new Response("AccessDenied", { status: 403 }));
  const client = new R2Client(config);
  await assert.rejects(
    () => client.upload("k", Buffer.from("x").toString("base64"), "text/plain"),
    /\[403\]/,
  );
});

test("download: returns base64 + content-type", async () => {
  fakeFetch(() => new Response(Buffer.from("PNGDATA"), { status: 200, headers: { "content-type": "image/png" } }));
  const client = new R2Client(config);
  const res = await client.download("images/a.png");
  assert.equal(Buffer.from(res.contentBase64, "base64").toString(), "PNGDATA");
  assert.equal(res.contentType, "image/png");
});

test("delete: returns { deleted: true }", async () => {
  const calls = fakeFetch(() => new Response(null, { status: 204 }));
  const client = new R2Client(config);
  const res = await client.delete("images/a.png");
  assert.deepEqual(res, { deleted: true });
  assert.equal(calls[0].method, "DELETE");
});

test("list: parses keys from ListObjectsV2 XML and passes prefix", async () => {
  const xml =
    '<?xml version="1.0"?><ListBucketResult>' +
    "<Contents><Key>images/a.png</Key></Contents>" +
    "<Contents><Key>images/b&amp;c.png</Key></Contents>" +
    "</ListBucketResult>";
  const calls = fakeFetch(() => new Response(xml, { status: 200 }));
  const client = new R2Client(config);
  const res = await client.list("images/");
  assert.deepEqual(res.keys, ["images/a.png", "images/b&c.png"]);
  assert.match(calls[0].url, /list-type=2/);
  assert.match(calls[0].url, /prefix=images/);
});

test("getSignedUrl: offline SigV4 query signing, no network call", async () => {
  const calls = fakeFetch(() => new Response(null, { status: 200 }));
  const client = new R2Client(config);
  const res = await client.getSignedUrl("images/a.png", 900);
  assert.equal(calls.length, 0);
  assert.match(res.url, /X-Amz-Signature=/);
  assert.match(res.url, /X-Amz-Expires=900/);
});

test("publicUrl: uses configured base, throws when unset", () => {
  const withBase = new R2Client({ ...config, publicUrlBase: "https://cdn.example.com/" });
  assert.equal(withBase.publicUrl("images/a.png").url, "https://cdn.example.com/images/a.png");
  const noBase = new R2Client(config);
  assert.throws(() => noBase.publicUrl("images/a.png"), /R2_PUBLIC_URL_BASE/);
});
