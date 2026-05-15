import { NextResponse } from "next/server";
import { getAllUsersWithPicks, isKvConfigured } from "@/lib/storage";

// Tournament start: picks are hidden until the first match kicks off
const TOURNAMENT_START = new Date("2026-06-11T19:00:00Z");
const KNOCKOUT_START = new Date("2026-06-28T19:00:00Z");

// GET /api/participants - Get all participants with their picks (for leaderboard/picks display)
export async function GET(request: Request) {
  try {
    if (!isKvConfigured()) {
      return NextResponse.json({ participants: [], kvConfigured: false });
    }

    const { searchParams } = new URL(request.url);
    const requestingUserId = searchParams.get("userId");

    const now = new Date();
    const tier1Revealed = now >= TOURNAMENT_START;
    const tier2Revealed = now >= KNOCKOUT_START;

    const data = await getAllUsersWithPicks();

    const participants = data.map(({ user, picks }) => {
      // Before tournament start, only show a user's own picks
      const isOwnPicks = requestingUserId === user.id;
      const showPicks = tier1Revealed || isOwnPicks;

      return {
        id: user.id,
        name: user.name,
        paymentConfirmed: user.paymentConfirmed,
        hasPicks: !!picks,
        picks: picks && showPicks
          ? {
              groupPredictions: picks.groupPredictions,
              goldenBoot: picks.goldenBoot,
              mostGoalsTeam: picks.mostGoalsTeam,
              fewestConcededTeam: picks.fewestConcededTeam,
              goldenBall: tier2Revealed ? picks.goldenBall : "",
              tiebreaker: picks.tiebreaker,
              submittedAt: picks.submittedAt,
            }
          : null,
      };
    });

    return NextResponse.json({ participants, kvConfigured: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch participants";
    console.error("Get participants error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
