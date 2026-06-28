import { NextResponse } from "next/server";
import { getUserById, getAllUsersWithPicks, isKvConfigured } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import { buildParticipantsFromKv } from "@/lib/build-participants";
import { isApiConfigured } from "@/lib/football-api";
import {
  getLiveBonusResults,
  getLiveKnockoutResults,
  getLiveTournamentStatus,
} from "@/lib/live-scoring";
import {
  calculateAllPoints,
  setActualBonusResults,
  setActualKnockoutResults,
  actualGroupResults,
  fuzzyPlayerMatch,
} from "@/data/scoring";
import { getLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") || "unknown";
  const log = getLogger("api/admin/scoring-debug").child({ requestId });
  log.info("GET /api/admin/scoring-debug");

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const requestingUser = await getUserById(userId);
  if (!requestingUser || !isAdmin(requestingUser.email)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const apiConfigured = isApiConfigured();
  const kvConfigured = isKvConfigured();

  let bonusResults = null;
  let knockoutResults = null;
  let tournamentStatus = null;

  if (apiConfigured) {
    [bonusResults, knockoutResults, tournamentStatus] = await Promise.all([
      getLiveBonusResults(),
      getLiveKnockoutResults(),
      getLiveTournamentStatus(),
    ]);
  }

  let scoredParticipants = null;
  if (kvConfigured) {
    const kvData = await getAllUsersWithPicks();
    const participants = buildParticipantsFromKv(kvData);

    if (bonusResults) setActualBonusResults({ goldenBoot: bonusResults.goldenBoot });
    if (knockoutResults) setActualKnockoutResults(knockoutResults.results);

    const withPoints = calculateAllPoints(participants);

    scoredParticipants = withPoints.map((p) => ({
      id: p.id,
      name: p.name,
      goldenBootPick: p.bonusPicks.goldenBoot,
      goldenBootActual: bonusResults?.goldenBoot ?? null,
      goldenBootMatch: bonusResults?.goldenBoot
        ? fuzzyPlayerMatch(p.bonusPicks.goldenBoot, bonusResults.goldenBoot)
        : null,
      mostGoalsTeamPick: p.bonusPicks.mostGoalsTeam,
      fewestConcededTeamPick: p.bonusPicks.fewestConcededTeam,
      points: p.calculatedPoints,
    }));
  }

  return NextResponse.json({
    apiConfigured,
    kvConfigured,
    groupResults: actualGroupResults,
    bonusResults,
    knockoutResults,
    tournamentStatus,
    scoredParticipants,
  });
}
