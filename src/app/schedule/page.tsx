import type { Metadata } from "next";
import Container from "@/components/Container";
import PageHeader from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { schedule, venues, stageLabels, parseLocalDate } from "@/data/schedule";
import { getTeamByCode } from "@/data/teams";

export const metadata: Metadata = {
  title: "Schedule",
  description: "Match schedule and venues for the FIFA World Cup 2026.",
};

export default function SchedulePage() {
  // Group matches by stage
  const stages = ["group", "round_of_32", "round_of_16", "quarter", "semi", "third_place", "final"] as const;

  const matchesByStage: Record<string, typeof schedule> = {};
  for (const stage of stages) {
    matchesByStage[stage] = schedule.filter((m) => m.stage === stage);
  }

  return (
    <>
      <PageHeader
        title="Schedule"
        subtitle="Key matches and venues across the United States, Mexico, and Canada."
        icon="📅"
      />

      <section className="py-10 sm:py-14">
        <Container>
          {/* Match Schedule by Stage */}
          <div className="space-y-8">
            {stages.map((stage) => {
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
                                  <span className="text-xs font-bold text-gray-600 px-2">vs</span>
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
            })}
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
                        {venue.country === "USA" ? "🇺🇸" : venue.country === "Mexico" ? "🇲🇽" : "🇨🇦"}
                      </span>
                      <div>
                        <h3 className="text-sm font-medium text-white">{venue.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{venue.city}, {venue.country}</p>
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
