/**
 * Cloudflare R2 (S3-compatible) client over aws4fetch (SigV4 signing on top of fetch).
 * No AWS SDK — aws4fetch signs requests against the global fetch; tests monkeypatch it.
 */
import { createHash } from "node:crypto";
import { AwsClient } from "aws4fetch";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** Defaults to https://<accountId>.r2.cloudflarestorage.com */
  endpoint?: string;
  /** Optional public bucket base (custom domain or pub-<hash>.r2.dev) for publicUrl(). */
  publicUrlBase?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  checksum: string;
}

export interface DownloadResult {
  contentBase64: string;
  contentType: string;
}

/** Percent-encode each path segment while preserving "/" separators. */
function encodeKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export class R2Client {
  private readonly aws: AwsClient;
  private readonly endpoint: string;
  private readonly bucket: string;
  private readonly publicUrlBase?: string;

  constructor(config: R2Config) {
    this.bucket = config.bucket;
    this.endpoint = (config.endpoint ?? `https://${config.accountId}.r2.cloudflarestorage.com`).replace(/\/+$/, "");
    this.publicUrlBase = config.publicUrlBase?.replace(/\/+$/, "");
    this.aws = new AwsClient({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: "auto",
      service: "s3",
    });
  }

  private objectUrl(key: string): string {
    return `${this.endpoint}/${this.bucket}/${encodeKey(key)}`;
  }

  private async ensureOk(res: Response, action: string, key?: string): Promise<void> {
    if (res.ok) return;
    const detail = await res.text().catch(() => "");
    throw new Error(`R2 ${action}${key ? ` ${key}` : ""} failed: [${res.status}] ${detail.slice(0, 300)}`);
  }

  async upload(key: string, contentBase64: string, contentType: string): Promise<UploadResult> {
    const body = Buffer.from(contentBase64, "base64");
    const url = this.objectUrl(key);
    const res = await this.aws.fetch(url, {
      method: "PUT",
      body,
      headers: { "content-type": contentType },
    });
    await this.ensureOk(res, "upload", key);
    return { key, url, checksum: sha256Hex(body) };
  }

  async download(key: string): Promise<DownloadResult> {
    const res = await this.aws.fetch(this.objectUrl(key), { method: "GET" });
    await this.ensureOk(res, "download", key);
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      contentBase64: buf.toString("base64"),
      contentType: res.headers.get("content-type") ?? "application/octet-stream",
    };
  }

  async delete(key: string): Promise<{ deleted: true }> {
    const res = await this.aws.fetch(this.objectUrl(key), { method: "DELETE" });
    await this.ensureOk(res, "delete", key);
    return { deleted: true };
  }

  async list(prefix?: string): Promise<{ keys: string[] }> {
    const params = new URLSearchParams({ "list-type": "2" });
    if (prefix) params.set("prefix", prefix);
    const res = await this.aws.fetch(`${this.endpoint}/${this.bucket}?${params.toString()}`, { method: "GET" });
    await this.ensureOk(res, "list");
    const xml = await res.text();
    const keys: string[] = [];
    for (const m of xml.matchAll(/<Key>([^<]*)<\/Key>/g)) {
      keys.push(decodeXmlEntities(m[1]));
    }
    return { keys };
  }

  /** Presigned GET URL for a private bucket. */
  async getSignedUrl(key: string, expiresInSeconds: number): Promise<{ url: string }> {
    const signed = await this.aws.sign(
      `${this.objectUrl(key)}?X-Amz-Expires=${expiresInSeconds}`,
      { method: "GET", aws: { signQuery: true } },
    );
    return { url: signed.url };
  }

  /** Direct public URL — only valid when the bucket is public and publicUrlBase is configured. */
  publicUrl(key: string): { url: string } {
    if (!this.publicUrlBase) {
      throw new Error("publicUrl requires R2_PUBLIC_URL_BASE to be configured");
    }
    return { url: `${this.publicUrlBase}/${encodeKey(key)}` };
  }
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
