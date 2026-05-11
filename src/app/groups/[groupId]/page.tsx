import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { getTeamsByGroup, groupLabels, type Team, getTeamByCode } from "@/data/teams";
import { participants, getGroupWinnerDistribution } from "@/data/participants";
import { schedule, parseLocalDate } from "@/data/schedule";
import { getStandings, getMatches, isApiConfigured } from "@/lib/football-api";
import type { TransformedGroupStandings, TransformedMatch } from "@/lib/football-api-types";

export function generateStaticParams() {
  return groupLabels.map((groupId) => ({ groupId }));
}

export async function generateMetadata({ params }: { params: Promise<{ groupId: string }> }): Promise<Metadata> {
  const { groupId } = await params;
  return {
    title: `Group ${groupId}`,
    description: `Teams, predictions, and matches for Group ${groupId} at the FIFA World Cup 2026.`,
  };
}

export const dynamic = "force-dynamic";

export default async function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const groupKey = groupId.toUpperCase();
  const teamsByGroup = getTeamsByGroup();
  const groupTeams = teamsByGroup[groupKey];

  if (!groupTeams) {
    notFound();
  }

  // Fetch live data
  let liveStandings: TransformedGroupStandings | null = null;
  let liveMatches: TransformedMatch[] = [];

  if (isApiConfigured()) {
    const [standings, matches] = await Promise.all([
      getStandings(),
      getMatches(),
    ]);

    if (standings) {
      liveStandings = standings.find((s) => s.group === groupKey) ?? null;
    }

    if (matches) {
      liveMatches = matches.filter(
        (m) => m.group === groupKey && m.stage === "group"
      );
    }
  }

  // Get group matches from static schedule (fallback)
  const staticGroupMatches = schedule.filter(
    (m) => m.group === groupKey && m.stage === "group"
  );

  // Winner distribution for this group
  const winnerDist = getGroupWinnerDistribution(groupKey);
  const winnerEntries = Object.entries(winnerDist).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader
        title={`Group ${groupKey}`}
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
                  .map((team: Team) => {
                    // Find live team data for crest
                    const liveTeam = liveStandings?.standings.find(
                      (s) => s.team.tla === team.code
                    );

                    return (
                      <Card key={team.code} hover>
                        <CardBody>
                          <div className="flex items-start gap-3">
                            {liveTeam?.team.crest ? (
                              <img
                                src={liveTeam.team.crest}
                                alt={team.name}
                                className="w-10 h-10 object-contain"
                              />
                            ) : (
                              <span className="text-4xl">{team.flag}</span>
                            )}
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
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
              </div>

              {/* Participant Predictions for this group */}
              <div className="mt-8">
                <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white mb-4">
                  Participant Predictions
                </h2>
                <Card>
                  <CardBody className="p-0">
                    {participants.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <span className="text-3xl block mb-2" aria-hidden>📋</span>
                        <p className="text-sm text-gray-400">No predictions submitted yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-left">
                                Player
                              </th>
                              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-accent text-center">
                                1st
                              </th>
                              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-accent text-center">
                                2nd
                              </th>
                              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 text-center">
                                3rd
                              </th>
                              <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-600 text-center">
                                4th
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {participants.map((p) => {
                              const gp = p.groupPredictions.find(g => g.group === groupKey);
                              if (!gp) return null;

                              return (
                                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base">{p.avatar}</span>
                                      <span className="text-sm text-gray-300">{p.name}</span>
                                    </div>
                                  </td>
                                  {gp.order.map((code, i) => {
                                    const team = getTeamByCode(code);
                                    const isAdvancing = i <= 1;
                                    return (
                                      <td
                                        key={`${p.id}-${i}`}
                                        className={`px-3 py-2.5 text-center ${isAdvancing ? "bg-pitch/5" : ""}`}
                                      >
                                        <span className="text-lg">{team?.flag}</span>
                                        <p className="text-xs text-gray-500 font-mono">{code}</p>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Group Standings */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-base font-bold uppercase tracking-wide text-white">
                      Standings
                    </h3>
                    {liveStandings && (
                      <span className="text-xs text-accent">Live</span>
                    )}
                  </div>
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
                        <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">GD</th>
                        <th className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveStandings
                        ? liveStandings.standings.map((entry, i) => {
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
                                <td className="px-4 py-2">
                                  <span className="flex items-center gap-1.5 text-sm">
                                    {entry.team.crest ? (
                                      <img
                                        src={entry.team.crest}
                                        alt={entry.team.name}
                                        className="w-4 h-4 object-contain"
                                      />
                                    ) : (
                                      <span>{staticTeam?.flag ?? "🏳️"}</span>
                                    )}
                                    <span className="text-white font-medium">
                                      {entry.team.tla}
                                    </span>
                                  </span>
                                </td>
                                <td className="px-2 py-2 text-center text-sm text-gray-500">
                                  {entry.played}
                                </td>
                                <td className="px-2 py-2 text-center text-sm text-gray-500">
                                  {entry.won}
                                </td>
                                <td className="px-2 py-2 text-center text-sm text-gray-500">
                                  {entry.draw}
                                </td>
                                <td className="px-2 py-2 text-center text-sm text-gray-500">
                                  {entry.lost}
                                </td>
                                <td className="px-2 py-2 text-center text-sm text-gray-500">
                                  {entry.goalDifference > 0
                                    ? `+${entry.goalDifference}`
                                    : entry.goalDifference}
                                </td>
                                <td className="px-2 py-2 text-center text-sm font-bold text-white">
                                  {entry.points}
                                </td>
                              </tr>
                            );
                          })
                        : groupTeams
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

              {/* Popular Picks for this group */}
              <Card>
                <CardHeader>
                  <h3 className="font-heading text-base font-bold uppercase tracking-wide text-white">
                    Popular Winner Picks
                  </h3>
                </CardHeader>
                <CardBody>
                  {participants.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-2">No picks submitted yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {winnerEntries.map(([code, count]) => {
                        const team = getTeamByCode(code);
                        if (!team) return null;
                        const pct = participants.length > 0 ? Math.round((count / participants.length) * 100) : 0;
                        return (
                          <div key={code} className="flex items-center gap-3">
                            <span className="text-lg">{team.flag}</span>
                            <span className="text-sm text-white flex-1">{team.name}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-navy-lighter overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-accent"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-8 text-right">{count}/{participants.length}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Group Matches (live or static) */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-base font-bold uppercase tracking-wide text-white">
                      Matches
                    </h3>
                    {liveMatches.length > 0 && (
                      <span className="text-xs text-accent">Live scores</span>
                    )}
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {liveMatches.length > 0
                      ? liveMatches.map((match) => {
                          const isLive = match.isLive;
                          const isFinished = match.status === "FINISHED";
                          const hasScore =
                            match.score.fullTime.home !== null &&
                            match.score.fullTime.away !== null;

                          return (
                            <div
                              key={match.id}
                              className={`rounded-lg border px-3 py-2 ${
                                isLive
                                  ? "bg-red-500/5 border-red-500/20"
                                  : "bg-navy-lighter/30 border-white/5"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <p className="text-xs text-gray-600 flex-1">
                                  {new Date(match.utcDate).toLocaleDateString(
                                    "en-US",
                                    { month: "short", day: "numeric" }
                                  )}{" "}
                                  ·{" "}
                                  {new Date(match.utcDate).toLocaleTimeString(
                                    "en-US",
                                    { hour: "numeric", minute: "2-digit" }
                                  )}
                                </p>
                                {isLive && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400 animate-pulse">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                                    LIVE
                                  </span>
                                )}
                                {isFinished && (
                                  <span className="text-xs text-gray-500 font-semibold">
                                    FT
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-1.5 text-sm text-white">
                                  {match.homeTeam.crest ? (
                                    <img
                                      src={match.homeTeam.crest}
                                      alt={match.homeTeam.shortName}
                                      className="w-4 h-4 object-contain"
                                    />
                                  ) : null}
                                  {match.homeTeam.tla}
                                </span>
                                {hasScore ? (
                                  <span
                                    className={`font-heading font-bold ${
                                      isLive ? "text-red-400" : "text-white"
                                    }`}
                                  >
                                    {match.score.fullTime.home} :{" "}
                                    {match.score.fullTime.away}
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-gray-600">
                                    vs
                                  </span>
                                )}
                                <span className="flex items-center gap-1.5 text-sm text-white">
                                  {match.awayTeam.tla}
                                  {match.awayTeam.crest ? (
                                    <img
                                      src={match.awayTeam.crest}
                                      alt={match.awayTeam.shortName}
                                      className="w-4 h-4 object-contain"
                                    />
                                  ) : null}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      : staticGroupMatches.map((match) => {
                          const home = groupTeams.find(
                            (t: Team) => t.code === match.homeTeam
                          );
                          const away = groupTeams.find(
                            (t: Team) => t.code === match.awayTeam
                          );
                          return (
                            <div
                              key={match.id}
                              className="rounded-lg bg-navy-lighter/30 border border-white/5 px-3 py-2"
                            >
                              <p className="text-xs text-gray-600 mb-1.5">
                                {parseLocalDate(match.date).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )}{" "}
                                · {match.time} · {match.city}
                              </p>
                              <div className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-1.5 text-sm text-white">
                                  {home?.flag} {home?.code ?? match.homeTeam}
                                </span>
                                <span className="text-xs font-bold text-gray-600">
                                  vs
                                </span>
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
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
