"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { STATUSES, type Listing, type Status } from "@/lib/listings";

const PAGE_SIZE = 12;
type SortKey = "date-desc" | "date-asc" | "price-desc" | "price-asc" | "title-asc";

export function DashboardClient({ listings }: { listings: Listing[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status | "all">("all");
  const [category, setCategory] = useState<string>("all");
  const [store, setStore] = useState<string>("all");
  const [color, setColor] = useState<string>("all");
  const [provider, setProvider] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [page, setPage] = useState(1);

  const categories = useMemo(
    () => Array.from(new Set(listings.map((l) => l.category))).sort(),
    [listings],
  );
  const stores = useMemo(
    () => Array.from(new Set(listings.map((l) => l.store).filter(Boolean))) as string[],
    [listings],
  );
  const colors = useMemo(
    () => Array.from(new Set(listings.flatMap((l) => l.colors))).sort(),
    [listings],
  );
  const providers = useMemo(
    () => Array.from(new Set(listings.map((l) => l.image_provider))).sort(),
    [listings],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = listings.filter((l) => {
      if (status !== "all" && l.status !== status) return false;
      if (category !== "all" && l.category !== category) return false;
      if (store !== "all" && l.store !== store) return false;
      if (color !== "all" && !l.colors.includes(color)) return false;
      if (provider !== "all" && l.image_provider !== provider) return false;
      if (from && l.updated < from) return false;
      if (to && l.updated > to) return false;
      if (q) {
        const hay = `${l.title_etsy} ${l.slug} ${l.sku} ${l.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      switch (sort) {
        case "date-asc":
          return a.updated.localeCompare(b.updated);
        case "price-desc":
          return b.price - a.price;
        case "price-asc":
          return a.price - b.price;
        case "title-asc":
          return a.title_etsy.localeCompare(b.title_etsy);
        default:
          return b.updated.localeCompare(a.updated);
      }
    });
    return result;
  }, [listings, query, status, category, store, color, provider, from, to, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const paged = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Produits à valider</h1>
        <p className="text-sm text-muted-foreground">
          {filtered.length} produit{filtered.length !== 1 ? "s" : ""} · le point de
          contrôle humain avant Etsy. Aucun bouton ici ne publie ni ne dépense
          quoi que ce soit — chaque action écrit une demande dans la fiche.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Rechercher (titre, slug, SKU, tag)…"
            value={query}
            onChange={(e) => resetPage(setQuery)(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <label className="text-xs">
            <span className="mb-1 block text-muted-foreground">Statut</span>
            <Select value={status} onChange={(e) => resetPage(setStatus)(e.target.value as Status | "all")}>
              <option value="all">Tous</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-muted-foreground">Catégorie</span>
            <Select value={category} onChange={(e) => resetPage(setCategory)(e.target.value)}>
              <option value="all">Toutes</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-muted-foreground">Boutique</span>
            <Select value={store} onChange={(e) => resetPage(setStore)(e.target.value)}>
              <option value="all">Toutes</option>
              {stores.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-muted-foreground">Couleur</span>
            <Select value={color} onChange={(e) => resetPage(setColor)(e.target.value)}>
              <option value="all">Toutes</option>
              {colors.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-muted-foreground">Fournisseur image</span>
            <Select value={provider} onChange={(e) => resetPage(setProvider)(e.target.value)}>
              <option value="all">Tous</option>
              {providers.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-muted-foreground">Modifié depuis</span>
            <Input type="date" value={from} onChange={(e) => resetPage(setFrom)(e.target.value)} />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-muted-foreground">Modifié jusqu&apos;à</span>
            <Input type="date" value={to} onChange={(e) => resetPage(setTo)(e.target.value)} />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-muted-foreground">Tri</span>
            <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="date-desc">Date (récent)</option>
              <option value="date-asc">Date (ancien)</option>
              <option value="price-desc">Prix (élevé)</option>
              <option value="price-asc">Prix (bas)</option>
              <option value="title-asc">Titre (A→Z)</option>
            </Select>
          </label>
        </div>
      </div>

      {paged.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">Aucun produit ne correspond aux filtres.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paged.map((l) => (
            <ProductCard key={l.slug} listing={l} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {current} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={current >= totalPages} onClick={() => setPage(current + 1)}>
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
