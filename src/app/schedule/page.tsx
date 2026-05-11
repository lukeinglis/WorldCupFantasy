import type { Metadata } from "next";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { schedule, venues, stageLabels, parseLocalDate } from "@/data/schedule";
import { getTeamByCode } from "@/data/teams";
import { getMatches, isApiConfigured } from "@/lib/football-api";
import type { TransformedMatch } from "@/lib/football-api-types";
import ScheduleClient from "./ScheduleClient";

export const metadata: Metadata = {
  title: "Schedule",
  description: "Match schedule and venues for the FIFA World Cup 2026.",
};

export const dynamic = "force-dynamic";

const stageOrder = [
  "group",
  "round_of_32",
  "round_of_16",
  "quarter",
  "semi",
  "third_place",
  "final",
] as const;

export default async function SchedulePage() {
  // Try to fetch live matches
  let liveMatches: TransformedMatch[] | null = null;
  if (isApiConfigured()) {
    liveMatches = await getMatches();
  }

  const hasLiveData = liveMatches !== null && liveMatches.length > 0;
  const hasAnyLive = liveMatches?.some((m) => m.isLive) ?? false;

  return (
    <>
      <PageHeader
        title="Schedule"
        subtitle="Key matches and venues across the United States, Mexico, and Canada."
        icon="📅"
      />

      <section className="py-10 sm:py-14">
        <Container>
          {hasLiveData && (
            <div className="mb-6 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-center">
              <p className="text-xs text-accent font-medium">
                {hasAnyLive
                  ? "Live scores updating. Refresh for latest."
                  : "Scores updated from football-data.org"}
              </p>
            </div>
          )}

          {/* If we have live matches data with any in-progress, render a client component for auto-refresh */}
          {hasAnyLive && <ScheduleClient />}

          {/* Match Schedule by Stage */}
          <div className="space-y-8">
            {hasLiveData
              ? // Render from live API data
                renderLiveSchedule(liveMatches!)
              : // Render from static data
                renderStaticSchedule()}
          </div>

          {/* Venues */}
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
        </Container>
      </section>
    </>
  );
}

function renderLiveSchedule(matches: TransformedMatch[]) {
  // Group matches by stage
  const matchesByStage: Record<string, TransformedMatch[]> = {};
  for (const m of matches) {
    const stage = m.stage;
    if (!matchesByStage[stage]) matchesByStage[stage] = [];
    matchesByStage[stage].push(m);
  }

  return stageOrder.map((stage) => {
    const stageMatches = matchesByStage[stage];
    if (!stageMatches || stageMatches.length === 0) return null;

    return (
      <Card key={stage}>
        <CardHeader>
          <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
            {stageLabels[stage] ?? stage}
          </h2>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-white/5">
            {stageMatches.map((match) => {
              const isLive = match.isLive;
              const isFinished = match.status === "FINISHED";
              const hasScore =
                match.score.fullTime.home !== null &&
                match.score.fullTime.away !== null;

              return (
                <div
                  key={match.id}
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 transition-colors ${
                    isLive
                      ? "bg-red-500/5 hover:bg-red-500/10"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  {/* Date, Time, Status */}
                  <div className="flex-shrink-0 sm:w-36 flex items-center gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-300">
                        {new Date(match.utcDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(match.utcDate).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {isLive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                        LIVE
                      </span>
                    )}
                    {isFinished && (
                      <span className="inline-flex items-center rounded-full bg-gray-500/20 px-2 py-0.5 text-xs font-semibold text-gray-400">
                        FT
                      </span>
                    )}
                  </div>

                  {/* Group badge */}
                  {match.group && (
                    <div className="flex-shrink-0 sm:w-12">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-pitch/20 text-accent text-xs font-bold">
                        {match.group}
                      </span>
                    </div>
                  )}

                  {/* Teams and Score */}
                  <div className="flex-1 flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                      <span className="text-sm font-medium text-white truncate">
                        {match.homeTeam.shortName}
                      </span>
                      {match.homeTeam.crest ? (
                        <img
                          src={match.homeTeam.crest}
                          alt={match.homeTeam.shortName}
                          className="w-6 h-6 object-contain"
                        />
                      ) : null}
                    </div>

                    {hasScore ? (
                      <span
                        className={`font-heading text-lg font-bold px-3 min-w-[60px] text-center ${
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
                      <span className="text-xs font-bold text-gray-600 px-3 min-w-[60px] text-center">
                        vs
                      </span>
                    )}

                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {match.awayTeam.crest ? (
                        <img
                          src={match.awayTeam.crest}
                          alt={match.awayTeam.shortName}
                          className="w-6 h-6 object-contain"
                        />
                      ) : null}
                      <span className="text-sm font-medium text-white truncate">
                        {match.awayTeam.shortName}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    );
  });
}

function renderStaticSchedule() {
  const stages = stageOrder;

  const matchesByStage: Record<string, typeof schedule> = {};
  for (const stage of stages) {
    matchesByStage[stage] = schedule.filter((m) => m.stage === stage);
  }

  return stages.map((stage) => {
    const matches = matchesByStage[stage];
    if (!matches || matches.length === 0) return null;

    return (
      <Card key={stage}>
        <CardHeader>
          <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-white">
            {stageLabels[stage]}
          </h2>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-white/5">
            {matches.map((match) => {
              const homeTeam = getTeamByCode(match.homeTeam);
              const awayTeam = getTeamByCode(match.awayTeam);
              const isTBD = match.homeTeam === "TBD";

              return (
                <div
                  key={match.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Date & Time */}
                  <div className="flex-shrink-0 sm:w-32">
                    <p className="text-sm font-medium text-gray-300">
                      {parseLocalDate(match.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-gray-500">{match.time} ET</p>
                  </div>

                  {/* Teams */}
                  <div className="flex-1 flex items-center justify-center gap-4">
                    {isTBD ? (
                      <span className="text-sm text-gray-500 italic">
                        To be determined
                      </span>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                          <span className="text-sm font-medium text-white truncate">
                            {homeTeam?.name ?? match.homeTeam}
                          </span>
                          <span className="text-lg">{homeTeam?.flag}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-600 px-2">
                          vs
                        </span>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-lg">{awayTeam?.flag}</span>
                          <span className="text-sm font-medium text-white truncate">
                            {awayTeam?.name ?? match.awayTeam}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Venue */}
                  <div className="flex-shrink-0 text-right sm:w-48">
                    <p className="text-xs text-gray-400">{match.venue}</p>
                    <p className="text-xs text-gray-600">{match.city}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    );
  });
}
