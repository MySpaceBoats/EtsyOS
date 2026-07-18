// Minimal GitHub REST Contents API client. Raw `fetch` only, so the exact same
// code path runs in `next dev` (Node) and on the Cloudflare Pages Workers
// runtime — no @octokit, no environment branching, no filesystem access. This
// is the app's ONLY database. See Web/README.md for the safety boundary.

const API = "https://api.github.com";

function repo(): string {
  return process.env.GITHUB_REPO || "MySpaceBoats/EtsyOS";
}

export function branch(): string {
  return process.env.GITHUB_BRANCH || "main";
}

function headers(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is not set (and MOCK_DATA is not enabled).");
  }
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "etsyos-web",
  };
}

function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): string {
  const binary = atob(b64.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export interface DirEntry {
  name: string;
  path: string;
  type: "file" | "dir";
}

export interface FileResult {
  content: string;
  sha: string;
}

// Short revalidate window so a dashboard listing N products doesn't hammer
// GitHub's 5000/hr authenticated rate limit on every page load.
const READ_REVALIDATE = 30;

export async function listDir(path: string): Promise<DirEntry[]> {
  const url = `${API}/repos/${repo()}/contents/${path}?ref=${branch()}`;
  const res = await fetch(url, {
    headers: headers(),
    next: { revalidate: READ_REVALIDATE },
  });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`listDir ${path}: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as DirEntry[];
  return Array.isArray(json) ? json : [];
}

export async function getFile(path: string): Promise<FileResult | null> {
  const url = `${API}/repos/${repo()}/contents/${path}?ref=${branch()}`;
  const res = await fetch(url, {
    headers: headers(),
    next: { revalidate: READ_REVALIDATE },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getFile ${path}: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { content: string; sha: string };
  return { content: fromBase64(json.content), sha: json.sha };
}

export async function putFile(
  path: string,
  content: string,
  sha: string | null,
  message: string,
): Promise<void> {
  const url = `${API}/repos/${repo()}/contents/${path}`;
  const body: Record<string, unknown> = {
    message,
    content: toBase64(content),
    branch: branch(),
  };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`putFile ${path}: ${res.status} ${await res.text()}`);
}
