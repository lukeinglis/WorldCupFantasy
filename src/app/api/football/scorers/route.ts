import { NextResponse } from "next/server";
import { getScorers, isApiConfigured } from "@/lib/football-api";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isApiConfigured()) {
    return NextResponse.json(
      { error: "API not configured", scorers: null },
      { status: 503 }
    );
  }

  const scorers = await getScorers();
  if (!scorers) {
    logger.error("failed to fetch scorers from football API");
    return NextResponse.json(
      { error: "Failed to fetch scorers", scorers: null },
      { status: 502 }
    );
  }

  logger.info({ count: scorers.length }, "scorers fetched");
  return NextResponse.json({ scorers });
}
