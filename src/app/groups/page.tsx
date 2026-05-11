import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { getTeamsByGroup, groupLabels, type Team } from "@/data/teams";
import { getStandings, isApiConfigured } from "@/lib/football-api";
import type { TransformedGroupStandings } from "@/lib/football-api-types";

export const metadata: Metadata = {
  title: "Groups",
  description: "All 12 groups for the FIFA World Cup 2026 with team details.",
};

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const teamsByGroup = getTeamsByGroup();

  // Fetch live standings from API (null if unavailable)
  let liveStandings: TransformedGroupStandings[] | null = null;
  if (isApiConfigured()) {
    liveStandings = await getStandings();
  }

  // Build a lookup: group letter => standings data
  const standingsMap = new Map<string, TransformedGroupStandings>();
  if (liveStandings) {
    for (const gs of liveStandings) {
      standingsMap.set(gs.group, gs);
    }
  }

  return (
    <>
      <PageHeader
        title="World Cup Groups"
        subtitle="48 teams across 12 groups. Top 2 from each group plus the 8 best third-placed teams advance."
        icon="🏟️"
      />

      <section className="py-10 sm:py-14">
        <Container>
          {liveStandings && (
            <div className="mb-6 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-center">
              <p className="text-xs text-accent font-medium">
                Standings updated live from football-data.org
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groupLabels.map((groupId) => {
              const groupTeams = teamsByGroup[groupId] ?? [];
              const liveGroup = standingsMap.get(groupId);

              return (
                <Link key={groupId} href={`/groups/${groupId}`}>
                  <Card hover className="h-full">
                    <CardHeader>
                      <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
                        Group {groupId}
                      </h2>
                    </CardHeader>
                    <CardBody className="p-0">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10 text-left">
                            <th className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Team</th>
                            {liveGroup ? (
                              <>
                                <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">P</th>
                                <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">W</th>
                                <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">D</th>
                                <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">L</th>
                                <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">GD</th>
                                <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Pts</th>
                              </>
                            ) : (
                              <>
                                <th className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">FIFA Rank</th>
                                <th className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Conf.</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {liveGroup
                            ? liveGroup.standings.map((entry, i) => {
                                // Find the static team data for the flag/extra info
                                const staticTeam = groupTeams.find(
                                  (t) => t.code === entry.team.tla
                                );
                                return (
                                  <tr
                                    key={entry.team.tla}
                                    className={`border-b border-white/5 last:border-b-0 ${
                                      i < 2 ? "bg-pitch/5" : ""
                                    }`}
                                  >
                                    <td className="px-5 py-3">
                                      <div className="flex items-center gap-2">
                                        {entry.team.crest ? (
                                          <img
                                            src={entry.team.crest}
                                            alt={entry.team.name}
                                            className="w-5 h-5 object-contain"
                                          />
                                        ) : (
                                          <span className="text-lg">
                                            {staticTeam?.flag ?? "🏳️"}
                                          </span>
                                        )}
                                        <span className="text-sm font-medium text-white">
                                          {entry.team.shortName}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-2 py-3 text-center text-sm text-gray-400">
                                      {entry.played}
                                    </td>
                                    <td className="px-2 py-3 text-center text-sm text-gray-400">
                                      {entry.won}
                                    </td>
                                    <td className="px-2 py-3 text-center text-sm text-gray-400">
                                      {entry.draw}
                                    </td>
                                    <td className="px-2 py-3 text-center text-sm text-gray-400">
                                      {entry.lost}
                                    </td>
                                    <td className="px-2 py-3 text-center text-sm text-gray-400">
                                      {entry.goalDifference > 0
                                        ? `+${entry.goalDifference}`
                                        : entry.goalDifference}
                                    </td>
                                    <td className="px-2 py-3 text-center text-sm font-bold text-white">
                                      {entry.points}
                                    </td>
                                  </tr>
                                );
                              })
                            : groupTeams
                                .sort(
                                  (a: Team, b: Team) =>
                                    a.fifaRanking - b.fifaRanking
                                )
                                .map((team: Team) => (
                                  <tr
                                    key={team.code}
                                    className="border-b border-white/5 last:border-b-0"
                                  >
                                    <td className="px-5 py-3">
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">
                                          {team.flag}
                                        </span>
                                        <span className="text-sm font-medium text-white">
                                          {team.name}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                      <span className="text-sm text-gray-400">
                                        #{team.fifaRanking}
                                      </span>
                                    </td>
                                    <td className="px-5 py-3 text-right">
                                      <span className="text-xs text-gray-500 font-mono">
                                        {team.confederation}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                        </tbody>
                      </table>
                    </CardBody>
                  </Card>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>
    </>
  );
}
