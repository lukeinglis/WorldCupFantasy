import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getTeamStats, isApiConfigured } from "@/lib/football-api";
import { getLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || "unknown";
  const log = getLogger("api/football/stats").child({ requestId });
  log.info("GET /api/football/stats");
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

  // Sort by goals scored descending for "most goals" queries
  const sortedByGoals = [...stats].sort((a, b) => b.goalsScored - a.goalsScored);

  // Find team with fewest goals conceded (among teams that have played)
  const withMatches = stats.filter((t) => t.matchesPlayed > 0);
  const sortedByConceded = [...withMatches].sort(
    (a, b) => a.goalsConceded - b.goalsConceded
  );

  return NextResponse.json({
    stats,
    mostGoals: sortedByGoals[0] ?? null,
    fewestConceded: sortedByConceded[0] ?? null,
  });
}
