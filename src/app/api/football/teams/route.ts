import { NextResponse } from "next/server";
import { getTeams, isApiConfigured } from "@/lib/football-api";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? "unknown";
  const log = logger.child({ requestId, route: "GET /api/football/teams" });
  log.info("request start");

  if (!isApiConfigured()) {
    return NextResponse.json(
      { error: "API not configured", teams: null },
      { status: 503 }
    );
  }

  const teams = await getTeams();
  if (!teams) {
    log.warn("upstream returned no teams");
    return NextResponse.json(
      { error: "Failed to fetch teams", teams: null },
      { status: 502 }
    );
  }

  log.info({ count: teams.length }, "request complete");
  return NextResponse.json({ teams });
}
