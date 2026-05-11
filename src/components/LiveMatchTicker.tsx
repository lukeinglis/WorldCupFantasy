"use client";

import { useState, useEffect, useCallback } from "react";
import type { TransformedMatch } from "@/lib/football-api-types";

const POLL_INTERVAL = 60_000; // 60 seconds

interface LiveMatchTickerProps {
  /** If true, fetches all matches; if false, only live ones */
  fetchAll?: boolean;
  /** Custom poll interval in ms */
  pollInterval?: number;
  /** Render function */
  children: (data: {
    matches: TransformedMatch[];
    liveMatches: TransformedMatch[];
    isLoading: boolean;
    lastUpdated: Date | null;
    error: string | null;
  }) => React.ReactNode;
}

export default function LiveMatchTicker({
  fetchAll = false,
  pollInterval = POLL_INTERVAL,
  children,
}: LiveMatchTickerProps) {
  const [matches, setMatches] = useState<TransformedMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      const url = fetchAll ? "/api/football/matches" : "/api/football/matches?status=LIVE";
      const res = await fetch(url);

      if (res.status === 503) {
        // API not configured, not an error
        setMatches([]);
        setError(null);
        return;
      }

      if (!res.ok) {
        setError("Failed to fetch matches");
        return;
      }

      const data = await res.json();
      if (data.matches) {
        setMatches(data.matches);
        setError(null);
        setLastUpdated(new Date());
      }
    } catch {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  }, [fetchAll]);

  useEffect(() => {
    fetchMatches();

    const interval = setInterval(fetchMatches, pollInterval);
    return () => clearInterval(interval);
  }, [fetchMatches, pollInterval]);

  const liveMatches = matches.filter((m) => m.isLive);

  return <>{children({ matches, liveMatches, isLoading, lastUpdated, error })}</>;
}

// ── Status badge component ──

export function MatchStatusBadge({ status }: { status: string }) {
  const isLive = ["IN_PLAY", "PAUSED", "EXTRA_TIME", "PENALTY_SHOOTOUT"].includes(status);
  const isFinished = status === "FINISHED";

  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-red-400 animate-pulse">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        {status === "IN_PLAY"
          ? "LIVE"
          : status === "PAUSED"
          ? "HT"
          : status === "EXTRA_TIME"
          ? "ET"
          : "PEN"}
      </span>
    );
  }

  if (isFinished) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-500/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
        FT
      </span>
    );
  }

  return null;
}

// ── Score display ──

export function MatchScore({
  homeScore,
  awayScore,
  status,
}: {
  homeScore: number | null;
  awayScore: number | null;
  status: string;
}) {
  const hasScore = homeScore !== null && awayScore !== null;
  const isLive = ["IN_PLAY", "PAUSED", "EXTRA_TIME", "PENALTY_SHOOTOUT"].includes(status);
  const isFinished = status === "FINISHED";

  if (!hasScore) {
    return <span className="text-xs font-bold text-gray-600 px-2">vs</span>;
  }

  return (
    <span
      className={`font-heading text-lg font-bold px-3 ${
        isLive
          ? "text-red-400"
          : isFinished
          ? "text-white"
          : "text-gray-400"
      }`}
    >
      {homeScore} : {awayScore}
    </span>
  );
}
