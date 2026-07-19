// Refreshes Web/lib/printify-snapshot.json — a real but static snapshot of the
// connected Printify shop (never called live from the edge runtime, per
// Web/README's "never calls Etsy/Printify directly" boundary; see /mcp page).
// Printify's WAF blocks the default Node/undici User-Agent — a real UA string
// is required or every request 403s.
//
//   PRINTIFY_API_KEY=... PRINTIFY_SHOP_ID=22824531 node scripts/fetch-printify-snapshot.mjs

import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const outPath = join(root, "../lib/printify-snapshot.json");

const shopId = process.env.PRINTIFY_SHOP_ID;
const apiKey = process.env.PRINTIFY_API_KEY;
if (!shopId || !apiKey) throw new Error("PRINTIFY_API_KEY and PRINTIFY_SHOP_ID are required");

async function fetchPage(page) {
  const res = await fetch(
    `https://api.printify.com/v1/shops/${shopId}/products.json?limit=50&page=${page}`,
    { headers: { Authorization: `Bearer ${apiKey}`, "User-Agent": "EtsyOS/1.0" } },
  );
  if (!res.ok) throw new Error(`Printify API ${res.status} on page ${page}`);
  return res.json();
}

async function fetchShop() {
  const res = await fetch("https://api.printify.com/v1/shops.json", {
    headers: { Authorization: `Bearer ${apiKey}`, "User-Agent": "EtsyOS/1.0" },
  });
  if (!res.ok) throw new Error(`Printify API ${res.status} on shops.json`);
  const shops = await res.json();
  return shops.find((s) => String(s.id) === String(shopId)) ?? shops[0];
}

const shop = await fetchShop();

const products = [];
for (let page = 1; ; page++) {
  const d = await fetchPage(page);
  products.push(...d.data);
  if (products.length >= d.total || d.data.length === 0) break;
  await new Promise((r) => setTimeout(r, 500)); // stay under the account's QPS limit
}

const prices = products.map((p) => p.variants?.[0]?.price / 100).filter((p) => Number.isFinite(p));
const snapshot = {
  shopId: shop.id,
  shopTitle: shop.title,
  salesChannel: shop.sales_channel,
  totalProducts: products.length,
  visibleProducts: products.filter((p) => p.visible).length,
  distinctBlueprints: new Set(products.map((p) => p.blueprint_id)).size,
  avgPriceUsd: prices.length ? Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100 : null,
  minPriceUsd: prices.length ? Math.min(...prices) : null,
  maxPriceUsd: prices.length ? Math.max(...prices) : null,
  fetchedAt: new Date().toISOString(),
};

await writeFile(outPath, JSON.stringify(snapshot, null, 2) + "\n");
console.log(JSON.stringify(snapshot, null, 2));
