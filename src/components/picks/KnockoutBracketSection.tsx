"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { usePicksData } from "@/hooks/usePicksData";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { getTeamByCode } from "@/data/teams";
import { knockoutRoundPoints, knockoutRoundMatchCounts } from "@/data/participants";
import { R32_MATCHES } from "@/data/knockout-bracket";
import BracketDisplay from "@/components/BracketDisplay";

const ROUND_LABELS: Record<string, string> = {
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter: "Quarterfinals",
  semi: "Semifinals",
  third_place: "Third Place",
  final: "Final",
};

const ROUND_SHORT: Record<string, string> = {
  round_of_32: "R32",
  round_of_16: "R16",
  quarter: "QF",
  semi: "SF",
  third_place: "3rd",
  final: "F",
};

const ROUND_ORDER = ["round_of_32", "round_of_16", "quarter", "semi", "third_place", "final"];

interface KnockoutPick {
  round: string;
  matchNumber: number;
  winner: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParticipantData = any;
const getPicks = (p: ParticipantData) => p.picks as ParticipantData;
const getKO = (p: ParticipantData): KnockoutPick[] => (getPicks(p)?.knockoutPicks ?? []) as KnockoutPick[];

function getMatchLabel(round: string, matchNumber: number): string {
  if (round === "round_of_32") {
    const r32 = R32_MATCHES.find((m) => m.matchNumber === matchNumber);
    if (r32) {
      const h = getTeamByCode(r32.homeTeam ?? "");
      const a = getTeamByCode(r32.awayTeam ?? "");
      return `${h?.flag ?? ""} ${r32.homeTeam} vs ${a?.flag ?? ""} ${r32.awayTeam}`;
    }
  }
  return `Match ${matchNumber}`;
}

type ViewMode = "matches" | "participant" | "table";

export default function KnockoutBracketSection() {
  const { user } = useAuth();
  const { participantsList, loading } = usePicksData();
  const [viewMode, setViewMode] = useState<ViewMode>("matches");
  const [selectedParticipant, setSelectedParticipant] = useState<string>("");
  const [results, setResults] = useState<Record<string, string>>({});
  const [matchTeams, setMatchTeams] = useState<{ round: string; matchNumber: number; home: string | null; away: string | null }[]>([]);

  useEffect(() => {
    fetch("/api/knockout-matches")
      .then((r) => r.json())
      .then((d) => {
        setResults(d.results ?? {});
        setMatchTeams((d.matches ?? []).map((m: { round: string; matchNumber: number; homeTeam: { tla: string } | null; awayTeam: { tla: string } | null }) => ({
          round: m.round,
          matchNumber: m.matchNumber,
          home: m.homeTeam?.tla ?? null,
          away: m.awayTeam?.tla ?? null,
        })));
      })
      .catch(() => {});
  }, []);

  const eliminatedTeams = useMemo(() => {
    const eliminated = new Set<string>();
    for (const [key, winner] of Object.entries(results)) {
      const match = matchTeams.find((m) => `${m.round}_${m.matchNumber}` === key);
      if (match) {
        if (match.home && match.home !== winner) eliminated.add(match.home);
        if (match.away && match.away !== winner) eliminated.add(match.away);
      } else if (key.startsWith("round_of_32_")) {
        const num = parseInt(key.replace("round_of_32_", ""), 10);
        const r32 = R32_MATCHES.find((m) => m.matchNumber === num);
        if (r32) {
          if (r32.homeTeam && r32.homeTeam !== winner) eliminated.add(r32.homeTeam);
          if (r32.awayTeam && r32.awayTeam !== winner) eliminated.add(r32.awayTeam);
        }
      }
    }
    return eliminated;
  }, [results, matchTeams]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">Loading knockout picks...</p>
      </div>
    );
  }

  const currentUser = user ? participantsList.find((p) => p.id === user.id) : null;
  const currentUserHasTier2 = currentUser ? !!getPicks(currentUser)?.tier2Submitted : false;

  if (!user || !currentUserHasTier2) {
    return (
      <Card className="border-gold/20 bg-gold/5">
        <CardBody className="py-12 text-center">
          <span className="text-5xl block mb-4" aria-hidden>🔒</span>
          <h3 className="font-heading text-xl font-bold text-white mb-2">
            Submit Your Picks First
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            You need to submit your knockout bracket picks before you can see what others have picked.
            Head to My Picks to fill out your bracket.
          </p>
        </CardBody>
      </Card>
    );
  }

