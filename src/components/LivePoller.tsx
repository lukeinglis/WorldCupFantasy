"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface LivePollerProps {
  hasLiveMatches: boolean;
  isTournamentActive: boolean;
  intervalMs?: number;
}

export default function LivePoller({
  hasLiveMatches,
  isTournamentActive,
  intervalMs,
}: LivePollerProps) {
  const router = useRouter();
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const interval =
    intervalMs ??
    (hasLiveMatches ? 60_000 : isTournamentActive ? 300_000 : 0);

  const refresh = useCallback(() => {
    router.refresh();
    setLastRefreshed(new Date());
  }, [router]);

  useEffect(() => {
    if (interval <= 0) return;

    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [interval, refresh]);

  if (interval <= 0) return null;

  return (
    <p className="text-xs text-gray-500 text-center mt-2">
      {lastRefreshed
        ? `Auto-refreshed at ${lastRefreshed.toLocaleTimeString()}`
        : `Auto-refresh every ${Math.round(interval / 1000)}s`}
    </p>
  );
}
