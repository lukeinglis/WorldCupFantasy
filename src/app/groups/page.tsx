import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { getTeamsByGroup, groupLabels } from "@/data/teams";

export const metadata: Metadata = {
  title: "Groups",
  description: "All 12 groups for the FIFA World Cup 2026 with team details.",
};

export default function GroupsPage() {
  const teamsByGroup = getTeamsByGroup();

  return (
    <>
      <PageHeader
        title="World Cup Groups"
        subtitle="48 teams across 12 groups. Top 2 from each group plus the 8 best third-placed teams advance."
        icon="🏟️"
      />

      <section className="py-10 sm:py-14">
        <Container>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {groupLabels.map((groupId) => {
              const groupTeams = teamsByGroup[groupId] ?? [];
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
                            <th className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">FIFA Rank</th>
                            <th className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Conf.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupTeams
                            .sort((a, b) => a.fifaRanking - b.fifaRanking)
                            .map((team) => (
                              <tr key={team.code} className="border-b border-white/5 last:border-b-0">
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{team.flag}</span>
                                    <span className="text-sm font-medium text-white">{team.name}</span>
                                  </div>
                                </td>
                                <td className="px-5 py-3 text-center">
                                  <span className="text-sm text-gray-400">#{team.fifaRanking}</span>
                                </td>
                                <td className="px-5 py-3 text-right">
                                  <span className="text-xs text-gray-500 font-mono">{team.confederation}</span>
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
