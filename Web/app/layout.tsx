import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sidebar, MobileNav } from "@/components/control/sidebar";
import { CommandPalette } from "@/components/control/command-palette";
import { AutoRefresh } from "@/components/control/auto-refresh";
import { getProducts } from "@/lib/state";

export const metadata: Metadata = {
  title: "EtsyOS Control Center",
  description:
    "La console d'administration et d'observabilité d'EtsyOS : workflows, pipeline, files d'attente, assets, MCP, logs — et le point de contrôle humain avant toute publication.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Palette entries come from engine state (cheap: one dir listing + small
  // JSON files, cached ~30s). Failure must never take the shell down.
  let products: { slug: string; title: string }[] = [];
  try {
    products = (await getProducts()).map((p) => ({ slug: p.slug, title: p.title }));
  } catch {
    products = [];
  }

  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <Providers>
          <AutoRefresh seconds={30} />
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
            <div className="flex h-14 items-center justify-between gap-3 px-4">
              <div className="flex items-center gap-3">
                <MobileNav />
                <Link href="/" className="flex items-center gap-2 font-semibold">
                  <span className="rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                    EtsyOS
                  </span>
                  <span className="hidden text-sm text-muted-foreground sm:inline">
                    Control Center
                  </span>
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <CommandPalette products={products} />
                <ThemeToggle />
              </div>
            </div>
          </header>
          <div className="flex">
            <Sidebar />
            <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
