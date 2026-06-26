import { NextResponse } from "next/server";
import { getMatches, isApiConfigured } from "@/lib/football-api";
import { getLogger } from "@/lib/logger";
import { knockoutRoundMatchCounts } from "@/data/participants";

export const dynamic = "force-dynamic";

const KNOCKOUT_STAGES = ["round_of_32", "round_of_16", "quarter", "semi", "final"];

const STAGE_ORDER: Record<string, number> = {
  round_of_32: 0,
  round_of_16: 1,
  quarter: 2,
  semi: 3,
  final: 4,
};

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

  if (!isApiConfigured()) {
    return NextResponse.json(
      { error: "API not configured", matches: [] },
      { status: 503 }
    );
  }

  const allMatches = await getMatches();
  if (!allMatches) {
    return NextResponse.json(
      { error: "Failed to fetch matches", matches: [] },
      { status: 502 }
    );
  }

  const knockoutMatches = allMatches.filter((m) =>
    KNOCKOUT_STAGES.includes(m.stage)
  );

  knockoutMatches.sort((a, b) => {
    const stageA = STAGE_ORDER[a.stage] ?? 99;
    const stageB = STAGE_ORDER[b.stage] ?? 99;
    if (stageA !== stageB) return stageA - stageB;
    return new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime();
  });

  // Assign match numbers within each round
  const matchNumberByRound: Record<string, number> = {};
  const result: KnockoutMatchResponse[] = knockoutMatches.map((m) => {
    const round = m.stage;
    if (!matchNumberByRound[round]) matchNumberByRound[round] = 1;
    const matchNumber = matchNumberByRound[round]++;

    const hasTla = (tla: string) => tla && tla !== "TBD" && tla !== "???";

    return {
      round,
      matchNumber,
      homeTeam: hasTla(m.homeTeam.tla)
        ? { tla: m.homeTeam.tla, name: m.homeTeam.shortName || m.homeTeam.name }
        : null,
      awayTeam: hasTla(m.awayTeam.tla)
        ? { tla: m.awayTeam.tla, name: m.awayTeam.shortName || m.awayTeam.name }
        : null,
      utcDate: m.utcDate,
      status: m.status,
    };
  });

  // If no knockout matches exist from the API yet, generate placeholder structure
  if (result.length === 0) {
    for (const round of KNOCKOUT_STAGES) {
      const count = knockoutRoundMatchCounts[round] ?? 0;
      for (let i = 1; i <= count; i++) {
        result.push({
          round,
          matchNumber: i,
          homeTeam: null,
          awayTeam: null,
          utcDate: "",
          status: "TIMED",
        });
      }
    }
  }

  return NextResponse.json({ matches: result });
}