  const withTier2 = participantsList.filter((p) => {
    const picks = getPicks(p);
    return picks?.tier2Submitted && Array.isArray(picks?.knockoutPicks);
  });

  if (withTier2.length === 0) {
    return (
      <Card className="border-gold/20 bg-gold/5">
        <CardBody className="py-12 text-center">
          <span className="text-4xl block mb-3" aria-hidden>📋</span>
          <p className="text-gray-400 text-sm">No one has submitted knockout picks yet.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gold/20 bg-gold/5 px-4 py-3 text-center">
        <p className="text-sm text-gold font-medium">
          {withTier2.length} participant{withTier2.length !== 1 ? "s have" : " has"} submitted knockout picks
        </p>
      </div>

      {/* View mode tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { id: "matches" as ViewMode, label: "By Match", icon: "⚽" },
          { id: "participant" as ViewMode, label: "By Participant", icon: "👤" },
          { id: "table" as ViewMode, label: "Table", icon: "📊" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id)}
            className={`font-heading rounded-lg px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-all ${
              viewMode === tab.id
                ? "bg-gold/20 text-gold border border-gold/30"
                : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent"
            }`}
          >
            <span className="mr-1.5" aria-hidden>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {viewMode === "matches" && (
        <MatchFocusView withTier2={withTier2} results={results} eliminatedTeams={eliminatedTeams} />
      )}
      {viewMode === "participant" && (
        <ParticipantBrowser
          withTier2={withTier2}
          selectedId={selectedParticipant}
          onSelect={setSelectedParticipant}
          results={results}
          eliminatedTeams={eliminatedTeams}
        />
      )}
      {viewMode === "table" && (
        <TableView withTier2={withTier2} results={results} eliminatedTeams={eliminatedTeams} />
      )}
    </div>
  );
}

// ── View 1: Match Focus Cards ──

function MatchFocusView({ withTier2, results, eliminatedTeams }: { withTier2: ParticipantData[]; results: Record<string, string>; eliminatedTeams: Set<string> }) {
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {ROUND_ORDER.map((round) => {
        const matchCount = knockoutRoundMatchCounts[round] ?? 0;
        const pts = knockoutRoundPoints[round] ?? 0;

        return (
          <div key={round}>
            <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-white mb-3">
              {ROUND_LABELS[round]}{" "}
              <span className="text-sm font-normal text-gray-500">({pts} pts each)</span>
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: matchCount }, (_, i) => i + 1).map((matchNumber) => {
                const key = `${round}_${matchNumber}`;
                const isExpanded = expandedMatch === key;
                const picksByTeam: Record<string, string[]> = {};

                for (const p of withTier2) {
                  const ko = getKO(p);
                  const pick = ko.find((k) => k.round === round && k.matchNumber === matchNumber);
                  if (pick) {
                    if (!picksByTeam[pick.winner]) picksByTeam[pick.winner] = [];
                    picksByTeam[pick.winner].push(p.name);
                  }
                }

                const sorted = Object.entries(picksByTeam).sort((a, b) => b[1].length - a[1].length);
                const label = getMatchLabel(round, matchNumber);

                return (
                  <Card key={key}>
                    <button
                      type="button"
                      onClick={() => setExpandedMatch(isExpanded ? null : key)}
                      className="w-full text-left"
                    >
                      <CardHeader className="py-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-300 font-medium">{label}</span>
                          <span className="text-[10px] text-gray-600">{isExpanded ? "▲" : "▼"}</span>
                        </div>
                      </CardHeader>
                    </button>
                    <CardBody className="py-2 space-y-2">
                      {sorted.map(([teamCode, names]) => {
                        const team = getTeamByCode(teamCode);
                        const pct = Math.round((names.length / withTier2.length) * 100);
                        const actual = results[key];
                        const isCorrect = actual && teamCode === actual;
                        const isWrong = actual && teamCode !== actual;
                        const isEliminated = !actual && eliminatedTeams.has(teamCode);
                        const nameColor = isCorrect ? "text-green-400" : (isWrong || isEliminated) ? "text-red-400" : "text-gray-200";
                        const barColor = isCorrect ? "bg-green-500/60" : (isWrong || isEliminated) ? "bg-red-500/40" : "bg-gold/60";
                        return (
                          <div key={teamCode}>
                            <div className="flex items-center gap-2">
                              <span className={`text-base ${(isWrong || isEliminated) ? "grayscale opacity-50" : ""}`}>{team?.flag ?? "🏳️"}</span>
                              <span className={`text-sm font-bold ${nameColor}`}>{team?.name ?? teamCode}</span>
                              <div className="flex-1 h-2 bg-navy-lighter rounded-full overflow-hidden">
                                <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-gray-400 font-medium w-12 text-right">
                                {names.length} ({pct}%)
                              </span>
                            </div>
                            {isExpanded && (
                              <div className="ml-7 mt-1 flex flex-wrap gap-1 mb-2">
                                {names.sort().map((name) => (
                                  <span key={name} className="text-[10px] bg-white/5 text-gray-400 rounded px-1.5 py-0.5">
                                    {name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── View 2: Participant Browser ──

function ParticipantBrowser({
  withTier2,
  selectedId,
  onSelect,
  results,
  eliminatedTeams,
}: {
  withTier2: ParticipantData[];
  selectedId: string;
  onSelect: (id: string) => void;
  results: Record<string, string>;
  eliminatedTeams: Set<string>;
}) {
  const selected = withTier2.find((p) => p.id === selectedId) ?? withTier2[0];

  return (
    <div className="space-y-6">
      <select
        value={selected?.id ?? ""}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full sm:w-auto bg-navy-lighter border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white font-medium focus:border-gold/50 focus:outline-none"
      >
        {withTier2.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {selected && (() => {
        const ko = getKO(selected);
        const picksMap: Record<string, string> = {};
        for (const kp of ko) {
          picksMap[`${kp.round}_${kp.matchNumber}`] = kp.winner;
        }
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-gold/20 bg-gold/5 px-4 py-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Golden Ball Pick</span>
              <p className="text-sm text-gold font-bold mt-1">{getPicks(selected)?.goldenBall || "None"}</p>
            </div>
            <BracketDisplay
              picks={picksMap}
              actualResults={results}
              eliminatedTeams={eliminatedTeams}
            />
          </div>
        );
      })()}
    </div>
  );
}

// ── View 3: Table Grid ──

function TableView({ withTier2, results, eliminatedTeams }: { withTier2: ParticipantData[]; results: Record<string, string>; eliminatedTeams: Set<string> }) {
  // Build all match keys in order
  const matchKeys: { round: string; matchNumber: number; label: string }[] = [];
  for (const round of ROUND_ORDER) {
    const count = knockoutRoundMatchCounts[round] ?? 0;
    for (let i = 1; i <= count; i++) {
      matchKeys.push({
        round,
        matchNumber: i,
        label: `${ROUND_SHORT[round]}${count > 1 ? i : ""}`,
      });
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10">
            <th className="px-2 py-2 text-left text-gray-500 font-semibold uppercase tracking-wider sticky left-0 bg-navy z-10 min-w-[120px]">
              Player
            </th>
            {matchKeys.map(({ round, matchNumber, label }) => (
              <th
                key={`${round}_${matchNumber}`}
                className="px-1 py-2 text-center text-gray-600 font-semibold uppercase tracking-wider whitespace-nowrap"
              >
                {label}
              </th>
            ))}
            <th className="px-2 py-2 text-center text-gold font-semibold uppercase tracking-wider whitespace-nowrap">
              Ball
            </th>
          </tr>
        </thead>
        <tbody>
          {withTier2.map((p) => {
            const ko = getKO(p);
            const koMap = new Map<string, string>();
            for (const pick of ko) {
              koMap.set(`${pick.round}_${pick.matchNumber}`, pick.winner);
            }

            return (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-2 py-1.5 text-sm font-medium text-white sticky left-0 bg-navy z-10 truncate max-w-[140px]">
                  {p.name}
                </td>
                {matchKeys.map(({ round, matchNumber }) => {
                  const key = `${round}_${matchNumber}`;
                  const winner = koMap.get(key);
                  const team = winner ? getTeamByCode(winner) : null;
                  const actual = results[key];
                  const isWrong = winner && actual && winner !== actual;
                  const isEliminated = winner && !actual && eliminatedTeams.has(winner);
                  return (
                    <td key={key} className="px-1 py-1.5 text-center">
                      {team ? (
                        <span title={`${team.name} (${team.code})`} className={`cursor-default ${(isWrong || isEliminated) ? "grayscale opacity-40" : ""}`}>
                          {team.flag}
                        </span>
                      ) : (
                        <span className="text-gray-700">-</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-2 py-1.5 text-center text-[10px] text-gray-400 whitespace-nowrap">
                  {getPicks(p)?.goldenBall || "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
