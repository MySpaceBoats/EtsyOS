"use client";

// Requeue/Resume: writes an intent task into the engine's queue file via the
// API route. The web tier never executes the workflow itself — the engine
// (Claude Code / a GitHub Actions routine) drains the queue.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RequeueButton({
  workflowId,
  kind,
}: {
  workflowId: string;
  kind: "resume-workflow" | "retry-step";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const label = kind === "retry-step" ? "Relancer (retry)" : "Reprendre (requeue)";

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={busy || done}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await fetch(`/api/workflows/${workflowId}/requeue`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind }),
          });
          if (!res.ok) throw new Error(await res.text());
          setDone(true);
          router.refresh();
        } catch (err) {
          alert(`Échec de la mise en file: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          setBusy(false);
        }
      }}
    >
      {done ? "En file ✓" : busy ? "…" : label}
    </Button>
  );
}
