"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface LivePollerProps {
  hasLiveMatches: boolean;
  isTournamentActive: boolean;
  intervalMs?: number;
  serverTimestamp?: string;
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

export default function LivePoller({
  hasLiveMatches,
  isTournamentActive,
  intervalMs,
  serverTimestamp,
}: LivePollerProps) {
  const router = useRouter();
  const [lastRefreshed, setLastRefreshed] = useState<Date>(
    serverTimestamp ? new Date(serverTimestamp) : new Date()
  );
  const [, setTick] = useState(0);

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

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="text-xs text-gray-600 mt-2">
      Last updated: {formatRelativeTime(lastRefreshed)}
      {interval > 0 && (
        <span className="text-gray-500 ml-1">
          · refreshes every {Math.round(interval / 1000)}s
        </span>
      )}
    </p>
  );
}
