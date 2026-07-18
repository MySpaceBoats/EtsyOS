// Shared per-category knowledge used by the offline heuristic providers.
// This is curated seed data, not live market data — every section built from
// it is tagged source: "offline-heuristic" on the Product Object.

export interface CategoryProfile {
  seedKeywords: string[];
  priceLow: number;
  priceHigh: number;
  variants: { name: string; options: string[] }[];
  colors: string[];
  formats: string[];
  mockupScenes: string[];
  etsyCategories: string[];
  productType: string;
}

export const CATALOG: Record<string, CategoryProfile> = {
  Mugs: {
    seedKeywords: ["coffee mug", "ceramic mug", "funny mug", "gift mug", "custom mug"],
    priceLow: 12,
    priceHigh: 25,
    variants: [{ name: "Size", options: ["11oz", "15oz"] }],
    colors: ["White", "Black"],
    formats: ["11oz", "15oz"],
    mockupScenes: ["kitchen-table", "office-desk", "gift-box", "hands-holding"],
    etsyCategories: ["Home & Living", "Kitchen & Dining", "Drinkware"],
    productType: "mug",
  },
  Shirts: {
    seedKeywords: ["graphic tee", "vintage shirt", "funny tshirt", "gift shirt", "retro tee"],
    priceLow: 18,
    priceHigh: 35,
    variants: [
      { name: "Size", options: ["S", "M", "L", "XL", "2XL"] },
      { name: "Color", options: ["White", "Black", "Navy", "Heather Grey"] },
    ],
    colors: ["White", "Black", "Navy", "Heather Grey"],
    formats: ["Unisex", "Women", "Youth"],
    mockupScenes: ["flat-lay", "model-front", "model-back", "hanger"],
    etsyCategories: ["Clothing", "Unisex Adult Clothing", "Tops & Tees"],
    productType: "t-shirt",
  },
  "Wall-Art": {
    seedKeywords: ["wall art print", "printable art", "home decor print", "poster art", "minimalist print"],
    priceLow: 8,
    priceHigh: 45,
    variants: [{ name: "Size", options: ["A4", "A3", "30x40cm", "50x70cm"] }],
    colors: ["Full Color"],
    formats: ["Portrait", "Landscape", "Square"],
    mockupScenes: ["living-room", "bedroom", "frame-closeup", "gallery-wall"],
    etsyCategories: ["Art & Collectibles", "Prints", "Digital Prints"],
    productType: "art print",
  },
};

export const DEFAULT_PROFILE: CategoryProfile = {
  seedKeywords: ["handmade gift", "custom design", "unique gift"],
  priceLow: 10,
  priceHigh: 30,
  variants: [{ name: "Style", options: ["Standard"] }],
  colors: ["Default"],
  formats: ["Standard"],
  mockupScenes: ["studio", "lifestyle"],
  etsyCategories: ["Craft Supplies & Tools"],
  productType: "product",
};

export function profileFor(category: string): CategoryProfile {
  return CATALOG[category] ?? DEFAULT_PROFILE;
}

// Terms QA refuses outright — protected brands the shop must never reference.
export const TRADEMARK_BLOCKLIST = [
  "disney", "nike", "adidas", "pokemon", "marvel", "star wars", "harry potter",
  "nintendo", "barbie", "lego", "taylor swift", "nfl", "nba", "coca-cola",
];
