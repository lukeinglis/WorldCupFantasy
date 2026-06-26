"use client";

import { useMemo, useCallback } from "react";
import { getTeamByCode } from "@/data/teams";
import { knockoutRoundMatchCounts } from "@/data/participants";
import type { KnockoutPick } from "@/data/participants";

export interface KnockoutMatch {
  round: string;
  matchNumber: number;
  homeTeam: { tla: string; name: string } | null;
  awayTeam: { tla: string; name: string } | null;
  utcDate: string;
  status: string;
}

interface BracketPickerProps {
  knockoutMatches: KnockoutMatch[];
  picks: KnockoutPick[];
  onPicksChange: (picks: KnockoutPick[]) => void;
}

const ROUND_LABELS: Record<string, string> = {
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter: "Quarterfinals",
  semi: "Semifinals",
  third_place: "Third Place Playoff",
  final: "Final",
};

const ROUND_ORDER = ["round_of_32", "round_of_16", "quarter", "semi", "third_place", "final"];

const ROUND_POINTS: Record<string, number> = {
  round_of_32: 2,
  round_of_16: 4,
  quarter: 6,
  semi: 8,
  third_place: 8,
  final: 10,
};

// Map R32 match numbers to R16 match numbers (winners feed into the next round)
// R32 matches 1&9 -> R16 match 1, R32 2&10 -> R16 2, etc.
// This uses a standard bracket structure: each pair of adjacent R32 matches feeds one R16 match
function getNextRoundSlot(
  round: string,
  matchNumber: number
): { round: string; matchNumber: number; slot: "home" | "away" } | null {
  const roundIdx = ROUND_ORDER.indexOf(round);
  if (roundIdx === -1 || roundIdx >= ROUND_ORDER.length - 1) return null;
  const nextRound = ROUND_ORDER[roundIdx + 1];
  const currentMatchCount = knockoutRoundMatchCounts[round] ?? 0;
  const halfCount = Math.floor(currentMatchCount / 2);

  // Matches 1..halfCount are the "top half", halfCount+1..currentMatchCount are the "bottom half"
  // Match i and (i + halfCount) feed into nextRound match i
  if (matchNumber <= halfCount) {
    return { round: nextRound, matchNumber, slot: "home" };
  } else {
    return { round: nextRound, matchNumber: matchNumber - halfCount, slot: "away" };
  }
}

