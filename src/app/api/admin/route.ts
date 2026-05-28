import { NextResponse } from "next/server";
import { getAllUsersWithPicks, getUserById, isKvConfigured } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import { getLogger } from "@/lib/logger";

// GET /api/admin - Returns all participants with full picks data (admin only, no date gates)
export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") || "unknown";
  const log = getLogger("api/admin").child({ requestId });
  log.info("GET /api/admin");
  try {
    if (!isKvConfigured()) {
      return NextResponse.json({ error: "KV not configured" }, { status: 503 });
    }

    // Verify admin: read userId from query param, look up user, check email
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const requestingUser = await getUserById(userId);
    if (!requestingUser || !isAdmin(requestingUser.email)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const data = await getAllUsersWithPicks();

    const participants = data.map(({ user, picks }) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      hasTier1: !!(picks?.groupPredictions && picks.groupPredictions.length > 0),
      hasTier2: !!picks?.tier2Submitted,
      submittedAt: picks?.submittedAt ?? null,
      groupCount: picks?.groupPredictions?.length ?? 0,
      knockoutCount: picks?.knockoutPicks?.length ?? 0,
      picks: picks
        ? {
            groupPredictions: picks.groupPredictions ?? [],
            goldenBoot: picks.goldenBoot ?? "",
            mostGoalsTeam: picks.mostGoalsTeam ?? "",
            fewestConcededTeam: picks.fewestConcededTeam ?? "",
            goldenBall: picks.goldenBall ?? "",
            tiebreaker: picks.tiebreaker ?? { homeScore: 0, awayScore: 0 },
            knockoutPicks: picks.knockoutPicks ?? [],
          }
        : null,
    }));

    const summary = {
      total: participants.length,
      tier1Submitted: participants.filter((p) => p.hasTier1).length,
      tier2Submitted: participants.filter((p) => p.hasTier2).length,
    };

    return NextResponse.json({ participants, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch admin data";
    log.error({ err: message }, "Admin API error");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
