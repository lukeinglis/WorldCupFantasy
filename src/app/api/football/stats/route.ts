import { NextResponse } from "next/server";
import { getTeamStats, isApiConfigured } from "@/lib/football-api";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? "unknown";
  const log = logger.child({ requestId, route: "GET /api/football/stats" });
  log.info("request start");

  if (!isApiConfigured()) {
    return NextResponse.json(
      { error: "API not configured", stats: null },
      { status: 503 }
    );
  }

  const stats = await getTeamStats();
  if (!stats) {
    return NextResponse.json(
      { error: "No group stage stats available yet", stats: null },
      { status: 200 }
    );
  }

  const sortedByGoals = [...stats].sort((a, b) => b.goalsScored - a.goalsScored);

  const withMatches = stats.filter((t) => t.matchesPlayed > 0);
  const sortedByConceded = [...withMatches].sort(
    (a, b) => a.goalsConceded - b.goalsConceded
  );

  log.info({ teamCount: stats.length }, "request complete");
  return NextResponse.json({
    stats,
    mostGoals: sortedByGoals[0] ?? null,
    fewestConceded: sortedByConceded[0] ?? null,
  });
}
