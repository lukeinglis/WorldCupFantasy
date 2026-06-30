"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TIER1_MAX, TIER2_MAX } from "@/data/participants";

interface RankedParticipant {
  id: string;
  name: string;
  tier1Total: number;
  tier2Total: number;
  total: number;
  tiebreaker: { homeScore: number; awayScore: number };
}

type SortColumn = "total" | "tier1" | "tier2";

function getMedalEmoji(rank: number): string {
  switch (rank) {
    case 1: return "🥇";
    case 2: return "🥈";
    case 3: return "🥉";
    default: return "";
  }
}

function getMedalColor(rank: number): string {
  switch (rank) {
    case 1: return "text-gold";
    case 2: return "text-silver";
    case 3: return "text-bronze";
    default: return "text-gray-500";
  }
}

function SortArrow({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  if (!active) return <span className="text-gray-700 ml-1">↕</span>;
  return <span className="text-white ml-1">{direction === "desc" ? "↓" : "↑"}</span>;
}

export default function SortableTable({ participants }: { participants: RankedParticipant[] }) {
  const [sortCol, setSortCol] = useState<SortColumn>("total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(col: SortColumn) {
    if (sortCol === col) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  const sorted = useMemo(() => {
    const getValue = (p: RankedParticipant) => {
      switch (sortCol) {
        case "tier1": return p.tier1Total;
        case "tier2": return p.tier2Total;
        default: return p.total;
      }
    };

    return [...participants].sort((a, b) => {
      const diff = getValue(b) - getValue(a);
      if (sortDir === "asc") return -diff || a.name.localeCompare(b.name);
      return diff || a.name.localeCompare(b.name);
    });
  }, [participants, sortCol, sortDir]);

  const ranked = sorted.map((p, i) => ({ ...p, rank: i + 1 }));

  return (
    <div className="overflow-auto max-h-[780px]">
      <table className="w-full">
        <thead className="sticky top-0 bg-navy z-10">
          <tr className="border-b border-white/10 text-left">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 w-14">#</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Player</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center">
              <button
                type="button"
                onClick={() => handleSort("tier1")}
                className={`cursor-pointer hover:text-white transition-colors ${sortCol === "tier1" ? "text-accent" : "text-accent/60"}`}
              >
                <span className="hidden sm:inline">Tier 1</span>
                <span className="sm:hidden">T1</span>
                <SortArrow active={sortCol === "tier1"} direction={sortDir} />
              </button>
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center">
              <button
                type="button"
                onClick={() => handleSort("tier2")}
                className={`cursor-pointer hover:text-white transition-colors ${sortCol === "tier2" ? "text-gold" : "text-gold/60"}`}
              >
                <span className="hidden sm:inline">Tier 2</span>
                <span className="sm:hidden">T2</span>
                <SortArrow active={sortCol === "tier2"} direction={sortDir} />
              </button>
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">
              <button
                type="button"
                onClick={() => handleSort("total")}
                className={`cursor-pointer hover:text-white transition-colors ${sortCol === "total" ? "text-gray-300" : "text-gray-500"}`}
              >
                Total
                <SortArrow active={sortCol === "total"} direction={sortDir} />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((p) => (
            <tr
              key={p.id}
              className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-1">
                  {p.rank <= 3 ? (
                    <span className="text-lg">{getMedalEmoji(p.rank)}</span>
                  ) : (
                    <span className={`font-heading text-lg font-bold ${getMedalColor(p.rank)}`}>
                      {p.rank}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div>
                    <Link
                      href={`/leaderboard/${p.id}`}
                      className="font-medium text-white hover:text-accent transition-colors"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-gray-600">
                      TB: {p.tiebreaker.homeScore}:{p.tiebreaker.awayScore}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-center">
                <div>
                  <span className="font-heading text-lg font-bold text-accent">
                    {p.tier1Total}
                  </span>
                  <p className="text-xs text-gray-600">/{TIER1_MAX}</p>
                </div>
              </td>
              <td className="px-4 py-4 text-center">
                <div>
                  <span className="font-heading text-lg font-bold text-gold">
                    {p.tier2Total}
                  </span>
                  <p className="text-xs text-gray-600">/{TIER2_MAX}</p>
                </div>
              </td>
              <td className="px-4 py-4 text-right">
                <span className="font-heading text-2xl font-bold text-white">
                  {p.total}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
