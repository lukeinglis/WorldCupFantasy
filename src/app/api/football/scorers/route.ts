import { NextResponse } from "next/server";
import { getScorers, isApiConfigured } from "@/lib/football-api";

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
    return NextResponse.json(
      { error: "Failed to fetch scorers", scorers: null },
      { status: 502 }
    );
  }

  return NextResponse.json({ scorers });
}
