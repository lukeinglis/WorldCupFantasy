"use client";

import { useState, useEffect } from "react";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { getTeamByCode, groupLabels } from "@/data/teams";
import PicksTabs from "@/components/PicksTabs";
import { useAuth } from "@/components/AuthProvider";
import {
  areTier1PicksRevealed,
  areTier2PicksRevealed,
  TOURNAMENT_START,
  KNOCKOUT_START,
  formatRevealDate,
} from "@/lib/tournament-dates";

interface ParticipantPicks {
  id: string;
  name: string;
  hasPicks: boolean;
  picks: {
    groupPredictions: { group: string; order: [string, string, string, string] }[];
    goldenBoot: string;
    mostGoalsTeam: string;
    fewestConcededTeam: string;
    goldenBall: string;
    tiebreaker: { homeScore: number; awayScore: number };
    submittedAt: string;
    tier2Submitted?: boolean;
    knockoutPicks?: { round: string; matchNumber: number; winner: string }[];
  } | null;
}

function HiddenPicksBanner({ revealDate, tier }: { revealDate: Date; tier: number }) {
  return (
    <Card className="border-gold/20 bg-gold/5">
      <CardBody className="py-12 text-center">
        <span className="text-5xl block mb-4" aria-hidden>🔒</span>
        <h3 className="font-heading text-xl font-bold text-white mb-2">
          Tier {tier} Picks Are Hidden
        </h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Picks will be revealed when {tier === 1 ? "the tournament begins" : "the knockout stage begins"} on{" "}
          <span className="text-gold font-medium">{formatRevealDate(revealDate)}</span>.
          Each participant can only see their own picks until then.
        </p>
      </CardBody>
    </Card>
  );
}

