import type { Metadata } from "next";
import { Suspense } from "react";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import BonusPicksComparison from "@/components/leaderboard/BonusPicksComparison";
import SortableTable from "@/components/leaderboard/SortableTable";
import WhatIfLeaderboard from "@/components/leaderboard/WhatIfLeaderboard";
import type { Scenario } from "@/components/leaderboard/WhatIfLeaderboard";
import {
  TIER1_MAX,
  TIER2_MAX,
  OVERALL_MAX,
  knockoutRoundPoints,
  knockoutRoundMatchCounts,
} from "@/data/participants";
import {
  calculateAllPoints,
  calculatePotentialPoints,
  setActualBonusResults,
  setActualKnockoutResults,
  actualKnockoutResults,
} from "@/data/scoring";
import { getAllUsersWithPicks, getPersistedLiveResults, isKvConfigured } from "@/lib/storage";
import { TOURNAMENT_START } from "@/lib/tournament-dates";
import { getTeamByCode } from "@/data/teams";
import { buildParticipantsFromKv } from "@/lib/build-participants";
import LivePoller from "@/components/LivePoller";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Current standings for the World Cup 2026 Fantasy contest with two-tier scoring breakdown.",
};

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  // Fetch real participants from KV
  let participants: import("@/data/participants").Participant[] = [];
  if (isKvConfigured()) {
    const kvData = await getAllUsersWithPicks();
    participants = buildParticipantsFromKv(kvData);
  }

  const liveResults = isKvConfigured() ? await getPersistedLiveResults() : null;

  if (liveResults) {
    setActualKnockoutResults(liveResults.knockoutResults);
    setActualBonusResults({ goldenBoot: liveResults.goldenBoot });
  }

  const scorersData: import("@/lib/football-api-types").TransformedScorer[] = liveResults?.scorers?.map(s => ({
    playerName: s.playerName,
    teamName: "",
    teamTla: s.teamTla,
    teamCrest: s.teamCrest,
    goals: s.goals,
    assists: s.assists,
    playedMatches: 0,
    penalties: 0,
  })) ?? [];
  const teamStatsData: { teamTla: string; goalsScored: number; goalsConceded: number; matchesPlayed: number }[] = [];

  const hasLiveScoring = true;
  const tournamentStarted = new Date() >= TOURNAMENT_START;

  const lastUpdated = new Date().toISOString();

  // Calculate points with live data injected
  const withPoints = calculateAllPoints(participants);

  // Sort by total points, then Tier 1, then name
  const sorted = [...withPoints].sort((a, b) => {
    const totalDiff = b.calculatedPoints.total - a.calculatedPoints.total;
    if (totalDiff !== 0) return totalDiff;
    const tier1Diff =
      b.calculatedPoints.tier1Groups +
      b.calculatedPoints.tier1Bonus -
      (a.calculatedPoints.tier1Groups + a.calculatedPoints.tier1Bonus);
    if (tier1Diff !== 0) return tier1Diff;
    return a.name.localeCompare(b.name);
  });

  const ranked = sorted.map((p, i) => {
    const potential = calculatePotentialPoints(p);
    return {
      ...p,
      rank: i + 1,
      tier1Total:
        p.calculatedPoints.tier1Groups + p.calculatedPoints.tier1Bonus,
      tier2Total:
        p.calculatedPoints.tier2Bracket + p.calculatedPoints.tier2Bonus,
      maxPossible: potential.maximum,
    };
  });

  // Compute what-if scenarios for remaining matches (Final + 3rd Place)
  const WHAT_IF_SCENARIOS = [
    { id: "esp-fra", final: "ESP", third: "FRA", label: "\u{1F1EA}\u{1F1F8} Spain wins, \u{1F1EB}\u{1F1F7} France 3rd", shortLabel: "\u{1F1EA}\u{1F1F8} Win, \u{1F1EB}\u{1F1F7} 3rd" },
    { id: "esp-eng", final: "ESP", third: "ENG", label: "\u{1F1EA}\u{1F1F8} Spain wins, \u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F} England 3rd", shortLabel: "\u{1F1EA}\u{1F1F8} Win, \u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F} 3rd" },
    { id: "arg-fra", final: "ARG", third: "FRA", label: "\u{1F1E6}\u{1F1F7} Argentina wins, \u{1F1EB}\u{1F1F7} France 3rd", shortLabel: "\u{1F1E6}\u{1F1F7} Win, \u{1F1EB}\u{1F1F7} 3rd" },
    { id: "arg-eng", final: "ARG", third: "ENG", label: "\u{1F1E6}\u{1F1F7} Argentina wins, \u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F} England 3rd", shortLabel: "\u{1F1E6}\u{1F1F7} Win, \u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F} 3rd" },
  ];

  const savedResults = actualKnockoutResults ? { ...actualKnockoutResults } : null;

  const scenarios: Scenario[] = WHAT_IF_SCENARIOS.map((scenario) => {
    const hypothetical = { ...savedResults, final_1: scenario.final, third_place_1: scenario.third };
    setActualKnockoutResults(hypothetical);

    const scenarioWithPoints = calculateAllPoints(participants);
    const scenarioSorted = [...scenarioWithPoints].sort((a, b) => {
      const totalDiff = b.calculatedPoints.total - a.calculatedPoints.total;
      if (totalDiff !== 0) return totalDiff;
      const tier1Diff =
        b.calculatedPoints.tier1Groups + b.calculatedPoints.tier1Bonus -
        (a.calculatedPoints.tier1Groups + a.calculatedPoints.tier1Bonus);
      if (tier1Diff !== 0) return tier1Diff;
      return a.name.localeCompare(b.name);
    });

    const scenarioRanked = scenarioSorted.map((p) => ({
      id: p.id,
      name: p.name,
      tier1Total: p.calculatedPoints.tier1Groups + p.calculatedPoints.tier1Bonus,
      tier2Total: p.calculatedPoints.tier2Bracket + p.calculatedPoints.tier2Bonus,
      total: p.calculatedPoints.total,
      maxPossible: p.calculatedPoints.total,
      tiebreaker: p.tiebreaker,
    }));

    return {
      id: scenario.id,
      label: scenario.label,
      shortLabel: scenario.shortLabel,
      participants: scenarioRanked,
    };
  });

  // Restore actual results
  setActualKnockoutResults(savedResults);

  const knockoutRounds = [
    { key: "round_of_32", label: "R32", pts: knockoutRoundPoints["round_of_32"], matches: knockoutRoundMatchCounts["round_of_32"] },
    { key: "round_of_16", label: "R16", pts: knockoutRoundPoints["round_of_16"], matches: knockoutRoundMatchCounts["round_of_16"] },
    { key: "quarter", label: "QF", pts: knockoutRoundPoints["quarter"], matches: knockoutRoundMatchCounts["quarter"] },
    { key: "semi", label: "SF", pts: knockoutRoundPoints["semi"], matches: knockoutRoundMatchCounts["semi"] },
    { key: "final", label: "F", pts: knockoutRoundPoints["final"], matches: knockoutRoundMatchCounts["final"] },
  ];

  return (
    <>
      <PageHeader
        title="Leaderboard"
        subtitle="Current standings with Tier 1 and Tier 2 scoring breakdown."
        icon="📊"
      />

      <section className="py-10 sm:py-14">
        <Container>
          {/* Status notice */}
          <div className={`mb-8 rounded-lg border px-5 py-4 text-center ${
            hasLiveScoring
              ? "border-accent/20 bg-accent/5"
              : tournamentStarted
              ? "border-yellow-500/20 bg-yellow-500/5"
              : "border-accent/20 bg-accent/5"
          }`}>
            {hasLiveScoring ? (
              <>
                <p className="text-sm text-accent font-medium">
                  Scores calculated from live tournament results
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Points update automatically as matches finish.
                </p>
              </>
            ) : tournamentStarted ? (
              <>
                <p className="text-sm text-yellow-400 font-medium">
                  Live scores temporarily unavailable. Refresh the page to retry.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  The tournament is in progress but score data could not be loaded.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-accent font-medium">
                  🏟️ The tournament has not started yet. All participants are tied at 0 points.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Tier 1 points update during the group stage. Tier 2 points update during the knockout rounds.
                </p>
              </>
            )}
            <LivePoller
              hasLiveMatches={false}
              isTournamentActive={tournamentStarted}
              serverTimestamp={lastUpdated}
            />
          </div>

          {/* Main Standings Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  Standings
                </h2>
                <span className="text-xs text-gray-500">
                  {participants.length} participants · {OVERALL_MAX} pts max
                </span>
              </div>
            </CardHeader>
            {participants.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <span className="text-4xl block mb-3" aria-hidden>📋</span>
                <p className="text-gray-400 text-sm">No participants yet. The leaderboard will populate once contestants join the contest.</p>
              </div>
            ) : (
              <WhatIfLeaderboard
                current={ranked.map((p) => {
                  const finalPick = p.knockoutPicks.find((k) => k.round === "final" && k.matchNumber === 1);
                  const finalTeam = finalPick ? getTeamByCode(finalPick.winner) : undefined;
                  return {
                    id: p.id,
                    name: p.name,
                    tier1Total: p.tier1Total,
                    tier2Total: p.tier2Total,
                    total: p.calculatedPoints.total,
                    maxPossible: p.maxPossible,
                    tiebreaker: p.tiebreaker,
                    bonusPicks: {
                      goldenBoot: p.bonusPicks.goldenBoot,
                      goldenBall: p.bonusPicks.goldenBall,
                      finalWinner: finalTeam ? `${finalTeam.flag} ${finalTeam.name}` : "",
                    },
                  };
                })}
                scenarios={scenarios}
              />
            )}
          </Card>

          {/* Bonus Picks Comparison */}
          <div className="mt-10">
            <Suspense>
              <BonusPicksComparison scorers={scorersData} teamStats={teamStatsData} />
            </Suspense>
          </div>

          {/* Scoring Key */}
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Tier 1 Breakdown */}
            <Card className="border-accent/10">
              <CardHeader className="bg-accent/5">
                <h3 className="font-heading text-base font-bold uppercase tracking-wide text-white">
                  Tier 1 Scoring ({TIER1_MAX} pts max)
                </h3>
              </CardHeader>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">📊 Group Positions (12 groups x 4 teams)</span>
                  <span className="font-bold text-accent">144 pts</span>
                </div>
                <div className="ml-4 space-y-1 text-xs text-gray-500">
                  <p>Exact position: 3 pts per team</p>
                  <p>Right bucket: 1 pt per team</p>
                </div>
                <div className="flex items-center justify-between text-sm border-t border-white/5 pt-3">
                  <span className="text-gray-300">👟 Golden Boot (top scorer)</span>
                  <span className="font-bold text-accent">10 pts</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">⚽ Most Goals (team, group stage)</span>
                  <span className="font-bold text-accent">10 pts</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">🛡️ Fewest Conceded (team, group stage)</span>
                  <span className="font-bold text-accent">10 pts</span>
                </div>
              </div>
            </Card>

            {/* Tier 2 Breakdown */}
            <Card className="border-gold/10">
              <CardHeader className="bg-gold/5">
                <h3 className="font-heading text-base font-bold uppercase tracking-wide text-white">
                  Tier 2 Scoring ({TIER2_MAX} pts max)
                </h3>
              </CardHeader>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">🏆 Knockout Bracket</span>
                  <span className="font-bold text-gold">114 pts</span>
                </div>
                <div className="ml-4 space-y-1">
                  {knockoutRounds.map((r) => (
                    <div key={r.key} className="flex items-center justify-between text-xs text-gray-500">
                      <span>{r.label}: {r.matches} {r.matches === 1 ? "match" : "matches"} x {r.pts} pts</span>
                      <span>{r.matches * r.pts} pts</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm border-t border-white/5 pt-3">
                  <span className="text-gray-300">🌟 Golden Ball (best player)</span>
                  <span className="font-bold text-gold">10 pts</span>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </section>
    </>
  );
}
