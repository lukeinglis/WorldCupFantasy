import { NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { getAllKnockoutMatches } from "@/data/knockout-bracket";
import { getTeamByCode } from "@/data/teams";
import { getLiveKnockoutResults } from "@/lib/live-scoring";
import { actualKnockoutResults, setActualKnockoutResults } from "@/data/scoring";

export const dynamic = "force-dynamic";

export interface KnockoutMatchResponse {
  round: string;
  matchNumber: number;
  homeTeam: { tla: string; name: string } | null;
  awayTeam: { tla: string; name: string } | null;
  utcDate: string;
  status: string;
}

export async function GET() {
  const log = getLogger("api/knockout-matches");
  log.info("GET /api/knockout-matches");

  const allMatches = getAllKnockoutMatches();

  const result: KnockoutMatchResponse[] = allMatches.map((m) => ({
    round: m.round,
    matchNumber: m.matchNumber,
    homeTeam: m.homeTeam
      ? { tla: m.homeTeam, name: getTeamByCode(m.homeTeam)?.name ?? m.homeTeam }
      : null,
    awayTeam: m.awayTeam
      ? { tla: m.awayTeam, name: getTeamByCode(m.awayTeam)?.name ?? m.awayTeam }
      : null,
    utcDate: m.utcDate,
    status: m.status,
  }));

  const liveResults = await getLiveKnockoutResults();
  if (liveResults) setActualKnockoutResults(liveResults.results);
  const results = actualKnockoutResults ?? {};

  return NextResponse.json({ matches: result, results });
}
