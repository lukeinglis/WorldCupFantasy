import { NextResponse } from "next/server";
import { getUserById, getAllUsersWithPicks, isKvConfigured } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import { buildParticipantsFromKv } from "@/lib/build-participants";
import { isApiConfigured } from "@/lib/football-api";
import {
  getLiveGroupResults,
  getLiveBonusResults,
  getLiveTournamentStatus,
} from "@/lib/live-scoring";
import {
  calculateAllPoints,
  setActualGroupResults,
  setActualBonusResults,
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

  let groupResults = null;
  let bonusResults = null;
  let tournamentStatus = null;

  if (apiConfigured) {
    [groupResults, bonusResults, tournamentStatus] = await Promise.all([
      getLiveGroupResults(),
      getLiveBonusResults(),
      getLiveTournamentStatus(),
    ]);
  }

  let scoredParticipants = null;
  if (kvConfigured) {
    const kvData = await getAllUsersWithPicks();
    const participants = buildParticipantsFromKv(kvData);

    if (groupResults) setActualGroupResults(groupResults.groups);
    if (bonusResults) setActualBonusResults(bonusResults);

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
      mostGoalsTeamActual: bonusResults?.mostGoalsTeam ?? null,
      fewestConcededTeamPick: p.bonusPicks.fewestConcededTeam,
      fewestConcededTeamActual: bonusResults?.fewestConcededTeam ?? null,
      points: p.calculatedPoints,
    }));
  }

  return NextResponse.json({
    apiConfigured,
    kvConfigured,
    groupResults,
    bonusResults,
    tournamentStatus,
    scoredParticipants,
  });
}
