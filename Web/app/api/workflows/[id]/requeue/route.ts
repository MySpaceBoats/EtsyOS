import { NextResponse } from "next/server";
import { enqueueTask, getWorkflow } from "@/lib/state";

export const runtime = "edge";

// POST /api/workflows/:id/requeue  { kind: "resume-workflow" | "retry-step" }
// Writes an intent task into Core/state/queue/tasks.json (GitHub Contents
// API). No execution happens here — same safety boundary as fiche writes.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { kind } = (await req.json().catch(() => ({}))) as { kind?: string };
  if (kind !== "resume-workflow" && kind !== "retry-step") {
    return NextResponse.json({ error: "kind must be resume-workflow or retry-step" }, { status: 400 });
  }
  const workflow = await getWorkflow(id);
  if (!workflow) {
    return NextResponse.json({ error: `Unknown workflow: ${id}` }, { status: 404 });
  }
  const task = await enqueueTask(kind, { workflowId: id, requestedBy: "console" });
  return NextResponse.json({ ok: true, task });
}
