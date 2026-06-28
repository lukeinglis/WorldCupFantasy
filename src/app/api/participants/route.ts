import { NextResponse } from "next/server";
import { getAllUsersWithPicks, getPicks, isKvConfigured } from "@/lib/storage";
import { getLogger } from "@/lib/logger";

const TOURNAMENT_START = new Date("2026-06-11T19:00:00Z");

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") || "unknown";
  const log = getLogger("api/participants").child({ requestId });
  log.info("GET /api/participants");
  try {
    if (!isKvConfigured()) {
      return NextResponse.json({ participants: [], kvConfigured: false });
    }

    const { searchParams } = new URL(request.url);
    const requestingUserId = searchParams.get("userId");

    const now = new Date();
    const tier1Revealed = now >= TOURNAMENT_START;

    const data = await getAllUsersWithPicks();

    // Check if the requesting user has submitted Tier 2 picks
    let requesterHasTier2 = false;
    if (requestingUserId) {
      const requesterPicks = await getPicks(requestingUserId);
      requesterHasTier2 = !!requesterPicks?.tier2Submitted;
    }

    const participants = data.map(({ user, picks }) => {
      const isOwnPicks = requestingUserId === user.id;
      const showPicks = tier1Revealed || isOwnPicks;
      const showKnockout = requesterHasTier2 || isOwnPicks;

      return {
        id: user.id,
        name: user.name,
        hasPicks: !!picks,
        hasTier2: !!picks?.tier2Submitted,
        picks: picks && showPicks
          ? {
              groupPredictions: picks.groupPredictions,
              goldenBoot: picks.goldenBoot,
              mostGoalsTeam: picks.mostGoalsTeam,
              fewestConcededTeam: picks.fewestConcededTeam,
              goldenBall: showKnockout ? picks.goldenBall : "",
              tiebreaker: picks.tiebreaker,
              submittedAt: picks.submittedAt,
              knockoutPicks: showKnockout ? (picks.knockoutPicks ?? []) : [],
              tier2Submitted: picks.tier2Submitted ?? false,
            }
          : null,
      };
    });

    return NextResponse.json({ participants, kvConfigured: true, requesterHasTier2 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch participants";
    log.error({ err: message }, "Get participants error");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
