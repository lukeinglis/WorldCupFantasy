"use client";

import { useState, useEffect, useCallback } from "react";
import type { GameScoreEntry } from "@/app/api/games/scores/route";

type GameName = "penalty" | "flags";

interface GameLeaderboardProps {
  game: GameName;
  currentUserId: string | null;
  /** Bumped externally to trigger a refetch */
  refreshKey: number;
  /** Collapsed state for mobile */
  defaultCollapsed?: boolean;
}

export default function GameLeaderboard({
  game,
  currentUserId,
  refreshKey,
  defaultCollapsed = false,
}: GameLeaderboardProps) {
  const [scores, setScores] = useState<GameScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [kvAvailable, setKvAvailable] = useState(true);

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/scores?game=${game}`);
      if (!res.ok) {
        setKvAvailable(false);
        return;
      }
      const data = await res.json();
      if (data.kvConfigured === false) {
        setKvAvailable(false);
        return;
      }
      setKvAvailable(true);
      setScores(data.scores ?? []);
    } catch {
      setKvAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [game]);

  // Fetch on mount and when refreshKey changes
  useEffect(() => {
    setLoading(true);
    fetchScores();
  }, [fetchScores, refreshKey]);

  const userEntry = currentUserId
    ? scores.find((s) => s.userId === currentUserId)
    : null;
  const userRank = currentUserId
    ? scores.findIndex((s) => s.userId === currentUserId) + 1
    : 0;

  const rankLabel = (rank: number): string => {
    if (rank === 1) return "1st";
    if (rank === 2) return "2nd";
    if (rank === 3) return "3rd";
    return `${rank}th`;
  };

  const rankColor = (rank: number): string => {
    if (rank === 1) return "text-gold";
    if (rank === 2) return "text-gray-300";
    if (rank === 3) return "text-amber-600";
    return "text-gray-500";
  };

  const rankBg = (rank: number): string => {
    if (rank === 1) return "bg-gold/10";
    if (rank === 2) return "bg-gray-300/5";
    if (rank === 3) return "bg-amber-600/5";
    return "";
  };

  if (!kvAvailable) {
    return null; // Don't show leaderboard when KV is unavailable
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1b2a]/90 backdrop-blur-sm overflow-hidden">
      {/* Header, always visible */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-3 sm:cursor-default"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>
            🏆
          </span>
          <span className="font-heading text-sm font-bold text-white uppercase tracking-wide">
            Leaderboard
          </span>
        </div>
        {/* Chevron for mobile collapse */}
        <span className="text-gray-500 text-xs sm:hidden">
          {collapsed ? "▼" : "▲"}
        </span>
      </button>

      {/* Content */}
      {!collapsed && (
        <div className="px-4 pb-4">
          {/* User's best score */}
          {userEntry && (
            <div className="mb-3 rounded-lg bg-accent/10 border border-accent/20 px-3 py-2">
              <p className="text-xs text-gray-400 mb-0.5">Your Best</p>
              <div className="flex items-center justify-between">
                <span className="font-heading text-lg font-bold text-accent">
                  {userEntry.score}
                </span>
                <span className="text-xs text-gray-400">
                  {rankLabel(userRank)}
                </span>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-white/10 mb-3" />

          {/* Loading */}
          {loading && (
            <div className="py-6 text-center">
              <div className="inline-block w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {!loading && scores.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-500">
              No scores yet. Be the first!
            </p>
          )}

          {/* Scores list */}
          {!loading && scores.length > 0 && (
            <ul className="space-y-1 max-h-64 overflow-y-auto pr-1">
              {scores.slice(0, 20).map((entry, idx) => {
                const rank = idx + 1;
                const isCurrentUser =
                  currentUserId != null && entry.userId === currentUserId;
                return (
                  <li
                    key={entry.userId}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                      isCurrentUser
                        ? "bg-accent/10 border border-accent/20"
                        : rankBg(rank)
                    }`}
                  >
                    {/* Rank */}
                    <span
                      className={`w-6 text-right font-heading font-bold text-xs ${rankColor(rank)}`}
                    >
                      {rank}.
                    </span>

                    {/* Name */}
                    <span
                      className={`flex-1 truncate ${
                        isCurrentUser
                          ? "font-bold text-accent"
                          : "text-gray-300"
                      }`}
                    >
                      {isCurrentUser ? "You" : entry.userName}
                    </span>

                    {/* Score */}
                    <span
                      className={`font-heading font-bold tabular-nums ${
                        rank === 1
                          ? "text-gold"
                          : isCurrentUser
                            ? "text-accent"
                            : "text-white"
                      }`}
                    >
                      {entry.score}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
