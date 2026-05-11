"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Invisible component that auto-refreshes the schedule page every 60s
 * when live matches are in progress. Uses Next.js router.refresh() to
 * re-fetch server component data without a full page reload.
 */
export default function ScheduleClient() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 60_000); // Refresh every 60 seconds

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
