import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { getMatches, isApiConfigured } from "@/lib/football-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isApiConfigured()) {
    return NextResponse.json(
      { error: "API not configured", matches: null },
      { status: 503 }
    );
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? undefined;

  const matches = await getMatches(status);
  if (!matches) {
    return NextResponse.json(
      { error: "Failed to fetch matches", matches: null },
      { status: 502 }
    );
  }

  return NextResponse.json({ matches });
}
