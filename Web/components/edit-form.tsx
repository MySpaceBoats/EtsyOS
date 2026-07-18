"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { Listing, Variant } from "@/lib/listings";

function toList(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function EditForm({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(listing.title_etsy);
  const [descLong, setDescLong] = useState(listing.description_long);
  const [descShort, setDescShort] = useState(listing.description_short);
  const [price, setPrice] = useState(String(listing.price));
  const [tags, setTags] = useState(listing.tags.join(", "));
  const [categories, setCategories] = useState(listing.categories_etsy.join(", "));
  const [materials, setMaterials] = useState(listing.materials.join(", "));
  const [colors, setColors] = useState(listing.colors.join(", "));
  const [sizes, setSizes] = useState(listing.sizes.join(", "));
  const [variants, setVariants] = useState<Variant[]>(listing.variants);

  function setVariantOptions(name: string, value: string) {
    setVariants((vs) =>
      vs.map((v) => (v.name === name ? { ...v, options: toList(value) } : v)),
    );
  }

  async function save() {
    setError(null);
    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Prix invalide");
      return;
    }
    if (tags && toList(tags).length > 13) {
      setError("Etsy autorise 13 tags maximum");
      return;
    }
    const fields: Partial<Listing> = {
      title_etsy: title,
      description_long: descLong,
      description_short: descShort,
      price: parsedPrice,
      tags: toList(tags),
      categories_etsy: toList(categories),
      materials: toList(materials),
      colors: toList(colors),
      sizes: toList(sizes),
      variants,
    };
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${listing.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit", fields }),
      });
      if (!res.ok) throw new Error((await res.text()) || `Échec (${res.status})`);
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil /> Modifier
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier la fiche</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Titre Etsy">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Description longue">
            <Textarea
              className="min-h-[120px]"
              value={descLong}
              onChange={(e) => setDescLong(e.target.value)}
            />
          </Field>
          <Field label="Description courte">
            <Input value={descShort} onChange={(e) => setDescShort(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix">
              <Input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
            <Field label="Couleurs (virgules)">
              <Input value={colors} onChange={(e) => setColors(e.target.value)} />
            </Field>
          </div>
          <Field label="Tags (virgules, max 13)">
            <Input value={tags} onChange={(e) => setTags(e.target.value)} />
          </Field>
          <Field label="Catégories Etsy (virgules)">
            <Input value={categories} onChange={(e) => setCategories(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Matériaux (virgules)">
              <Input value={materials} onChange={(e) => setMaterials(e.target.value)} />
            </Field>
            <Field label="Tailles (virgules)">
              <Input value={sizes} onChange={(e) => setSizes(e.target.value)} />
            </Field>
          </div>
          {variants.map((v) => (
            <Field key={v.name} label={`Variante — ${v.name} (options, virgules)`}>
              <Input
                defaultValue={v.options.join(", ")}
                onChange={(e) => setVariantOptions(v.name, e.target.value)}
              />
            </Field>
          ))}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button variant="ghost" disabled={saving}>Annuler</Button>
            </DialogClose>
            <Button onClick={save} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
