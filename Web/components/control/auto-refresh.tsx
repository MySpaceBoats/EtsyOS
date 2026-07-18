"use client";

// "Real-time" without a socket: the whole app re-renders its server components
// every `seconds` while the tab is visible (router.refresh() — no full page
// reload). Reads stay cheap because lib/github.ts caches GitHub reads ~30s.
// A push channel (SSE/websocket) needs an always-on origin the Pages + GitHub
// architecture deliberately doesn't have; polling is the honest fit.

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(tick, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
