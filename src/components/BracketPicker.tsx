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
  disabled?: boolean;
}

const ROUND_LABELS: Record<string, string> = {
  round_of_32: "R32",
  round_of_16: "R16",
  quarter: "QF",
  semi: "SF",
  third_place: "3rd",
  final: "Final",
};

const ROUND_ORDER = ["round_of_32", "round_of_16", "quarter", "semi", "third_place", "final"];
const BRACKET_ROUNDS = ["round_of_32", "round_of_16", "quarter", "semi"];

const ROUND_POINTS: Record<string, number> = {
  round_of_32: 2,
  round_of_16: 4,
  quarter: 6,
  semi: 8,
  third_place: 8,
  final: 10,
};

function getNextRoundSlot(
  round: string,
  matchNumber: number
): { round: string; matchNumber: number; slot: "home" | "away" } | null {
  const roundIdx = ROUND_ORDER.indexOf(round);
  if (roundIdx === -1 || roundIdx >= ROUND_ORDER.length - 1) return null;
  const nextRound = ROUND_ORDER[roundIdx + 1];
  const currentMatchCount = knockoutRoundMatchCounts[round] ?? 0;
  const halfCount = Math.floor(currentMatchCount / 2);

  if (matchNumber <= halfCount) {
    return { round: nextRound, matchNumber, slot: "home" };
  } else {
    return { round: nextRound, matchNumber: matchNumber - halfCount, slot: "away" };
  }
}

// ── Compact team row for bracket view ──

