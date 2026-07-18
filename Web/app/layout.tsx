import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "EtsyOS — Validation Console",
  description:
    "The human checkpoint: review every AI-generated product before it goes anywhere near Etsy.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <span className="rounded bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                  EtsyOS
                </span>
                <span className="text-sm text-muted-foreground">
                  Validation Console
                </span>
              </Link>
              <ThemeToggle />
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
