"use client";

// Global search / command palette (⌘K / Ctrl+K): fuzzy-filters pages and
// products, keyboard-navigable.

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ALL_NAV_ITEMS } from "./nav";
import { cn } from "@/lib/utils";

interface Entry {
  href: string;
  label: string;
  group: string;
}

export function CommandPalette({ products }: { products: { slug: string; title: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const entries = useMemo<Entry[]>(
    () => [
      ...ALL_NAV_ITEMS.map((i) => ({ href: i.href, label: i.label, group: "Pages" })),
      ...products.map((p) => ({ href: `/products/${p.slug}`, label: p.title, group: "Produits" })),
    ],
    [products],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries.slice(0, 12);
    return entries
      .filter((e) => e.label.toLowerCase().includes(q) || e.href.toLowerCase().includes(q))
      .slice(0, 12);
  }, [entries, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setCursor(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const go = (href: string) => {
    close();
    router.push(href);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground sm:flex"
      >
        Rechercher…
        <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">⌘K</kbd>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 pt-[12vh]" onClick={close} role="dialog" aria-modal>
          <div
            className="mx-auto max-w-lg overflow-hidden rounded-xl border bg-popover shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCursor(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") setCursor((c) => Math.min(c + 1, results.length - 1));
                else if (e.key === "ArrowUp") setCursor((c) => Math.max(c - 1, 0));
                else if (e.key === "Enter" && results[cursor]) go(results[cursor].href);
              }}
              placeholder="Page, produit, workflow…"
              className="w-full border-b bg-transparent px-4 py-3 text-sm outline-none"
            />
            <ul className="max-h-72 overflow-y-auto p-1">
              {results.length === 0 ? (
                <li className="px-3 py-4 text-center text-sm text-muted-foreground">Aucun résultat</li>
              ) : (
                results.map((r, i) => (
                  <li key={r.href + r.label}>
                    <button
                      onClick={() => go(r.href)}
                      onMouseEnter={() => setCursor(i)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm",
                        i === cursor ? "bg-accent text-accent-foreground" : "text-foreground",
                      )}
                    >
                      <span>{r.label}</span>
                      <span className="text-xs text-muted-foreground">{r.group}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
