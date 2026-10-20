"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { GO_API_URL } from "@/utils/apiData";

// Fires a lightweight beacon on every route change so the admin "Обзор"
// dashboard can show real traffic instead of made-up numbers. Fire-and-forget
// — a failed/blocked request (ad blockers, offline) must never affect the page.
export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    fetch(`${GO_API_URL}/api/track-visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