function ParticipantRoster({ participants }: { participants: ParticipantPicks[] }) {
  const withPicks = participants.filter((p) => p.hasPicks);
  const withoutPicks = participants.filter((p) => !p.hasPicks);

  return (
    <Card className="border-accent/20">
      <CardBody className="py-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl" aria-hidden>👥</span>
          <div>
            <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
              Who&apos;s In
            </h3>
            <p className="text-xs text-gray-500">
              {withPicks.length} submitted picks{withoutPicks.length > 0 ? `, ${withoutPicks.length} still deciding` : ""}
            </p>
          </div>
        </div>
        {withPicks.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {withPicks.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3 py-1.5 text-sm font-medium text-accent"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {p.name}
              </span>
            ))}
          </div>
        )}
        {withoutPicks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {withoutPicks.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-gray-500"
              >
                {p.name}
              </span>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

interface GroupStanding {
  position: number;
  team: { tla: string; shortName: string; crest: string | null };
  played: number;
}

interface MatchResult {
  group: string;
  homeTeam: { tla: string; shortName: string; crest: string | null };
  awayTeam: { tla: string; shortName: string; crest: string | null };
  score: { fullTime: { home: number | null; away: number | null } };
}

function computeStandingsFromGroupMatches(matches: MatchResult[]): Record<string, GroupStanding[]> {
  const stats = new Map<string, {
    group: string; tla: string; shortName: string; crest: string | null;
    played: number; won: number; draw: number; lost: number; gf: number; ga: number; pts: number;
  }>();

  for (const m of matches) {
    const hKey = `${m.group}-${m.homeTeam.tla}`;
    const aKey = `${m.group}-${m.awayTeam.tla}`;
    if (!stats.has(hKey)) stats.set(hKey, { group: m.group, tla: m.homeTeam.tla, shortName: m.homeTeam.shortName, crest: m.homeTeam.crest, played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0, pts: 0 });
    if (!stats.has(aKey)) stats.set(aKey, { group: m.group, tla: m.awayTeam.tla, shortName: m.awayTeam.shortName, crest: m.awayTeam.crest, played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0, pts: 0 });

    const h = stats.get(hKey)!;
    const a = stats.get(aKey)!;
    const hg = m.score.fullTime.home ?? 0;
    const ag = m.score.fullTime.away ?? 0;

    h.played++; a.played++; h.gf += hg; h.ga += ag; a.gf += ag; a.ga += hg;
    if (hg > ag) { h.won++; h.pts += 3; a.lost++; }
    else if (hg < ag) { a.won++; a.pts += 3; h.lost++; }
    else { h.draw++; a.draw++; h.pts++; a.pts++; }
  }

  const grouped = new Map<string, typeof stats extends Map<string, infer V> ? V[] : never>();
  for (const s of stats.values()) {
    if (!grouped.has(s.group)) grouped.set(s.group, []);
    grouped.get(s.group)!.push(s);
  }

  const result: Record<string, GroupStanding[]> = {};
  for (const [group, teams] of grouped) {
    teams.sort((a, b) => (b.pts - a.pts) || ((b.gf - b.ga) - (a.gf - a.ga)) || (b.gf - a.gf));
    result[group] = teams.map((t, i) => ({
      position: i + 1,
      team: { tla: t.tla, shortName: t.shortName, crest: t.crest },
      played: t.played,
    }));
  }
  return result;
}

function GroupPredictionGrid({
  group,
  participantsList,
  picksRevealed,
  standings,
  currentUserId,
}: {
  group: string;
  participantsList: ParticipantPicks[];
  picksRevealed: boolean;
  standings?: GroupStanding[];
  currentUserId?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const withPicks = participantsList.filter(
    (p) => p.hasPicks && (picksRevealed ? p.picks?.groupPredictions?.find((g) => g.group === group) : true)
  );

  // Actual finishing order from standings
  const actualOrder = standings
    ? [...standings].sort((a, b) => a.position - b.position).map((s) => s.team.tla)
    : null;
  const isGroupComplete = standings
    ? standings.length >= 4 && standings.every((s) => s.played >= 3)
    : false;

  // Consensus: most popular team per position
  const consensus: (string | null)[] = [null, null, null, null];
  const consensusCounts: (number | null)[] = [null, null, null, null];
  if (picksRevealed && withPicks.length > 0) {
    for (let pos = 0; pos < 4; pos++) {
      const counts: Record<string, number> = {};
      for (const p of withPicks) {
        const gp = p.picks?.groupPredictions?.find((g) => g.group === group);
        if (gp?.order[pos]) {
          counts[gp.order[pos]] = (counts[gp.order[pos]] ?? 0) + 1;
        }
      }
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (top) {
        consensus[pos] = top[0];
        consensusCounts[pos] = top[1];
      }
    }
  }

  // Current user's picks
  const currentUser = currentUserId
    ? withPicks.find((p) => p.id === currentUserId)
    : null;
  const userPicks = currentUser?.picks?.groupPredictions?.find(
    (g) => g.group === group
  );

  function pickMatchesActual(pickCode: string, position: number): boolean | null {
    if (!actualOrder || !actualOrder[position]) return null;
    return actualOrder[position] === pickCode;
  }

  function renderTeamCell(code: string, position: number, showScoring: boolean) {
    const team = getTeamByCode(code);
    const match = showScoring ? pickMatchesActual(code, position) : null;
    const bgClass = match === true
      ? "bg-accent/10"
      : match === false
      ? "bg-red-500/10"
      : "";

    return (
      <td key={`${code}-${position}`} className={`px-2 py-2 text-center ${bgClass}`}>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-base">{team?.flag ?? ""}</span>
          <span className="text-xs text-gray-400 font-mono">{code}</span>
        </div>
      </td>
    );
  }

  const hasData = picksRevealed && withPicks.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-base font-bold uppercase tracking-wide text-white">
            Group {group}
          </h3>
          {actualOrder && (
            <span className={`text-xs font-medium ${isGroupComplete ? "text-accent" : "text-gold"}`}>
              {isGroupComplete ? "Final" : "In Progress"}
            </span>
          )}
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {!hasData && !actualOrder ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-gray-500">No data available yet.</p>
          </div>
        ) : (
          <>
            {/* Summary rows */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-left w-28">
                    </th>
                    <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-accent text-center">
                      1st
                    </th>
                    <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-accent text-center">
                      2nd
                    </th>
                    <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 text-center">
                      3rd
                    </th>
                    <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 text-center">
                      4th
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Actual standings */}
                  {actualOrder && (
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <td className="px-3 py-2">
                        <span className="text-xs font-semibold text-gray-300">Actual</span>
                      </td>
                      {actualOrder.slice(0, 4).map((code, i) => {
                        const team = getTeamByCode(code);
                        return (
                          <td key={`actual-${i}`} className="px-2 py-2 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-base">{team?.flag ?? ""}</span>
                              <span className="text-xs text-white font-mono font-bold">{code}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  )}

                  {/* Row 2: Consensus */}
                  {picksRevealed && consensus[0] && (
                    <tr className="border-b border-white/10">
                      <td className="px-3 py-2">
                        <span className="text-xs font-semibold text-gray-400">Consensus</span>
                      </td>
                      {consensus.map((code, i) => {
                        if (!code) return <td key={`cons-${i}`} className="px-2 py-2" />;
                        const team = getTeamByCode(code);
                        const match = actualOrder ? actualOrder[i] === code : null;
                        const bgClass = match === true ? "bg-accent/10" : match === false ? "bg-red-500/10" : "";
                        return (
                          <td key={`cons-${i}`} className={`px-2 py-2 text-center ${bgClass}`}>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-base">{team?.flag ?? ""}</span>
                              <span className="text-xs text-gray-400 font-mono">{code}</span>
                              <span className="text-[10px] text-gray-600">
                                {consensusCounts[i]}/{withPicks.length}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  )}

                  {/* Row 3: Your picks (only if logged in) */}
                  {userPicks && (
                    <tr className="border-b border-white/10">
                      <td className="px-3 py-2">
                        <span className="text-xs font-semibold text-accent">You</span>
                      </td>
                      {userPicks.order.map((code, i) =>
                        renderTeamCell(code, i, !!actualOrder)
                      )}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Expand/collapse button */}
            {hasData && (
              <>
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] transition-colors border-t border-white/5"
                >
                  <span>{expanded ? "Hide" : "Show"} all {withPicks.length} picks</span>
                  <span>{expanded ? "▲" : "▼"}</span>
                </button>

                {expanded && (
                  <div className="overflow-x-auto border-t border-white/5">
                    <table className="w-full text-sm">
                      <tbody>
                        {withPicks.map((p) => {
                          const gp = p.picks?.groupPredictions?.find((g) => g.group === group);
                          return (
                            <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="px-3 py-2 w-28">
                                <span className={`text-xs truncate max-w-[80px] ${p.id === currentUserId ? "text-accent font-medium" : "text-gray-400"}`}>
                                  {p.name}
                                </span>
                              </td>
                              {gp ? gp.order.map((code, i) =>
                                renderTeamCell(code, i, !!actualOrder)
                              ) : (
                                <td colSpan={4} className="px-2 py-2 text-center">
                                  <span className="text-xs text-gray-600">🔒 Hidden</span>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}

function BonusPicksSection({ participantsList, picksRevealed }: { participantsList: ParticipantPicks[]; picksRevealed: boolean }) {
  const withPicks = participantsList.filter((p) => picksRevealed ? p.picks : p.hasPicks);

  const bonusCategories = [
    {
      key: "goldenBoot" as const,
      label: "Golden Boot",
      icon: "👟",
      tier: 1,
      scope: "Tournament top scorer",
      getValue: (p: ParticipantPicks) => p.picks?.goldenBoot ?? "",
    },
    {
      key: "mostGoalsTeam" as const,
      label: "Most Goals (Team)",
      icon: "⚽",
      tier: 1,
      scope: "Group stage only",
      getValue: (p: ParticipantPicks) => {
        const code = p.picks?.mostGoalsTeam ?? "";
        const team = getTeamByCode(code);
        return team ? `${team.flag} ${team.name}` : code;
      },
    },
    {
      key: "fewestConcededTeam" as const,
      label: "Fewest Conceded (Team)",
      icon: "🛡️",
      tier: 1,
      scope: "Group stage only",
      getValue: (p: ParticipantPicks) => {
        const code = p.picks?.fewestConcededTeam ?? "";
        const team = getTeamByCode(code);
        return team ? `${team.flag} ${team.name}` : code;
      },
    },
    {
      key: "goldenBall" as const,
      label: "Golden Ball",
      icon: "🌟",
      tier: 2,
      scope: "Best player of tournament",
      getValue: (p: ParticipantPicks) => p.picks?.goldenBall ?? "",
    },
  ];

  const tier2Revealed = areTier2PicksRevealed();

  return (
    <div className="space-y-6">
      {bonusCategories.map((cat) => {
        // Hide tier 2 bonus picks until knockout
        if (cat.tier === 2 && !tier2Revealed) {
          return (
            <Card key={cat.key} className="border-gold/10">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <h3 className="font-heading text-base font-bold uppercase tracking-wide text-white">
                      {cat.label}
                    </h3>
                    <p className="text-xs text-gray-500">
                      <span className="text-gold">Tier 2</span> {" · "}{cat.scope}{" · "}10 points
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="py-8 text-center">
                <span className="text-3xl block mb-2" aria-hidden>🔒</span>
                <p className="text-xs text-gray-500">
                  Revealed when the knockout stage begins on {formatRevealDate(KNOCKOUT_START)}.
                </p>
              </CardBody>
            </Card>
          );
        }

        return (
          <Card key={cat.key} className={cat.tier === 1 ? "border-accent/10" : "border-gold/10"}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <h3 className="font-heading text-base font-bold uppercase tracking-wide text-white">
                    {cat.label}
                  </h3>
                  <p className="text-xs text-gray-500">
                    <span className={cat.tier === 1 ? "text-accent" : "text-gold"}>Tier {cat.tier}</span>
                    {" · "}{cat.scope}{" · "}10 points
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {withPicks.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="text-xs text-gray-500">No picks submitted yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {withPicks.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 px-5 py-3 border-b border-r border-white/5 last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">{p.name}</p>
                        <p className="text-sm font-medium text-white truncate mt-0.5">
                          {p.picks ? (cat.getValue(p) || "Not set") : "🔒 Hidden"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

function ParticipantDetail({ participant }: { participant: ParticipantPicks }) {
  if (!participant.hasPicks) return null;

  return (
    <Card hover>
      <CardHeader>
        <h3 className="font-heading text-base font-bold text-white">{participant.name}</h3>
        {participant.picks ? (
          <p className="text-xs text-gray-500">
            Tiebreaker: {participant.picks.tiebreaker.homeScore} : {participant.picks.tiebreaker.awayScore}
          </p>
        ) : (
          <p className="text-xs text-gray-500">Picks submitted</p>
        )}
      </CardHeader>
      <CardBody>
        {participant.picks ? (
          <>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Group Winners
              </p>
              <div className="grid grid-cols-6 gap-1.5">
                {groupLabels.map((group) => {
                  const gp = participant.picks?.groupPredictions?.find((g) => g.group === group);
                  const winnerCode = gp ? gp.order[0] : null;
                  const winner = winnerCode ? getTeamByCode(winnerCode) : null;
                  return (
                    <div key={group} className="text-center rounded bg-navy-lighter/50 px-1 py-1.5 border border-white/5">
                      <p className="text-[10px] text-gray-600 mb-0.5">{group}</p>
                      <span className="text-sm">{winner?.flag ?? "?"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Bonus Picks
              </p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>👟 Golden Boot</span>
                  <span className="text-white">{participant.picks.goldenBoot || "Not set"}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>⚽ Most Goals</span>
                  <span className="text-white">
                    {(() => {
                      const t = getTeamByCode(participant.picks?.mostGoalsTeam ?? "");
                      return t ? `${t.flag} ${t.name}` : participant.picks?.mostGoalsTeam || "Not set";
                    })()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>🛡️ Fewest Conceded</span>
                  <span className="text-white">
                    {(() => {
                      const t = getTeamByCode(participant.picks?.fewestConcededTeam ?? "");
                      return t ? `${t.flag} ${t.name}` : participant.picks?.fewestConcededTeam || "Not set";
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <span className="text-2xl block mb-2" aria-hidden>🔒</span>
            <p className="text-xs text-gray-500">Picks hidden until the tournament begins</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

const KNOCKOUT_ROUND_ORDER = ["round_of_32", "round_of_16", "quarter", "semi", "final"];
const KNOCKOUT_ROUND_LABELS: Record<string, string> = {
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter: "Quarterfinals",
  semi: "Semifinals",
  final: "Final",
};

function KnockoutBracketSection({
  participantsList,
  currentUserId,
}: {
  participantsList: ParticipantPicks[];
  currentUserId?: string;
}) {
  const tier2Revealed = areTier2PicksRevealed();
  const withTier2 = participantsList.filter(
    (p) => p.picks?.tier2Submitted && (p.picks?.knockoutPicks?.length ?? 0) > 0
  );

  if (!tier2Revealed) {
    return (
      <Card className="border-gold/20 bg-gold/5">
        <CardBody className="py-12 text-center">
          <span className="text-5xl block mb-4" aria-hidden>🔒</span>
          <h3 className="font-heading text-xl font-bold text-white mb-2">
            Knockout Bracket Picks Hidden
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Tier 2 picks will be revealed when the knockout stage begins on{" "}
            <span className="text-gold font-medium">{formatRevealDate(KNOCKOUT_START)}</span>.
          </p>
          {withTier2.length > 0 && (
            <p className="text-xs text-gray-500 mt-3">
              {withTier2.length} participant{withTier2.length !== 1 ? "s have" : " has"} submitted knockout picks.
            </p>
          )}
        </CardBody>
      </Card>
    );
  }

  if (withTier2.length === 0) {
    return (
      <Card className="border-gold/20 bg-gold/5">
        <CardBody className="py-12 text-center">
          <span className="text-4xl block mb-3" aria-hidden>🏆</span>
          <p className="text-gray-400 text-sm">No knockout bracket picks have been submitted yet.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-400">
        Each participant picked the winner of every knockout match. Points increase each round.
      </p>
      {KNOCKOUT_ROUND_ORDER.map((round) => {
        const roundPicks = withTier2.flatMap((p) =>
          (p.picks?.knockoutPicks ?? [])
            .filter((pick) => pick.round === round)
            .map((pick) => ({ ...pick, participantName: p.name, participantId: p.id }))
        );

        if (roundPicks.length === 0) return null;

        // Get unique match numbers in this round
        const matchNumbers = [
          ...new Set(roundPicks.map((p) => p.matchNumber)),
        ].sort((a, b) => a - b);

        return (
          <div key={round}>
            <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-gold mb-4">
              {KNOCKOUT_ROUND_LABELS[round] ?? round}
            </h3>
            <div className="space-y-3">
              {matchNumbers.map((matchNum) => {
                const matchPicks = roundPicks.filter(
                  (p) => p.matchNumber === matchNum
                );
                // Count how many picked each team
                const counts: Record<string, { count: number; names: string[] }> = {};
                for (const pick of matchPicks) {
                  if (!counts[pick.winner]) counts[pick.winner] = { count: 0, names: [] };
                  counts[pick.winner].count += 1;
                  counts[pick.winner].names.push(pick.participantName);
                }
                const sortedTeams = Object.entries(counts).sort(
                  (a, b) => b[1].count - a[1].count
                );

                return (
                  <div
                    key={`${round}-${matchNum}`}
                    className="rounded-lg border border-gold/10 bg-navy-light/60 p-3"
                  >
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium mb-2">
                      Match {matchNum}
                    </p>
                    <div className="space-y-1.5">
                      {sortedTeams.map(([teamCode, data]) => {
                        const team = getTeamByCode(teamCode);
                        const isUserPick = matchPicks.some(
                          (p) =>
                            p.participantId === currentUserId &&
                            p.winner === teamCode
                        );
                        return (
                          <div
                            key={teamCode}
                            className={`flex items-center gap-2 rounded px-2 py-1.5 ${
                              isUserPick ? "bg-gold/10 border border-gold/20" : ""
                            }`}
                          >
                            <span className="text-base">{team?.flag ?? ""}</span>
                            <span className="text-sm text-gray-300 font-medium">
                              {team?.name ?? teamCode}
                            </span>
                            <span className="ml-auto text-xs text-gray-500">
                              {data.count}/{withTier2.length}
                            </span>
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
      })}
    </div>
  );
}

interface StandingsData {
  group: string;
  standings: GroupStanding[];
}

export default function PicksPage() {
  const { user } = useAuth();
  const [participantsList, setParticipantsList] = useState<ParticipantPicks[]>([]);
  const [standingsMap, setStandingsMap] = useState<Record<string, GroupStanding[]>>({});
  const [loading, setLoading] = useState(true);
  const [kvConfigured, setKvConfigured] = useState(true);

  const tier1Revealed = areTier1PicksRevealed();

  useEffect(() => {
    async function fetchData() {
      try {
        const url = user ? `/api/participants?userId=${user.id}` : "/api/participants";
        const [participantsRes, standingsRes, matchesRes] = await Promise.all([
          fetch(url),
          fetch("/api/football/standings"),
          fetch("/api/football/matches"),
        ]);

        const participantsData = await participantsRes.json();
        setKvConfigured(participantsData.kvConfigured !== false);
        setParticipantsList(participantsData.participants ?? []);

        // Try standings endpoint first
        let gotStandings = false;
        if (standingsRes.ok) {
          const standingsData = await standingsRes.json();
          const map: Record<string, GroupStanding[]> = {};
          for (const g of (standingsData.standings ?? []) as StandingsData[]) {
            map[g.group] = g.standings;
          }
          if (Object.keys(map).length > 0) {
            setStandingsMap(map);
            gotStandings = true;
          }
        }

        // Fallback: compute from match results
        if (!gotStandings && matchesRes.ok) {
          const matchesData = await matchesRes.json();
          const matches = matchesData.matches ?? [];
          const groupMatches = matches.filter(
            (m: { stage: string; status: string; group: string | null }) =>
              m.stage === "group" && m.status === "FINISHED" && m.group
          );
          if (groupMatches.length > 0) {
            setStandingsMap(computeStandingsFromGroupMatches(groupMatches));
          }
        }
      } catch {
        // Silently fail, show empty state
      }
      setLoading(false);
    }
    fetchData();
  }, [user]);

  // All participants with picks are visible (names always shown, pick details gated by reveal)
  const visibleParticipants = participantsList.filter((p) => p.hasPicks);

  if (loading) {
    return (
      <>
        <PageHeader
          title="Everyone&apos;s Picks"
          subtitle="Group predictions, bonus picks, and knockout brackets."
          icon="📋"
        />
        <section className="py-10 sm:py-14">
          <Container>
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">Loading picks...</p>
            </div>
          </Container>
        </section>
      </>
    );
  }

  // Show hidden banner if picks exist but aren't revealed yet
  const hasHiddenPicks = !tier1Revealed && participantsList.some((p) => p.hasPicks);

  return (
    <>
      <PageHeader
        title="Everyone&apos;s Picks"
        subtitle="Group predictions, bonus picks, and knockout brackets."
        icon="📋"
      />

      <section className="py-10 sm:py-14">
        <Container>
          {!kvConfigured && (
            <div className="mb-6 rounded-lg border border-gold/20 bg-gold/5 px-5 py-4 text-center">
              <p className="text-sm text-gold font-medium">
                Storage is not configured yet. Picks will appear here once the administrator sets up Vercel KV.
              </p>
            </div>
          )}

          {hasHiddenPicks && (
            <div className="mb-8 space-y-6">
              <HiddenPicksBanner revealDate={TOURNAMENT_START} tier={1} />
              <ParticipantRoster participants={participantsList} />
            </div>
          )}

          <PicksTabs
            groupContent={
              <div className="space-y-10">
                <div>
                  <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-white mb-4">
                    Group Finishing Order Predictions
                  </h2>
                  <p className="text-sm text-gray-400 mb-6">
                    {tier1Revealed
                      ? "Each participant predicted the finishing order for all 12 groups. Green shading = predicted to advance (1st/2nd)."
                      : "Specific picks will be revealed when the tournament begins. You can see your own picks below."}
                  </p>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {groupLabels.map((group) => (
                      <GroupPredictionGrid
                        key={group}
                        group={group}
                        participantsList={visibleParticipants}
                        picksRevealed={tier1Revealed}
                        standings={standingsMap[group]}
                        currentUserId={user?.id}
                      />
                    ))}
                  </div>
                </div>
              </div>
            }
            bonusContent={
              <BonusPicksSection participantsList={visibleParticipants} picksRevealed={tier1Revealed} />
            }
            bracketContent={
              <KnockoutBracketSection
                participantsList={visibleParticipants}
                currentUserId={user?.id}
              />
            }
            participantsContent={
              visibleParticipants.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3" aria-hidden>👤</span>
                  <p className="text-gray-400 text-sm">No participants have submitted picks yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {visibleParticipants.map((p) => (
                    <ParticipantDetail key={p.id} participant={p} />
                  ))}
                </div>
              )
            }
          />
        </Container>
      </section>
    </>
  );
}
