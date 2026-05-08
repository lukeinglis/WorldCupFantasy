import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { getTeamsByGroup, groupLabels, type Team } from "@/data/teams";
import { participants } from "@/data/participants";
import { schedule } from "@/data/schedule";

export function generateStaticParams() {
  return groupLabels.map((groupId) => ({ groupId }));
}

export async function generateMetadata({ params }: { params: Promise<{ groupId: string }> }): Promise<Metadata> {
  const { groupId } = await params;
  return {
    title: `Group ${groupId}`,
    description: `Teams, matches, and picks for Group ${groupId} at the FIFA World Cup 2026.`,
  };
}

function PickedBySection({ teamCode }: { teamCode: string }) {
  // Find who picked this team in any category
  const pickers: { name: string; avatar: string; category: string }[] = [];
  for (const p of participants) {
    for (const pick of p.picks) {
      if (pick.selection === teamCode) {
        pickers.push({ name: p.name, avatar: p.avatar, category: pick.category });
      }
    }
  }

  if (pickers.length === 0) return null;

  const categoryLabels: Record<string, string> = {
    champion: "Champion",
    runner_up: "Runner Up",
    dark_horse: "Dark Horse",
    group_stage_exit: "Group Exit",
    most_cards: "Fewest Cards",
    first_goal: "First Goal",
  };

  return (
    <div className="mt-2">
      <p className="text-xs text-gray-500 mb-1">Picked by:</p>
      <div className="flex flex-wrap gap-1">
        {pickers.map((pk, i) => (
          <span
            key={`${pk.name}-${pk.category}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-navy-lighter/50 px-2 py-0.5 text-xs text-gray-400 border border-white/5"
          >
            {pk.avatar} {pk.name}
            <span className="text-gray-600">({categoryLabels[pk.category] ?? pk.category})</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default async function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const teamsByGroup = getTeamsByGroup();
  const groupTeams = teamsByGroup[groupId.toUpperCase()];

  if (!groupTeams) {
    notFound();
  }

  // Get group matches from schedule
  const groupMatches = schedule.filter(
    (m) => m.group === groupId.toUpperCase() && m.stage === "group"
  );

  return (
    <>
      <PageHeader
        title={`Group ${groupId.toUpperCase()}`}
        subtitle={`${groupTeams.length} teams competing for advancement`}
        icon="⚽"
      />

      <section className="py-10 sm:py-14">
        <Container>
          <div className="flex items-center gap-2 mb-6">
            <Link
              href="/groups"
              className="text-sm text-accent hover:text-green-300 transition-colors"
            >
              ← All Groups
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Team Cards */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                Teams
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {groupTeams
                  .sort((a: Team, b: Team) => a.fifaRanking - b.fifaRanking)
                  .map((team: Team) => (
                    <Card key={team.code} hover>
                      <CardBody>
                        <div className="flex items-start gap-3">
                          <span className="text-4xl">{team.flag}</span>
                          <div className="flex-1">
                            <h3 className="font-heading text-lg font-bold text-white">
                              {team.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {team.nickname} · {team.confederation}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-navy-lighter/50 rounded-full px-2 py-0.5 border border-white/5">
                                FIFA #{team.fifaRanking}
                              </span>
                              <span className="text-xs text-gray-600 font-mono">
                                {team.code}
                              </span>
                            </div>
                            <PickedBySection teamCode={team.code} />
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Sidebar: Standings & Matches */}
            <div className="space-y-6">
              {/* Group Standings (pre-tournament placeholder) */}
              <Card>
                <CardHeader>
                  <h3 className="font-heading text-base font-bold uppercase tracking-wide text-white">
                    Standings
                  </h3>
                </CardHeader>
                <CardBody className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 text-left">
                        <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Team</th>
                        <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">P</th>
                        <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">W</th>
                        <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">D</th>
                        <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">L</th>
                        <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupTeams
                        .sort((a: Team, b: Team) => a.fifaRanking - b.fifaRanking)
                        .map((team: Team, i: number) => (
                          <tr
                            key={team.code}
                            className={`border-b border-white/5 last:border-b-0 ${
                              i < 2 ? "bg-pitch/5" : ""
                            }`}
                          >
                            <td className="px-4 py-2">
                              <span className="flex items-center gap-1.5 text-sm">
                                <span>{team.flag}</span>
                                <span className="text-white font-medium">{team.code}</span>
                              </span>
                            </td>
                            <td className="px-2 py-2 text-center text-sm text-gray-500">0</td>
                            <td className="px-2 py-2 text-center text-sm text-gray-500">0</td>
                            <td className="px-2 py-2 text-center text-sm text-gray-500">0</td>
                            <td className="px-2 py-2 text-center text-sm text-gray-500">0</td>
                            <td className="px-2 py-2 text-center text-sm font-bold text-white">0</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-2 border-t border-white/5">
                    <p className="text-xs text-gray-600">
                      Top 2 advance. Best 3rd-place teams may also qualify.
                    </p>
                  </div>
                </CardBody>
              </Card>

              {/* Group Matches */}
              {groupMatches.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="font-heading text-base font-bold uppercase tracking-wide text-white">
                      Matches
                    </h3>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-3">
                      {groupMatches.map((match) => {
                        const home = groupTeams.find((t: Team) => t.code === match.homeTeam);
                        const away = groupTeams.find((t: Team) => t.code === match.awayTeam);
                        return (
                          <div key={match.id} className="rounded-lg bg-navy-lighter/30 border border-white/5 px-3 py-2">
                            <p className="text-xs text-gray-600 mb-1.5">
                              {new Date(match.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {match.time} · {match.city}
                            </p>
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5 text-sm text-white">
                                {home?.flag} {home?.code ?? match.homeTeam}
                              </span>
                              <span className="text-xs font-bold text-gray-600">vs</span>
                              <span className="flex items-center gap-1.5 text-sm text-white">
                                {away?.code ?? match.awayTeam} {away?.flag}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
