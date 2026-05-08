import type { Metadata } from "next";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { participants, categories } from "@/data/participants";
import { getTeamByCode } from "@/data/teams";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See who's winning the World Cup 2026 Fantasy contest.",
};

function getMedalColor(rank: number): string {
  switch (rank) {
    case 1: return "text-gold";
    case 2: return "text-silver";
    case 3: return "text-bronze";
    default: return "text-gray-500";
  }
}

function getMedalEmoji(rank: number): string {
  switch (rank) {
    case 1: return "🥇";
    case 2: return "🥈";
    case 3: return "🥉";
    default: return "";
  }
}

export default function LeaderboardPage() {
  // Sort participants by score (all 0 pre-tournament, so alphabetical tiebreak)
  const sorted = [...participants].sort((a, b) => {
    // Pre-tournament: everyone at 0, rank by name
    return a.name.localeCompare(b.name);
  });

  // Assign ranks
  const ranked = sorted.map((p, i) => ({
    ...p,
    rank: i + 1,
    score: 0, // Pre-tournament
  }));

  return (
    <>
      <PageHeader
        title="Leaderboard"
        subtitle="Current standings for all participants. Points update as the tournament progresses."
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
              Points will be awarded as results come in during June and July 2026.
            </p>
          </div>

          {/* Standings Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                  Standings
                </h2>
                <span className="text-xs text-gray-500">
                  {participants.length} participants
                </span>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 w-16">Rank</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Player</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Champion Pick</th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((p) => {
                    const champPick = p.picks.find(pk => pk.category === "champion");
                    const champTeam = champPick ? getTeamByCode(champPick.selection) : null;

                    return (
                      <tr
                        key={p.id}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {p.rank <= 3 ? (
                              <span className="text-lg">{getMedalEmoji(p.rank)}</span>
                            ) : (
                              <span className={`font-heading text-lg font-bold ${getMedalColor(p.rank)}`}>
                                {p.rank}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{p.avatar}</span>
                            <span className="font-medium text-white">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {champTeam && (
                            <span className="inline-flex items-center gap-1.5 text-sm text-gray-300">
                              <span>{champTeam.flag}</span>
                              <span>{champTeam.name}</span>
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-heading text-xl font-bold text-accent">
                            {p.score}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Scoring Breakdown */}
          <div className="mt-10">
            <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-white mb-4">
              Scoring Breakdown
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 rounded-lg border border-white/5 bg-navy-lighter/30 px-4 py-3"
                >
                  <span className="text-xl">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-300 truncate">{cat.label}</p>
                  </div>
                  <span className="text-sm font-bold text-gold whitespace-nowrap">{cat.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
