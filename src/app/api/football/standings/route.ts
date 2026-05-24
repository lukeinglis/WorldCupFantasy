import { NextResponse } from "next/server";
import { getStandings, isApiConfigured } from "@/lib/football-api";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? "unknown";
  const log = logger.child({ requestId, route: "GET /api/football/standings" });
  log.info("request start");

  if (!isApiConfigured()) {
    return NextResponse.json(
      { error: "API not configured", standings: null },
      { status: 503 }
    );
  }

  const standings = await getStandings();
  if (!standings) {
    log.warn("upstream returned no standings");
    return NextResponse.json(
      { error: "Failed to fetch standings", standings: null },
      { status: 502 }
    );
  }

  log.info({ groups: standings.length }, "request complete");
  return NextResponse.json({ standings });
}
