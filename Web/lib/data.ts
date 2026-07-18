import {
  CATEGORIES_WITH_LISTINGS,
  Listing,
  ParsedListing,
  RegenerationType,
  Status,
  isMarkdownFile,
  listingPath,
  parseListing,
  serializeListing,
} from "./listings";
import { getFile, listDir, putFile } from "./github";
import { MOCK_LISTINGS } from "./mock";

// MOCK_DATA=1 (local dev / CI verification only) serves the bundled seed fiches
// from lib/mock.ts and skips GitHub entirely. Must be explicit — a missing
// GITHUB_TOKEN must NEVER silently fall back to mock data, or a misconfigured
// production deployment would look fully functional while quietly serving
// fake data forever. Set MOCK_DATA=1 yourself when you want the mock path.
export function isMockMode(): boolean {
  return process.env.MOCK_DATA === "1";
}

function mockParsed(): ParsedListing[] {
  return MOCK_LISTINGS.map((data) => ({
    data,
    body: data.description_long,
    sha: null,
    path: listingPath(data.category, data.slug),
  }));
}

export async function getAllListings(): Promise<ParsedListing[]> {
  if (isMockMode()) return mockParsed();

  const results: ParsedListing[] = [];
  for (const category of CATEGORIES_WITH_LISTINGS) {
    const dir = `Products/${category}/Listings`;
    const entries = await listDir(dir);
    for (const entry of entries) {
      if (entry.type !== "file" || !isMarkdownFile(entry.name)) continue;
      const file = await getFile(entry.path);
      if (!file) continue;
      results.push(parseListing(file.content, entry.path, file.sha));
    }
  }
  return results;
}

export async function getListing(slug: string): Promise<ParsedListing | null> {
  if (isMockMode()) {
    return mockParsed().find((l) => l.data.slug === slug) ?? null;
  }
  for (const category of CATEGORIES_WITH_LISTINGS) {
    const path = listingPath(category, slug);
    const file = await getFile(path);
    if (file) return parseListing(file.content, path, file.sha);
  }
  return null;
}

export type ActionKind =
  | "approve"
  | "publish"
  | "reject"
  | "hold"
  | "archive"
  | "favorite"
  | "regenerate"
  | "edit";

export interface ActionRequest {
  action: ActionKind;
  regen?: RegenerationType;
  fields?: Partial<Listing>;
}

const STATUS_FOR: Partial<Record<ActionKind, Status>> = {
  approve: "Approved",
  publish: "PublishRequested",
  reject: "Rejected",
  hold: "OnHold",
  archive: "Archived",
};

// The single write path. Every button in the UI funnels through here: read the
// fiche, mutate specific frontmatter fields, append an immutable history entry,
// commit back via the GitHub Contents API. It NEVER calls Etsy/Printify/image-gen.
export async function applyAction(
  slug: string,
  req: ActionRequest,
): Promise<ParsedListing> {
  const parsed = await getListing(slug);
  if (!parsed) throw new Error(`Listing not found: ${slug}`);

  const now = new Date().toISOString();
  const data: Listing = { ...parsed.data };
  let historyAction = req.action as string;
  let note = "";

  switch (req.action) {
    case "approve":
    case "publish":
    case "reject":
    case "hold":
    case "archive": {
      const next = STATUS_FOR[req.action]!;
      note = `Status ${data.status} -> ${next}`;
      data.status = next;
      break;
    }
    case "favorite": {
      data.favorite = !data.favorite;
      historyAction = data.favorite ? "favorited" : "unfavorited";
      note = `favorite = ${data.favorite}`;
      break;
    }
    case "regenerate": {
      if (!req.regen) throw new Error("regenerate requires a regen type");
      data.regeneration_requested = req.regen;
      historyAction = `regenerate:${req.regen}`;
      note = `Requested regeneration of ${req.regen}`;
      break;
    }
    case "edit": {
      if (!req.fields) throw new Error("edit requires fields");
      Object.assign(data, req.fields);
      historyAction = "edited";
      note = `Edited: ${Object.keys(req.fields).join(", ")}`;
      break;
    }
    default:
      throw new Error(`Unknown action: ${req.action}`);
  }

  data.updated = now.slice(0, 10);
  data.history = [
    ...(data.history ?? []),
    { date: now, action: historyAction, actor: "console", note },
  ];

  const content = serializeListing(data, parsed.body);

  if (isMockMode()) {
    // Mock mode has no backing store — return the mutated fiche so the UI can
    // reflect the change optimistically. Not persisted (verification only).
    return { ...parsed, data };
  }

  await putFile(parsed.path, content, parsed.sha, `web: ${historyAction} ${slug}`);
  return parseListing(content, parsed.path, null);
}