function TeamRow({
  teamCode,
  isSelected,
  onClick,
  disabled,
  position,
}: {
  teamCode: string | null;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
  position: "top" | "bottom";
}) {
  const team = teamCode ? getTeamByCode(teamCode) : null;
  const code = team?.code ?? teamCode ?? "TBD";
  const flag = team?.flag ?? "";
  const isTbd = !teamCode;
  const borderRadius = position === "top" ? "rounded-t-md" : "rounded-b-md";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isTbd}
      className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-left transition-all duration-150 ${borderRadius} ${
        isSelected
          ? "bg-gold/20 text-gold"
          : isTbd
          ? "bg-white/[0.02] text-gray-700"
          : "bg-navy-lighter/60 text-gray-300 hover:bg-white/5"
      } ${disabled && !isTbd ? "opacity-50 cursor-not-allowed" : ""} ${!disabled && !isTbd ? "cursor-pointer" : ""}`}
    >
      {flag && <span className="text-xs leading-none shrink-0">{flag}</span>}
      <span className="text-xs font-semibold truncate flex-1">{code}</span>
      {isSelected && <span className="text-[10px] text-gold font-bold shrink-0">✓</span>}
    </button>
  );
}

// ── Match card for bracket view ──

function BracketMatchCard({
  homeTeam,
  awayTeam,
  selectedWinner,
  onPick,
  disabled,
}: {
  homeTeam: string | null;
  awayTeam: string | null;
  selectedWinner: string | null;
  onPick: (winner: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="w-[120px] border border-white/10 rounded-md overflow-hidden bg-navy/80 shrink-0">
      <TeamRow
        teamCode={homeTeam}
        isSelected={selectedWinner === homeTeam && !!homeTeam}
        onClick={() => homeTeam && onPick(homeTeam)}
        disabled={disabled || !homeTeam}
        position="top"
      />
      <div className="border-t border-white/10" />
      <TeamRow
        teamCode={awayTeam}
        isSelected={selectedWinner === awayTeam && !!awayTeam}
        onClick={() => awayTeam && onPick(awayTeam)}
        disabled={disabled || !awayTeam}
        position="bottom"
      />
    </div>
  );
}

// ── Bracket column: renders all matches in a round with proper spacing ──

function BracketColumn({
  round,
  matchNumbers,
  derivedTeams,
  picksMap,
  onPick,
  disabled,
}: {
  round: string;
  matchNumbers: number[];
  derivedTeams: Map<string, { home: string | null; away: string | null }>;
  picksMap: Map<string, string>;
  onPick: (round: string, matchNumber: number, winner: string) => void;
  disabled: boolean;
}) {
  const roundIdx = BRACKET_ROUNDS.indexOf(round);
  const gap = roundIdx === 0 ? 8 : roundIdx === 1 ? 24 : roundIdx === 2 ? 56 : 120;

  return (
    <div
      className="flex flex-col items-center justify-center shrink-0"
      style={{ gap: `${gap}px` }}
    >
      <div className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider mb-1">
        {ROUND_LABELS[round]} <span className="text-gray-700">({ROUND_POINTS[round]}pt)</span>
      </div>
      {matchNumbers.map((matchNumber) => {
        const key = `${round}_${matchNumber}`;
        const teams = derivedTeams.get(key);
        const winner = picksMap.get(key) ?? null;
        return (
          <BracketMatchCard
            key={key}
            homeTeam={teams?.home ?? null}
            awayTeam={teams?.away ?? null}
            selectedWinner={winner}
            onPick={(w) => onPick(round, matchNumber, w)}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}

// ── Connector lines between rounds ──

function ConnectorColumn({ matchCount }: { matchCount: number }) {
  const pairs = matchCount / 2;
  return (
    <div className="flex flex-col items-center justify-center shrink-0" style={{ gap: "0px" }}>
      {Array.from({ length: pairs }, (_, i) => (
        <div key={i} className="flex items-center" style={{ height: `${matchCount === 16 ? 80 : matchCount === 8 ? 112 : matchCount === 4 ? 176 : 304}px` }}>
          <div className="w-3 flex flex-col h-full">
            <div className="flex-1 border-t border-r border-white/15 rounded-tr-sm" />
            <div className="flex-1 border-b border-r border-white/15 rounded-br-sm" />
          </div>
          <div className="w-3 border-t border-white/15" />
        </div>
      ))}
    </div>
  );
}

// ── Full team button for list view (mobile) ──

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
      <span className={`text-sm font-medium truncate ${isSelected ? "text-gold" : isTbd ? "text-gray-700" : "text-gray-300"}`}>
        {displayName}
      </span>
      {isSelected && <span className="ml-auto text-gold text-xs font-bold shrink-0">W</span>}
    </button>
  );
}

// ── Main component ──

export default function BracketPicker({
  knockoutMatches,
  picks,
  onPicksChange,
  disabled = false,
}: BracketPickerProps) {
  const picksMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const pick of picks) {
      map.set(`${pick.round}_${pick.matchNumber}`, pick.winner);
    }
    return map;
  }, [picks]);

  const derivedTeams = useMemo(() => {
    const derived = new Map<string, { home: string | null; away: string | null }>();

    for (const round of ROUND_ORDER) {
      const matchCount = knockoutRoundMatchCounts[round] ?? 0;
      for (let m = 1; m <= matchCount; m++) {
        const key = `${round}_${m}`;
        if (!derived.has(key)) {
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
        derived.set(nextKey, { ...current, [next.slot]: winner });
      }
    }

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

  const handlePick = useCallback(
    (round: string, matchNumber: number, winner: string) => {
      const key = `${round}_${matchNumber}`;
      const currentWinner = picksMap.get(key);

      if (currentWinner === winner) {
        const newPicks = picks.filter(
          (p) => !(p.round === round && p.matchNumber === matchNumber)
        );
        const cleared = clearDownstreamPicks(newPicks, round, matchNumber, winner);
        onPicksChange(cleared);
        return;
      }

      let newPicks = picks.filter(
        (p) => !(p.round === round && p.matchNumber === matchNumber)
      );
      newPicks.push({
        round: round as KnockoutPick["round"],
        matchNumber,
        winner,
      });

      if (currentWinner) {
        newPicks = clearDownstreamPicks(newPicks, round, matchNumber, currentWinner);
      }

      onPicksChange(newPicks);
    },
    [picks, picksMap, onPicksChange]
  );

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

  // Split matches into top half and bottom half for bracket view
  const topR32 = [1, 2, 3, 4, 5, 6, 7, 8];
  const bottomR32 = [9, 10, 11, 12, 13, 14, 15, 16];
  const topR16 = [1, 2, 3, 4];
  const bottomR16 = [5, 6, 7, 8];
  const topQF = [1, 2];
  const bottomQF = [3, 4];

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="rounded-lg border border-gold/20 bg-gold/5 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">
            <span className="text-gold font-bold">{totalPicks}</span> of{" "}
            {totalMatches} matches picked
          </span>
          <span className="text-xs text-gray-600">
            {totalPicks === totalMatches ? "All picks made!" : `${totalMatches - totalPicks} remaining`}
          </span>
        </div>
        <div className="w-full bg-navy-lighter rounded-full h-2 overflow-hidden">
          <div
            className="bg-gold h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${totalMatches > 0 ? Math.round((totalPicks / totalMatches) * 100) : 0}%` }}
          />
        </div>
      </div>

      {/* ── BRACKET VIEW (desktop) ── */}
      <div className="hidden lg:block overflow-x-auto">
        {/* Top half: R32(1-8) → R16(1-4) → QF(1-2) → SF1 */}
        <div className="flex items-center justify-center gap-1 mb-4">
          <BracketColumn round="round_of_32" matchNumbers={topR32} derivedTeams={derivedTeams} picksMap={picksMap} onPick={handlePick} disabled={disabled} />
          <ConnectorColumn matchCount={8} />
          <BracketColumn round="round_of_16" matchNumbers={topR16} derivedTeams={derivedTeams} picksMap={picksMap} onPick={handlePick} disabled={disabled} />
          <ConnectorColumn matchCount={4} />
          <BracketColumn round="quarter" matchNumbers={topQF} derivedTeams={derivedTeams} picksMap={picksMap} onPick={handlePick} disabled={disabled} />
          <ConnectorColumn matchCount={2} />
          <BracketColumn round="semi" matchNumbers={[1]} derivedTeams={derivedTeams} picksMap={picksMap} onPick={handlePick} disabled={disabled} />

          {/* Center: Final */}
          <div className="flex flex-col items-center justify-center mx-4 shrink-0">
            <div className="text-[10px] text-gold font-bold uppercase tracking-wider mb-2">
              Final <span className="text-gold/60">({ROUND_POINTS.final}pt)</span>
            </div>
            <BracketMatchCard
              homeTeam={derivedTeams.get("final_1")?.home ?? null}
              awayTeam={derivedTeams.get("final_1")?.away ?? null}
              selectedWinner={picksMap.get("final_1") ?? null}
              onPick={(w) => handlePick("final", 1, w)}
              disabled={disabled}
            />
            <div className="mt-4 text-[10px] text-gray-600 font-semibold uppercase tracking-wider mb-2">
              3rd Place <span className="text-gray-700">({ROUND_POINTS.third_place}pt)</span>
            </div>
            <BracketMatchCard
              homeTeam={derivedTeams.get("third_place_1")?.home ?? null}
              awayTeam={derivedTeams.get("third_place_1")?.away ?? null}
              selectedWinner={picksMap.get("third_place_1") ?? null}
              onPick={(w) => handlePick("third_place", 1, w)}
              disabled={disabled}
            />
          </div>

          <BracketColumn round="semi" matchNumbers={[2]} derivedTeams={derivedTeams} picksMap={picksMap} onPick={handlePick} disabled={disabled} />
          <ConnectorColumn matchCount={2} />
          <BracketColumn round="quarter" matchNumbers={bottomQF} derivedTeams={derivedTeams} picksMap={picksMap} onPick={handlePick} disabled={disabled} />
          <ConnectorColumn matchCount={4} />
          <BracketColumn round="round_of_16" matchNumbers={bottomR16} derivedTeams={derivedTeams} picksMap={picksMap} onPick={handlePick} disabled={disabled} />
          <ConnectorColumn matchCount={8} />
          <BracketColumn round="round_of_32" matchNumbers={bottomR32} derivedTeams={derivedTeams} picksMap={picksMap} onPick={handlePick} disabled={disabled} />
        </div>
      </div>

      {/* ── LIST VIEW (mobile) ── */}
      <div className="lg:hidden space-y-8">
        {ROUND_ORDER.map((round) => {
          const matchCount = knockoutRoundMatchCounts[round] ?? 0;
          const roundPicks = pickCounts[round] ?? 0;
          const isComplete = roundPicks === matchCount;
          const points = ROUND_POINTS[round] ?? 0;

          return (
            <div key={round}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  {ROUND_LABELS[round] === "R32" ? "Round of 32" :
                   ROUND_LABELS[round] === "R16" ? "Round of 16" :
                   ROUND_LABELS[round] === "QF" ? "Quarterfinals" :
                   ROUND_LABELS[round] === "SF" ? "Semifinals" :
                   ROUND_LABELS[round] === "3rd" ? "Third Place" :
                   ROUND_LABELS[round]}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{points} pts each</span>
                  <span className={`text-xs font-medium ${isComplete ? "text-gold" : "text-gray-600"}`}>
                    {roundPicks}/{matchCount}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {Array.from({ length: matchCount }, (_, i) => i + 1).map((matchNumber) => {
                  const matchKey = `${round}_${matchNumber}`;
                  const derived = derivedTeams.get(matchKey);
                  const homeTeam = derived?.home ?? null;
                  const awayTeam = derived?.away ?? null;
                  const selectedWinner = picksMap.get(matchKey) ?? null;

                  return (
                    <div
                      key={matchKey}
                      className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                        disabled ? "border-white/5 bg-navy-light/40 opacity-60"
                          : selectedWinner ? "border-gold/30 bg-navy-light/80"
                          : "border-white/10 bg-navy-light/60"
                      }`}
                    >
                      <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">
                          Match {matchNumber}
                        </span>
                        {selectedWinner && <span className="text-[10px] text-gold font-medium">Picked</span>}
                      </div>
                      <div className="p-3 flex gap-2">
                        <TeamButton
                          teamCode={homeTeam}
                          isSelected={selectedWinner === homeTeam && !!homeTeam}
                          onClick={() => homeTeam && handlePick(round, matchNumber, homeTeam)}
                          disabled={!homeTeam || disabled}
                        />
                        <div className="flex items-center px-1">
                          <span className="text-xs text-gray-700 font-bold">vs</span>
                        </div>
                        <TeamButton
                          teamCode={awayTeam}
                          isSelected={selectedWinner === awayTeam && !!awayTeam}
                          onClick={() => awayTeam && handlePick(round, matchNumber, awayTeam)}
                          disabled={!awayTeam || disabled}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function clearDownstreamPicks(
  picks: KnockoutPick[],
  fromRound: string,
  fromMatchNumber: number,
  teamCode: string
): KnockoutPick[] {
  const next = getNextRoundSlot(fromRound, fromMatchNumber);
  if (!next) return picks;

  const nextPick = picks.find(
    (p) => p.round === next.round && p.matchNumber === next.matchNumber
  );

  if (nextPick && nextPick.winner === teamCode) {
    picks = picks.filter(
      (p) => !(p.round === next.round && p.matchNumber === next.matchNumber)
    );
    picks = clearDownstreamPicks(picks, next.round, next.matchNumber, teamCode);
  }

  return picks;
}
