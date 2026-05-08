import type { Metadata } from "next";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import {
  participants,
  TIER1_MAX,
  TIER2_MAX,
  OVERALL_MAX,
  knockoutRoundPoints,
  knockoutRoundMatchCounts,
} from "@/data/participants";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Current standings for the World Cup 2026 Fantasy contest with two-tier scoring breakdown.",
};

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

export default function LeaderboardPage() {
  // Sort participants by total points, then Tier 1, then name
  const sorted = [...participants].sort((a, b) => {
    const totalDiff = b.points.total - a.points.total;
    if (totalDiff !== 0) return totalDiff;
    const tier1Diff = (b.points.tier1Groups + b.points.tier1Bonus) - (a.points.tier1Groups + a.points.tier1Bonus);
    if (tier1Diff !== 0) return tier1Diff;
    return a.name.localeCompare(b.name);
  });

  const ranked = sorted.map((p, i) => ({
    ...p,
    rank: i + 1,
    tier1Total: p.points.tier1Groups + p.points.tier1Bonus,
    tier2Total: p.points.tier2Bracket + p.points.tier2Bonus,
  }));

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
          {/* Pre-tournament notice */}
          <div className="mb-8 rounded-lg border border-accent/20 bg-accent/5 px-5 py-4 text-center">
            <p className="text-sm text-accent font-medium">
              🏟️ The tournament has not started yet. All participants are tied at 0 points.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Tier 1 points update during the group stage. Tier 2 points update during the knockout rounds.
            </p>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 w-14">#</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Player</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-accent text-center">
                      <span className="hidden sm:inline">Tier 1</span>
                      <span className="sm:hidden">T1</span>
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gold text-center">
                      <span className="hidden sm:inline">Tier 2</span>
                      <span className="sm:hidden">T2</span>
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Total</th>
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
                          <span className="text-xl">{p.avatar}</span>
                          <div>
                            <span className="font-medium text-white">{p.name}</span>
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
                          {p.points.total}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

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
                  <span className="font-bold text-gold">118 pts</span>
                </div>
                <div className="ml-4 space-y-1">
                  {knockoutRounds.map((r) => (
                    <div key={r.key} className="flex items-center justify-between text-xs text-gray-500">
                      <span>{r.label}: {r.matches} matches x {r.pts} pts</span>
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
