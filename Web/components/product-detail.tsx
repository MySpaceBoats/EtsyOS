"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductActions } from "@/components/product-actions";
import { EtsyPreview } from "@/components/etsy-preview";
import { EditForm } from "@/components/edit-form";
import { formatPrice } from "@/lib/utils";
import type { HistoryEntry, Listing } from "@/lib/listings";

export function ProductDetail({ listing }: { listing: Listing }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Retour">
            <Link href="/">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold leading-tight">{listing.title_etsy}</h1>
            <p className="text-sm text-muted-foreground">
              {listing.category} · {listing.sku} ·{" "}
              {formatPrice(listing.price, listing.currency)}
            </p>
          </div>
        </div>
        <StatusBadge status={listing.status} />
      </div>

      {listing.regeneration_requested && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Régénération demandée : <strong>{listing.regeneration_requested}</strong> —
          en attente de la routine (aucune génération lancée par la console).
        </div>
      )}

      <Tabs defaultValue="fiche">
        <TabsList>
          <TabsTrigger value="fiche">Fiche</TabsTrigger>
          <TabsTrigger value="apercu">Aperçu Etsy</TabsTrigger>
        </TabsList>

        <TabsContent value="fiche" className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <EditForm listing={listing} />
          </div>

          <ProductActions
            slug={listing.slug}
            status={listing.status}
            favorite={listing.favorite}
            variant="full"
          />

          <MetadataGrid listing={listing} />
          <HistoryTimeline history={listing.history} />
        </TabsContent>

        <TabsContent value="apercu">
          <EtsyPreview listing={listing} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetadataGrid({ listing }: { listing: Listing }) {
  const rows: [string, React.ReactNode][] = [
    ["Slug", listing.slug],
    ["Statut", listing.status],
    ["Catégorie", listing.category],
    ["Collection", listing.collection ?? "—"],
    ["Boutique", listing.store ?? "—"],
    ["Prix", formatPrice(listing.price, listing.currency)],
    ["SKU", listing.sku],
    ["POD", listing.pod_provider],
    ["Matériaux", listing.materials.join(", ") || "—"],
    ["Couleurs", listing.colors.join(", ") || "—"],
    ["Tailles", listing.sizes.join(", ") || "—"],
    ["Variantes", listing.variants.map((v) => `${v.name}: ${v.options.join("/")}`).join(" · ") || "—"],
    ["Catégories Etsy", listing.categories_etsy.join(", ") || "—"],
    ["Tags", listing.tags.join(", ") || "—"],
    ["Images", `${listing.images.length}`],
    ["Mockups", `${listing.mockups.length}`],
    ["Vidéo", listing.video_url ?? "—"],
    ["Fournisseur image", listing.image_provider],
    ["Modèle image", listing.image_model],
    ["Score qualité", listing.quality_score != null ? listing.quality_score.toFixed(1) : "—"],
    ["Favori", listing.favorite ? "★ oui" : "non"],
    ["Printify ID", listing.printify_product_id ?? "—"],
    ["Etsy listing ID", listing.etsy_listing_id ?? "—"],
    ["Créé", listing.created],
    ["Modifié", listing.updated],
  ];
  return (
    <div className="rounded-lg border">
      <dl className="divide-y">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-3 gap-4 px-4 py-2 text-sm">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="col-span-2 break-words">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function HistoryTimeline({ history }: { history: HistoryEntry[] }) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Historique
      </h2>
      <ol className="space-y-2 border-l pl-4">
        {[...history].reverse().map((h, i) => (
          <li key={i} className="text-sm">
            <span className="font-medium">{h.action}</span>{" "}
            <span className="text-muted-foreground">
              · {new Date(h.date).toLocaleString("fr-FR")} · {h.actor}
            </span>
            {h.note && <p className="text-xs text-muted-foreground">{h.note}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
