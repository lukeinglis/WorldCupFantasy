import { NextResponse } from "next/server";
import { getAllUsersWithPicks, isKvConfigured } from "@/lib/storage";
import { TOURNAMENT_START, KNOCKOUT_START } from "@/lib/tournament-dates";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import logger from "@/lib/logger";

// GET /api/participants - Get all participants with their picks (for leaderboard/picks display)
export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? "unknown";
  const log = logger.child({ requestId, route: "GET /api/participants" });
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `participants:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  log.info("request start");
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
    log.info({ count: data.length }, "fetched participants");

    const participants = data.map(({ user, picks }) => {
      // Before tournament start, only show a user's own picks
      const isOwnPicks = requestingUserId === user.id;
      const showPicks = tier1Revealed || isOwnPicks;

      return {
        id: user.id,
        name: user.name,
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
    log.error({ err }, "failed to fetch participants");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
