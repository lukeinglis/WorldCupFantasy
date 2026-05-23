import { NextResponse } from "next/server";
import { getStandings, isApiConfigured } from "@/lib/football-api";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isApiConfigured()) {
    return NextResponse.json(
      { error: "API not configured", standings: null },
      { status: 503 }
    );
  }

  const standings = await getStandings();
  if (!standings) {
    logger.error("failed to fetch standings from football API");
    return NextResponse.json(
      { error: "Failed to fetch standings", standings: null },
      { status: 502 }
    );
  }

  logger.info({ groups: standings.length }, "standings fetched");
  return NextResponse.json({ standings });
}
