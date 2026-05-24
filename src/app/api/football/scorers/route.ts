import { NextResponse } from "next/server";
import { getScorers, isApiConfigured } from "@/lib/football-api";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? "unknown";
  const log = logger.child({ requestId, route: "GET /api/football/scorers" });
  log.info("request start");

  if (!isApiConfigured()) {
    return NextResponse.json(
      { error: "API not configured", scorers: null },
      { status: 503 }
    );
  }

  const scorers = await getScorers();
  if (!scorers) {
    log.warn("upstream returned no scorers");
    return NextResponse.json(
      { error: "Failed to fetch scorers", scorers: null },
      { status: 502 }
    );
  }

  log.info({ count: scorers.length }, "request complete");
  return NextResponse.json({ scorers });
}