function TeamButton({
  teamCode,
  isSelected,
  onClick,
  disabled,
}: {
  teamCode: string | null;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  const team = teamCode ? getTeamByCode(teamCode) : null;
  const displayName = team?.name ?? teamCode ?? "TBD";
  const flag = team?.flag ?? "";
  const isTbd = !teamCode;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isTbd}
      className={`flex-1 flex items-center gap-2 px-3 py-3 rounded-lg text-left transition-all duration-200 active:scale-[0.98] min-w-0 ${
        isSelected
          ? "bg-gold/15 border-2 border-gold/50 shadow-sm shadow-gold/10"
          : isTbd
          ? "bg-white/[0.02] border border-white/5 cursor-not-allowed"
          : "bg-navy-lighter/40 border border-white/10 hover:bg-white/5 hover:border-white/20"
      } ${disabled && !isTbd ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {flag && <span className="text-lg leading-none shrink-0">{flag}</span>}
      <span
        className={`text-sm font-medium truncate ${
          isSelected ? "text-gold" : isTbd ? "text-gray-700" : "text-gray-300"
        }`}
      >
        {displayName}
      </span>
      {isSelected && (
        <span className="ml-auto text-gold text-xs font-bold shrink-0">W</span>
      )}
    </button>
  );
}

export default function BracketPicker({
  knockoutMatches,
  picks,
  onPicksChange,
}: BracketPickerProps) {
  // Index picks for fast lookup
  const picksMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const pick of picks) {
      map.set(`${pick.round}_${pick.matchNumber}`, pick.winner);
    }
    return map;
  }, [picks]);

  // Compute derived teams for R16+ based on user's picks
  const derivedTeams = useMemo(() => {
    const derived = new Map<string, { home: string | null; away: string | null }>();

    for (const round of ROUND_ORDER) {
      const matchCount = knockoutRoundMatchCounts[round] ?? 0;
      for (let m = 1; m <= matchCount; m++) {
        const key = `${round}_${m}`;
        if (!derived.has(key)) {
          // Initialize from API data
          const apiMatch = knockoutMatches.find(
            (km) => km.round === round && km.matchNumber === m
          );
          derived.set(key, {
            home: apiMatch?.homeTeam?.tla ?? null,
            away: apiMatch?.awayTeam?.tla ?? null,
          });
        }
      }
    }

    // Propagate winners into next round slots
    for (const round of ROUND_ORDER) {
      if (round === "third_place") continue;
      const matchCount = knockoutRoundMatchCounts[round] ?? 0;
      for (let m = 1; m <= matchCount; m++) {
        const winner = picksMap.get(`${round}_${m}`);
        if (!winner) continue;

        const next = getNextRoundSlot(round, m);
        if (!next) continue;

        const nextKey = `${next.round}_${next.matchNumber}`;
        const current = derived.get(nextKey) ?? { home: null, away: null };
        derived.set(nextKey, {
          ...current,
          [next.slot]: winner,
        });
      }
    }

    // Derive third-place match teams from semifinal losers
    const thirdPlaceTeams: { home: string | null; away: string | null } =
      derived.get("third_place_1") ?? { home: null, away: null };

    for (let sfMatch = 1; sfMatch <= 2; sfMatch++) {
      const sfKey = `semi_${sfMatch}`;
      const sfWinner = picksMap.get(sfKey);
      const sfTeams = derived.get(sfKey);
      if (sfWinner && sfTeams) {
        const loser = sfTeams.home === sfWinner ? sfTeams.away : sfTeams.home;
        if (loser) {
          if (sfMatch === 1) thirdPlaceTeams.home = loser;
          else thirdPlaceTeams.away = loser;
        }
      }
    }
    derived.set("third_place_1", thirdPlaceTeams);

    return derived;
  }, [knockoutMatches, picksMap]);

  // When user picks a winner, cascade: clear any downstream picks that referenced the old winner
  const handlePick = useCallback(
    (round: string, matchNumber: number, winner: string) => {
      const key = `${round}_${matchNumber}`;
      const currentWinner = picksMap.get(key);

      // If clicking the same winner, deselect
      if (currentWinner === winner) {
        const newPicks = picks.filter(
          (p) => !(p.round === round && p.matchNumber === matchNumber)
        );
        // Also clear downstream picks that depend on this winner
        const cleared = clearDownstreamPicks(newPicks, round, matchNumber, winner);
        onPicksChange(cleared);
        return;
      }

      // Set this pick
      let newPicks = picks.filter(
        (p) => !(p.round === round && p.matchNumber === matchNumber)
      );
      newPicks.push({
        round: round as KnockoutPick["round"],
        matchNumber,
        winner,
      });

      // If there was a previous winner, clear downstream picks that referenced it
      if (currentWinner) {
        newPicks = clearDownstreamPicks(newPicks, round, matchNumber, currentWinner);
      }

      onPicksChange(newPicks);
    },
    [picks, picksMap, onPicksChange]
  );

  // Count picks per round
  const pickCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const round of ROUND_ORDER) {
      counts[round] = picks.filter((p) => p.round === round).length;
    }
    return counts;
  }, [picks]);

  const totalPicks = picks.length;
  const totalMatches = ROUND_ORDER.reduce(
    (sum, r) => sum + (knockoutRoundMatchCounts[r] ?? 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Progress summary */}
      <div className="rounded-lg border border-gold/20 bg-gold/5 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">
            <span className="text-gold font-bold">{totalPicks}</span> of{" "}
            {totalMatches} matches picked
          </span>
          <span className="text-xs text-gray-600">
            {totalPicks === totalMatches
              ? "All picks made!"
              : `${totalMatches - totalPicks} remaining`}
          </span>
        </div>
        <div className="w-full bg-navy-lighter rounded-full h-2 overflow-hidden">
          <div
            className="bg-gold h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${totalMatches > 0 ? Math.round((totalPicks / totalMatches) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Round-by-round list */}
      {ROUND_ORDER.map((round) => {
        const matchCount = knockoutRoundMatchCounts[round] ?? 0;
        const roundPicks = pickCounts[round] ?? 0;
        const isComplete = roundPicks === matchCount;
        const points = ROUND_POINTS[round] ?? 0;

        return (
          <div key={round}>
            {/* Round header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                {ROUND_LABELS[round] ?? round}
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {points} pts each
                </span>
                <span
                  className={`text-xs font-medium ${
                    isComplete ? "text-gold" : "text-gray-600"
                  }`}
                >
                  {roundPicks}/{matchCount}
                </span>
              </div>
            </div>

            {/* Match cards */}
            <div className="space-y-3">
              {Array.from({ length: matchCount }, (_, i) => i + 1).map(
                (matchNumber) => {
                  const matchKey = `${round}_${matchNumber}`;
                  const derived = derivedTeams.get(matchKey);
                  const homeTeam = derived?.home ?? null;
                  const awayTeam = derived?.away ?? null;
                  const selectedWinner = picksMap.get(matchKey) ?? null;

                  return (
                    <div
                      key={matchKey}
                      className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                        selectedWinner
                          ? "border-gold/30 bg-navy-light/80"
                          : "border-white/10 bg-navy-light/60"
                      }`}
                    >
                      <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">
                          Match {matchNumber}
                        </span>
                        {selectedWinner && (
                          <span className="text-[10px] text-gold font-medium">
                            Picked
                          </span>
                        )}
                      </div>
                      <div className="p-3 flex gap-2">
                        <TeamButton
                          teamCode={homeTeam}
                          isSelected={selectedWinner === homeTeam && !!homeTeam}
                          onClick={() => homeTeam && handlePick(round, matchNumber, homeTeam)}
                          disabled={!homeTeam}
                        />
                        <div className="flex items-center px-1">
                          <span className="text-xs text-gray-700 font-bold">
                            vs
                          </span>
                        </div>
                        <TeamButton
                          teamCode={awayTeam}
                          isSelected={selectedWinner === awayTeam && !!awayTeam}
                          onClick={() => awayTeam && handlePick(round, matchNumber, awayTeam)}
                          disabled={!awayTeam}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Clear all downstream picks that reference a specific team
function clearDownstreamPicks(
  picks: KnockoutPick[],
  fromRound: string,
  fromMatchNumber: number,
  teamCode: string
): KnockoutPick[] {
  const next = getNextRoundSlot(fromRound, fromMatchNumber);
  if (!next) return picks;

  // Check if the team was picked to win the next match
  const nextKey = `${next.round}_${next.matchNumber}`;
  const nextPick = picks.find(
    (p) => p.round === next.round && p.matchNumber === next.matchNumber
  );

  if (nextPick && nextPick.winner === teamCode) {
    // Remove this pick and recurse deeper
    picks = picks.filter(
      (p) => !(p.round === next.round && p.matchNumber === next.matchNumber)
    );
    picks = clearDownstreamPicks(
      picks,
      next.round,
      next.matchNumber,
      teamCode
    );
  }

  return picks;
}
