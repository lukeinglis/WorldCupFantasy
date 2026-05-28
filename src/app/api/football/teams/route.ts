import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getTeams, isApiConfigured } from "@/lib/football-api";
import { getLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || "unknown";
  const log = getLogger("api/football/teams").child({ requestId });
  log.info("GET /api/football/teams");
  if (!isApiConfigured()) {
    return NextResponse.json(
      { error: "API not configured", teams: null },
      { status: 503 }
    );
  }

  const teams = await getTeams();
  if (!teams) {
    return NextResponse.json(
      { error: "Failed to fetch teams", teams: null },
      { status: 502 }
    );
  }

  return NextResponse.json({ teams });
}
