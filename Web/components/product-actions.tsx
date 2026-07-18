"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Archive,
  Check,
  Image as ImageIcon,
  Film,
  FileText,
  Layers,
  Pin,
  RefreshCw,
  Send,
  Star,
  Tag,
  Type,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionKind } from "@/lib/data";
import type { RegenerationType, Status } from "@/lib/listings";

async function postAction(
  slug: string,
  body: { action: ActionKind; regen?: RegenerationType },
): Promise<void> {
  const res = await fetch(`/api/products/${slug}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
}

export function ProductActions({
  slug,
  status,
  favorite,
  variant,
}: {
  slug: string;
  status: Status;
  favorite: boolean;
  variant: "card" | "full";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run(body: { action: ActionKind; regen?: RegenerationType }) {
    setError(null);
    setBusy(true);
    postAction(slug, body)
      .then(() => startTransition(() => router.refresh()))
      .catch((e: Error) => setError(e.message))
      .finally(() => setBusy(false));
  }

  const disabled = busy || pending;

  if (variant === "card") {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          size="sm"
          variant="default"
          disabled={disabled || status === "Approved"}
          onClick={() => run({ action: "approve" })}
        >
          <Check /> Valider
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled || status === "Rejected"}
          onClick={() => run({ action: "reject" })}
        >
          <X /> Refuser
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Favori"
          disabled={disabled}
          onClick={() => run({ action: "favorite" })}
        >
          <Star className={favorite ? "fill-amber-400 text-amber-400" : ""} />
        </Button>
      </div>
    );
  }

  const regenButtons: { regen: RegenerationType; label: string; icon: React.ReactNode }[] = [
    { regen: "images", label: "Images", icon: <ImageIcon /> },
    { regen: "mockups", label: "Mockups", icon: <Layers /> },
    { regen: "video", label: "Vidéo", icon: <Film /> },
    { regen: "title", label: "Titre", icon: <Type /> },
    { regen: "description", label: "Description", icon: <FileText /> },
    { regen: "tags", label: "Tags", icon: <Tag /> },
    { regen: "all", label: "Tout", icon: <RefreshCw /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={disabled || status === "Approved"}
          onClick={() => run({ action: "approve" })}
        >
          <Check /> Valider
        </Button>
        <Button
          variant="secondary"
          disabled={disabled || status !== "Approved"}
          title={status !== "Approved" ? "Valider d'abord" : "Demander la publication"}
          onClick={() => run({ action: "publish" })}
        >
          <Send /> Publier maintenant
        </Button>
        <Button
          variant="outline"
          disabled={disabled || status === "Rejected"}
          onClick={() => run({ action: "reject" })}
        >
          <X /> Refuser
        </Button>
        <Button
          variant="outline"
          disabled={disabled || status === "OnHold"}
          onClick={() => run({ action: "hold" })}
        >
          <Pin /> Mettre en attente
        </Button>
        <Button
          variant="outline"
          disabled={disabled}
          onClick={() => run({ action: "favorite" })}
        >
          <Star className={favorite ? "fill-amber-400 text-amber-400" : ""} />
          {favorite ? "Retirer favori" : "Favori"}
        </Button>
        <Button
          variant="outline"
          disabled={disabled || status === "Archived"}
          onClick={() => run({ action: "archive" })}
        >
          <Archive /> Archiver
        </Button>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Régénérer (demande — aucune génération déclenchée ici)
        </p>
        <div className="flex flex-wrap gap-2">
          {regenButtons.map((b) => (
            <Button
              key={b.regen}
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => run({ action: "regenerate", regen: b.regen })}
            >
              {b.icon} {b.label}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
