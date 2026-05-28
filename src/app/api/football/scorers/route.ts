import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getScorers, isApiConfigured } from "@/lib/football-api";
import { getLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || "unknown";
  const log = getLogger("api/football/scorers").child({ requestId });
  log.info("GET /api/football/scorers");
  if (!isApiConfigured()) {
    return NextResponse.json(
      { error: "API not configured", scorers: null },
      { status: 503 }
    );
  }

  const scorers = await getScorers();
  if (!scorers) {
    return NextResponse.json(
      { error: "Failed to fetch scorers", scorers: null },
      { status: 502 }
    );
  }

  return NextResponse.json({ scorers });
}
