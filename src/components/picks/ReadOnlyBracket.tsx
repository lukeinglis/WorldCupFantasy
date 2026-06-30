"use client";

import { useMemo } from "react";
import BracketDisplay from "@/components/BracketDisplay";
import type { KnockoutMatch } from "@/components/BracketPicker";
import type { KnockoutPick } from "@/data/participants";
import { R32_MATCHES } from "@/data/knockout-bracket";

export default function ReadOnlyBracket({
  knockoutMatches,
  picks,
  results,
}: {
  knockoutMatches: KnockoutMatch[];
  picks: KnockoutPick[];
  results?: Record<string, string>;
}) {
  const picksMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of picks) {
      map[`${p.round}_${p.matchNumber}`] = p.winner;
    }
    return map;
  }, [picks]);

  const eliminatedTeams = useMemo(() => {
    if (!results) return new Set<string>();
    const eliminated = new Set<string>();
    for (const [key, winner] of Object.entries(results)) {
      if (key.startsWith("round_of_32_")) {
        const num = parseInt(key.replace("round_of_32_", ""), 10);
        const r32 = R32_MATCHES.find((m) => m.matchNumber === num);
        if (r32) {
          if (r32.homeTeam && r32.homeTeam !== winner) eliminated.add(r32.homeTeam);
          if (r32.awayTeam && r32.awayTeam !== winner) eliminated.add(r32.awayTeam);
        }
      } else {
        const match = knockoutMatches.find((m) => `${m.round}_${m.matchNumber}` === key);
        if (match) {
          if (match.homeTeam && match.homeTeam.tla !== winner) eliminated.add(match.homeTeam.tla);
          if (match.awayTeam && match.awayTeam.tla !== winner) eliminated.add(match.awayTeam.tla);
        }
      }
    }
    return eliminated;
  }, [results, knockoutMatches]);

  return (
    <BracketDisplay
      picks={picksMap}
      actualResults={results}
      eliminatedTeams={eliminatedTeams}
    />
  );
}
