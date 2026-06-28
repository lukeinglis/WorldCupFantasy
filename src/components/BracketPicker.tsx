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
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter: "Quarterfinals",
  semi: "Semifinals",
  third_place: "Third Place",
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

const MATCH_H = 40;
const SLOT_HEIGHTS: Record<string, number> = {
  round_of_32: MATCH_H + 4,
  round_of_16: (MATCH_H + 4) * 2,
  quarter: (MATCH_H + 4) * 4,
  semi: (MATCH_H + 4) * 8,
};

function MatchCard({
  homeCode,
  awayCode,
  selectedWinner,
  onPick,
  disabled,
}: {
  homeCode: string | null;
  awayCode: string | null;
  selectedWinner: string | null;
  onPick: (winner: string) => void;
  disabled: boolean;
}) {
  const homeTeam = homeCode ? getTeamByCode(homeCode) : null;
  const awayTeam = awayCode ? getTeamByCode(awayCode) : null;
  const homeSelected = !!homeCode && selectedWinner === homeCode;
  const awaySelected = !!awayCode && selectedWinner === awayCode;

  return (
    <div className="rounded border border-white/10 bg-navy-lighter/50 overflow-hidden w-[112px]">
      <button
        type="button"
        onClick={() => homeCode && onPick(homeCode)}
        disabled={!homeCode || disabled}
        className={`w-full flex items-center justify-between gap-1 px-1.5 h-[19px] text-left transition-colors text-xs ${
          homeSelected
            ? "bg-gold/20 text-gold"
            : !homeCode
            ? "text-gray-700 cursor-default"
            : "text-gray-300 hover:bg-white/5"
        } ${disabled && homeCode ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className="flex items-center gap-1 truncate">
          {homeTeam?.flag && <span className="text-sm leading-none">{homeTeam.flag}</span>}
          <span className="font-medium truncate">{homeCode ?? "TBD"}</span>
        </span>
        {homeSelected && <span className="text-gold shrink-0">&#10003;</span>}
      </button>
      <div className="border-t border-white/5" />
      <button
        type="button"
        onClick={() => awayCode && onPick(awayCode)}
        disabled={!awayCode || disabled}
        className={`w-full flex items-center justify-between gap-1 px-1.5 h-[19px] text-left transition-colors text-xs ${
          awaySelected
            ? "bg-gold/20 text-gold"
            : !awayCode
            ? "text-gray-700 cursor-default"
            : "text-gray-300 hover:bg-white/5"
        } ${disabled && awayCode ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className="flex items-center gap-1 truncate">
          {awayTeam?.flag && <span className="text-sm leading-none">{awayTeam.flag}</span>}
          <span className="font-medium truncate">{awayCode ?? "TBD"}</span>
        </span>
        {awaySelected && <span className="text-gold shrink-0">&#10003;</span>}
      </button>
    </div>
  );
}

function RoundColumn({
  round,
  matchNumbers,
  derivedTeams,
  picksMap,
  onPick,
  disabled,
  label,
  points,
}: {
  round: string;
  matchNumbers: number[];
  derivedTeams: Map<string, { home: string | null; away: string | null }>;
  picksMap: Map<string, string>;
  onPick: (round: string, matchNumber: number, winner: string) => void;
  disabled: boolean;
  label: string;
  points: number;
}) {
  const slotH = SLOT_HEIGHTS[round] ?? MATCH_H;

  return (
    <div className="flex flex-col shrink-0">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1 text-center whitespace-nowrap px-1">
        {label}
        <span className="text-gray-600 ml-1">({points}pts)</span>
      </div>
      <div className="flex flex-col">
        {matchNumbers.map((matchNumber) => {
          const matchKey = `${round}_${matchNumber}`;
          const derived = derivedTeams.get(matchKey);
          return (
            <div
              key={matchKey}
              className="flex items-center justify-center"
              style={{ height: `${slotH}px` }}
            >
              <MatchCard
                homeCode={derived?.home ?? null}
                awayCode={derived?.away ?? null}
                selectedWinner={picksMap.get(matchKey) ?? null}
                onPick={(winner) => onPick(round, matchNumber, winner)}
                disabled={disabled}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConnectorColumn({
  pairCount,
  side,
  slotH,
}: {
  pairCount: number;
  side: "left" | "right";
  slotH: number;
}) {
  // Each pair spans 2 slots of the previous round.
  // We draw a bracket connector: top half border-top + right, bottom half border-bottom + right
  const pairH = slotH * 2;
  const borderSide = side === "left" ? "border-r" : "border-l";

  return (
    <div className="flex flex-col shrink-0 w-4" style={{ marginTop: "18px" }}>
      {Array.from({ length: pairCount }, (_, i) => (
        <div key={i} className="flex flex-col" style={{ height: `${pairH}px` }}>
          <div className={`${borderSide} border-t border-white/15 flex-1`} />
          <div className={`${borderSide} border-b border-white/15 flex-1`} />
        </div>
      ))}
    </div>
  );
}

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
        derived.set(nextKey, {
          ...current,
          [next.slot]: winner,
        });
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

  const totalPicks = picks.length;
  const totalMatches = ROUND_ORDER.reduce(
    (sum, r) => sum + (knockoutRoundMatchCounts[r] ?? 0),
    0
  );

  const leftR32 = [1, 2, 3, 4, 5, 6, 7, 8];
  const leftR16 = [1, 2, 3, 4];
  const leftQF = [1, 2];
  const leftSF = [1];

  const rightR32 = [9, 10, 11, 12, 13, 14, 15, 16];
  const rightR16 = [5, 6, 7, 8];
  const rightQF = [3, 4];
  const rightSF = [2];

  const r32SlotH = SLOT_HEIGHTS.round_of_32;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
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

      {/* Mobile scroll hint */}
      <p className="text-xs text-gray-600 lg:hidden text-center">
        Scroll horizontally to see the full bracket &rarr;
      </p>

      {/* Bracket */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4">
        <div className="flex items-start min-w-[1200px]">
          {/* === LEFT BRACKET === */}
          <RoundColumn
            round="round_of_32"
            matchNumbers={leftR32}
            derivedTeams={derivedTeams}
            picksMap={picksMap}
            onPick={handlePick}
            disabled={disabled}
            label={ROUND_LABELS.round_of_32}
            points={ROUND_POINTS.round_of_32}
          />
          <ConnectorColumn pairCount={4} side="left" slotH={r32SlotH} />
          <RoundColumn
            round="round_of_16"
            matchNumbers={leftR16}
            derivedTeams={derivedTeams}
            picksMap={picksMap}
            onPick={handlePick}
            disabled={disabled}
            label={ROUND_LABELS.round_of_16}
            points={ROUND_POINTS.round_of_16}
          />
          <ConnectorColumn pairCount={2} side="left" slotH={SLOT_HEIGHTS.round_of_16} />
          <RoundColumn
            round="quarter"
            matchNumbers={leftQF}
            derivedTeams={derivedTeams}
            picksMap={picksMap}
            onPick={handlePick}
            disabled={disabled}
            label={ROUND_LABELS.quarter}
            points={ROUND_POINTS.quarter}
          />
          <ConnectorColumn pairCount={1} side="left" slotH={SLOT_HEIGHTS.quarter} />
          <RoundColumn
            round="semi"
            matchNumbers={leftSF}
            derivedTeams={derivedTeams}
            picksMap={picksMap}
            onPick={handlePick}
            disabled={disabled}
            label={ROUND_LABELS.semi}
            points={ROUND_POINTS.semi}
          />

          {/* === CENTER: Final + Third Place === */}
          <div className="flex flex-col items-center justify-center shrink-0 mx-2" style={{ marginTop: "18px", height: `${r32SlotH * 8}px` }}>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-center mb-2">
                <div className="text-xs text-gold uppercase tracking-wider font-bold font-heading">
                  🏆 {ROUND_LABELS.final}
                </div>
                <div className="text-[10px] text-gray-500">{ROUND_POINTS.final} pts</div>
              </div>
              <div className="border border-gold/30 rounded-lg p-1 bg-gold/5">
                <MatchCard
                  homeCode={derivedTeams.get("final_1")?.home ?? null}
                  awayCode={derivedTeams.get("final_1")?.away ?? null}
                  selectedWinner={picksMap.get("final_1") ?? null}
                  onPick={(winner) => handlePick("final", 1, winner)}
                  disabled={disabled}
                />
              </div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col items-center">
              <div className="text-center mb-1">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                  {ROUND_LABELS.third_place}
                </div>
                <div className="text-[10px] text-gray-600">{ROUND_POINTS.third_place} pts</div>
              </div>
              <MatchCard
                homeCode={derivedTeams.get("third_place_1")?.home ?? null}
                awayCode={derivedTeams.get("third_place_1")?.away ?? null}
                selectedWinner={picksMap.get("third_place_1") ?? null}
                onPick={(winner) => handlePick("third_place", 1, winner)}
                disabled={disabled}
              />
            </div>
          </div>

          {/* === RIGHT BRACKET (mirrored) === */}
          <RoundColumn
            round="semi"
            matchNumbers={rightSF}
            derivedTeams={derivedTeams}
            picksMap={picksMap}
            onPick={handlePick}
            disabled={disabled}
            label={ROUND_LABELS.semi}
            points={ROUND_POINTS.semi}
          />
          <ConnectorColumn pairCount={1} side="right" slotH={SLOT_HEIGHTS.quarter} />
          <RoundColumn
            round="quarter"
            matchNumbers={rightQF}
            derivedTeams={derivedTeams}
            picksMap={picksMap}
            onPick={handlePick}
            disabled={disabled}
            label={ROUND_LABELS.quarter}
            points={ROUND_POINTS.quarter}
          />
          <ConnectorColumn pairCount={2} side="right" slotH={SLOT_HEIGHTS.round_of_16} />
          <RoundColumn
            round="round_of_16"
            matchNumbers={rightR16}
            derivedTeams={derivedTeams}
            picksMap={picksMap}
            onPick={handlePick}
            disabled={disabled}
            label={ROUND_LABELS.round_of_16}
            points={ROUND_POINTS.round_of_16}
          />
          <ConnectorColumn pairCount={4} side="right" slotH={r32SlotH} />
          <RoundColumn
            round="round_of_32"
            matchNumbers={rightR32}
            derivedTeams={derivedTeams}
            picksMap={picksMap}
            onPick={handlePick}
            disabled={disabled}
            label={ROUND_LABELS.round_of_32}
            points={ROUND_POINTS.round_of_32}
          />
        </div>
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
    picks = clearDownstreamPicks(
      picks,
      next.round,
      next.matchNumber,
      teamCode
    );
  }

  return picks;
}
