"use client";

// Permanent lateral navigation (collapses to a top drawer on mobile).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_SECTIONS } from "./nav";
import { cn } from "@/lib/utils";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-5 py-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {section.title}
          </div>
          <ul>
            {section.items.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "block rounded-md px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 overflow-y-auto border-r lg:block">
      <NavLinks />
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Menu"
        className="rounded-md border px-2.5 py-1.5 text-sm"
      >
        ☰
      </button>
      {open ? (
        <div className="fixed inset-x-0 top-14 z-50 max-h-[70vh] overflow-y-auto border-b bg-background shadow-lg">
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
