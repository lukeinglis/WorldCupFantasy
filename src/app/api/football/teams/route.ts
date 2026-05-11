import { NextResponse } from "next/server";
import { getTeams, isApiConfigured } from "@/lib/football-api";

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
    return NextResponse.json(
      { error: "Failed to fetch teams", teams: null },
      { status: 502 }
    );
  }

  return NextResponse.json({ teams });
}
