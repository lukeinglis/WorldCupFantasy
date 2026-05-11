import { NextResponse } from "next/server";
import { getAllUsersWithPicks, isKvConfigured } from "@/lib/storage";

// GET /api/participants - Get all participants with their picks (for leaderboard/picks display)
export async function GET() {
  try {
    if (!isKvConfigured()) {
      return NextResponse.json({ participants: [], kvConfigured: false });
    }

    const data = await getAllUsersWithPicks();

    const participants = data.map(({ user, picks }) => ({
      id: user.id,
      name: user.name,
      paymentConfirmed: user.paymentConfirmed,
      hasPicks: !!picks,
      picks: picks
        ? {
            groupPredictions: picks.groupPredictions,
            goldenBoot: picks.goldenBoot,
            mostGoalsTeam: picks.mostGoalsTeam,
            fewestConcededTeam: picks.fewestConcededTeam,
            goldenBall: picks.goldenBall,
            tiebreaker: picks.tiebreaker,
            submittedAt: picks.submittedAt,
          }
        : null,
    }));

    return NextResponse.json({ participants, kvConfigured: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch participants";
    console.error("Get participants error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
