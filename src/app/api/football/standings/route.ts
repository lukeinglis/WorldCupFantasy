import { NextResponse } from "next/server";
import { getStandings, isApiConfigured } from "@/lib/football-api";

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
    return NextResponse.json(
      { error: "Failed to fetch standings", standings: null },
      { status: 502 }
    );
  }

  return NextResponse.json({ standings });
}
