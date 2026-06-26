import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getStandings, getMatches, computeStandingsFromMatches, isApiConfigured } from "@/lib/football-api";
import { getLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || "unknown";
  const log = getLogger("api/football/standings").child({ requestId });
  log.info("GET /api/football/standings");
  if (!isApiConfigured()) {
    return NextResponse.json(
      { error: "API not configured", standings: null },
      { status: 503 }
    );
  }

  let standings = await getStandings();

  if (!standings || standings.length === 0) {
    log.info("standings endpoint returned no data, computing from matches");
    const matches = await getMatches();
    if (matches) {
      standings = computeStandingsFromMatches(matches);
    }
  }

  if (!standings || standings.length === 0) {
    return NextResponse.json(
      { error: "Failed to fetch standings", standings: null },
      { status: 502 }
    );
  }

  return NextResponse.json({ standings });
}
