import { NextResponse } from "next/server";
import { getTeams, isApiConfigured } from "@/lib/football-api";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isApiConfigured()) {
    return NextResponse.json(
      { error: "API not configured", teams: null },
      { status: 503 }
    );
  }

  const teams = await getTeams();
  if (!teams) {
    logger.error("failed to fetch teams from football API");
    return NextResponse.json(
      { error: "Failed to fetch teams", teams: null },
      { status: 502 }
    );
  }

  logger.info({ count: teams.length }, "teams fetched");
  return NextResponse.json({ teams });
}
