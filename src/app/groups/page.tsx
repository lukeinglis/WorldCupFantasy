import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { getTeamsByGroup, getTeamByCode, groupLabels, type Team } from "@/data/teams";
import { getStandings, getMatches, isApiConfigured } from "@/lib/football-api";
import { CREST_BLUR_PLACEHOLDER } from "@/lib/image-constants";
import { schedule, venues, stageLabels, parseLocalDate } from "@/data/schedule";
import { R32_MATCHES } from "@/data/knockout-bracket";
import type { TransformedGroupStandings, TransformedMatch } from "@/lib/football-api-types";
import GroupsPageTabs from "@/components/GroupsPageTabs";
import PicksTabContent from "@/components/groups/PicksTabContent";
import KnockoutTabContent from "@/components/groups/KnockoutTabContent";

export const metadata: Metadata = {
  title: "Groups",
  description: "All 12 groups for the FIFA World Cup 2026 with standings, picks, schedule, and knockout bracket.",
};

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const teamsByGroup = getTeamsByGroup();

  let liveStandings: TransformedGroupStandings[] | null = null;
  let liveMatches: TransformedMatch[] | null = null;

  if (isApiConfigured()) {
    [liveStandings, liveMatches] = await Promise.all([
      getStandings(),
      getMatches(),
    ]);
  }

  // Patch R32 matches with hardcoded team data where the API returns TBD
  if (liveMatches) {
    const r32ByDate = new Map<string, typeof R32_MATCHES[number]>();
    for (const hm of R32_MATCHES) {
      r32ByDate.set(hm.utcDate, hm);
    }
    for (const m of liveMatches) {
      if (m.stage !== "round_of_32") continue;
      const hardcoded = r32ByDate.get(m.utcDate);
      if (!hardcoded) continue;
      const isTbd = (name: string) => !name || name === "TBD" || name === "???";
      if (isTbd(m.homeTeam.tla) && hardcoded.homeTeam) {
        const team = getTeamByCode(hardcoded.homeTeam);
        if (team) {
          m.homeTeam = { ...m.homeTeam, tla: team.code, name: team.name, shortName: team.name };
        }
      }
      if (isTbd(m.awayTeam.tla) && hardcoded.awayTeam) {
        const team = getTeamByCode(hardcoded.awayTeam);
        if (team) {
          m.awayTeam = { ...m.awayTeam, tla: team.code, name: team.name, shortName: team.name };
        }
      }
    }
  }

  const standingsMap = new Map<string, TransformedGroupStandings>();
  if (liveStandings) {
    for (const gs of liveStandings) {
      standingsMap.set(gs.group, gs);
    }
  }

  const standingsContent = (
    <>
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
                                      <Image
                                        src={entry.team.crest}
                                        alt={entry.team.name}
                                        width={20}
                                        height={20}
                                        className="w-5 h-5 object-contain"
                                        placeholder="blur"
                                        blurDataURL={CREST_BLUR_PLACEHOLDER}
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
    </>
  );

  const hasLiveData = liveMatches !== null && liveMatches.length > 0;

  const scheduleContent = (
    <>
      {hasLiveData && (
        <div className="mb-6 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-center">
          <p className="text-xs text-accent font-medium">
            Scores updated from football-data.org
          </p>
        </div>
      )}
      <div className="space-y-8">
        {hasLiveData
          ? renderLiveSchedule(liveMatches!)
          : renderStaticSchedule()}
      </div>
      <div className="mt-14">
        <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-white mb-6">
          Venues
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <Card key={venue.name} hover>
              <CardBody>
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden>
                    {venue.country === "USA"
                      ? "🇺🇸"
                      : venue.country === "Mexico"
                      ? "🇲🇽"
                      : "🇨🇦"}
                  </span>
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      {venue.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {venue.city}, {venue.country}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Capacity: {venue.capacity.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      <PageHeader
        title="World Cup Groups"
        subtitle="48 teams across 12 groups. Standings, picks, schedule, and knockout bracket."
        icon="🏟️"
      />

      <section className="py-10 sm:py-14">
        <Container>
          <GroupsPageTabs
            standingsContent={standingsContent}
            picksContent={<PicksTabContent />}
            scheduleContent={scheduleContent}
            knockoutContent={<KnockoutTabContent />}
          />
        </Container>
      </section>
    </>
  );
}

function renderLiveMatchCard(match: TransformedMatch) {
  const isLive = match.isLive;
  const isFinished = match.status === "FINISHED";
  const hasScore =
    match.score.fullTime.home !== null &&
    match.score.fullTime.away !== null;
  const stageLabel = match.group
    ? null
    : stageLabels[match.stage] ?? match.stage;

  return (
    <Card key={match.id}>
      <CardBody className="px-3 py-2.5">
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-xs text-gray-500">
            {new Date(match.utcDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
            {" · "}
            {new Date(match.utcDate).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
          {match.group && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pitch/20 text-accent text-[10px] font-bold">
              {match.group}
            </span>
          )}
          {stageLabel && (
            <span className="text-[10px] font-semibold text-gold/70 uppercase">
              {stageLabel}
            </span>
          )}
          {isLive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400 animate-pulse ml-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              LIVE
            </span>
          )}
          {isFinished && (
            <span className="inline-flex items-center rounded-full bg-gray-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 ml-auto">
              FT
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {match.homeTeam.crest ? (
              <Image
                src={match.homeTeam.crest}
                alt={match.homeTeam.shortName}
                width={20}
                height={20}
                className="w-5 h-5 object-contain flex-shrink-0"
                placeholder="blur"
                blurDataURL={CREST_BLUR_PLACEHOLDER}
              />
            ) : null}
            <span className="text-sm font-medium text-white truncate">
              {match.homeTeam.shortName}
            </span>
          </div>
          {hasScore ? (
            <span
              className={`font-heading text-sm font-bold px-2 min-w-[48px] text-center flex-shrink-0 ${
                isLive
                  ? "text-red-400"
                  : isFinished
                  ? "text-white"
                  : "text-gray-400"
              }`}
            >
              {match.score.fullTime.home} : {match.score.fullTime.away}
            </span>
          ) : (
            <span className="text-xs font-bold text-gray-600 px-2 min-w-[48px] text-center flex-shrink-0">
              vs
            </span>
          )}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
            <span className="text-sm font-medium text-white truncate">
              {match.awayTeam.shortName}
            </span>
            {match.awayTeam.crest ? (
              <Image
                src={match.awayTeam.crest}
                alt={match.awayTeam.shortName}
                width={20}
                height={20}
                className="w-5 h-5 object-contain flex-shrink-0"
                placeholder="blur"
                blurDataURL={CREST_BLUR_PLACEHOLDER}
              />
            ) : null}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function renderLiveSchedule(matches: TransformedMatch[]) {
  const live = matches.filter((m) => m.isLive);
  const played = matches
    .filter((m) => m.status === "FINISHED")
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime());
  const upcoming = matches
    .filter((m) => m.status !== "FINISHED" && !m.isLive)
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-accent mb-4">
          Results
        </h3>
        <div className="overflow-y-auto max-h-[600px] space-y-2 pr-1">
          {played.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 text-center">No results yet</p>
          ) : (
            played.map((match) => renderLiveMatchCard(match))
          )}
        </div>
      </div>
      <div>
        <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-gold mb-4">
          Upcoming
        </h3>
        <div className="overflow-y-auto max-h-[600px] space-y-2 pr-1">
          {live.map((match) => renderLiveMatchCard(match))}
          {upcoming.length === 0 && live.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 text-center">No upcoming matches</p>
          ) : (
            upcoming.map((match) => renderLiveMatchCard(match))
          )}
        </div>
      </div>
    </div>
  );
}

function renderStaticSchedule() {
  const now = new Date();

  const played = schedule
    .filter((m) => parseLocalDate(m.date) < now)
    .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
  const upcoming = schedule
    .filter((m) => parseLocalDate(m.date) >= now)
    .sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());

  function renderStaticMatchCard(match: (typeof schedule)[number]) {
    const homeTeam = getTeamByCode(match.homeTeam);
    const awayTeam = getTeamByCode(match.awayTeam);
    const isTBD = match.homeTeam === "TBD";
    const stageLabel = match.group
      ? null
      : stageLabels[match.stage] ?? match.stage;

    return (
      <Card key={match.id}>
        <CardBody className="px-3 py-2.5">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-xs text-gray-500">
              {parseLocalDate(match.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
              {" · "}
              {match.time} ET
            </p>
            {match.group && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pitch/20 text-accent text-[10px] font-bold">
                {match.group}
              </span>
            )}
            {stageLabel && (
              <span className="text-[10px] font-semibold text-gold/70 uppercase">
                {stageLabel}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            {isTBD ? (
              <span className="text-sm text-gray-500 italic w-full text-center">
                To be determined
              </span>
            ) : (
              <>
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-base flex-shrink-0">{homeTeam?.flag}</span>
                  <span className="text-sm font-medium text-white truncate">
                    {homeTeam?.name ?? match.homeTeam}
                  </span>
                </div>
                <span className="text-xs font-bold text-gray-600 px-2 min-w-[48px] text-center flex-shrink-0">
                  vs
                </span>
                <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                  <span className="text-sm font-medium text-white truncate">
                    {awayTeam?.name ?? match.awayTeam}
                  </span>
                  <span className="text-base flex-shrink-0">{awayTeam?.flag}</span>
                </div>
              </>
            )}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-accent mb-4">
          Results
        </h3>
        <div className="overflow-y-auto max-h-[600px] space-y-2 pr-1">
          {played.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 text-center">No results yet</p>
          ) : (
            played.map((match) => renderStaticMatchCard(match))
          )}
        </div>
      </div>
      <div>
        <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-gold mb-4">
          Upcoming
        </h3>
        <div className="overflow-y-auto max-h-[600px] space-y-2 pr-1">
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 text-center">No upcoming matches</p>
          ) : (
            upcoming.map((match) => renderStaticMatchCard(match))
          )}
        </div>
      </div>
    </div>
  );
}
