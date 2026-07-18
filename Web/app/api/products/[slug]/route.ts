import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { applyAction, type ActionRequest } from "@/lib/data";

// Edge runtime is required for @cloudflare/next-on-pages (Workers runtime).
export const runtime = "edge";

// The ONLY write endpoint. It mutates frontmatter on a product fiche and commits
// it back via the GitHub Contents API. It never calls Etsy, Printify, or
// image-gen — those happen later in a controlled GitHub Actions routine.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  let body: ActionRequest;
  try {
    body = (await req.json()) as ActionRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body?.action) {
    return NextResponse.json({ error: "Missing 'action'" }, { status: 400 });
  }

  try {
    const updated = await applyAction(slug, body);
    revalidatePath("/");
    revalidatePath(`/products/${slug}`);
    return NextResponse.json({ ok: true, status: updated.data.status });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
