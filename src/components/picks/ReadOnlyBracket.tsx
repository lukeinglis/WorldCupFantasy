"use client";

import { useMemo } from "react";
import BracketDisplay from "@/components/BracketDisplay";
import type { KnockoutMatch } from "@/components/BracketPicker";
import type { KnockoutPick } from "@/data/participants";
import { getEliminatedTeams } from "@/data/scoring";

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
    return getEliminatedTeams(results);
  }, [results]);

  return (
    <BracketDisplay
      picks={picksMap}
      actualResults={results}
      eliminatedTeams={eliminatedTeams}
    />
  );
}
