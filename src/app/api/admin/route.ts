import { NextResponse } from "next/server";
import { getAllUsersWithPicks, getUserById, removeParticipant, getPicks, savePicks, isKvConfigured } from "@/lib/storage";
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

// DELETE /api/admin - Remove a participant (admin only)
export async function DELETE(request: Request) {
  const requestId = request.headers.get("x-request-id") || "unknown";
  const log = getLogger("api/admin").child({ requestId });
  log.info("DELETE /api/admin");
  try {
    if (!isKvConfigured()) {
      return NextResponse.json({ error: "KV not configured" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const removeId = searchParams.get("removeId");

    if (!userId || !removeId) {
      return NextResponse.json({ error: "userId and removeId required" }, { status: 400 });
    }

    const requestingUser = await getUserById(userId);
    if (!requestingUser || !isAdmin(requestingUser.email)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const removed = await removeParticipant(removeId);
    if (!removed) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    log.info({ removeId, removedBy: requestingUser.email }, "Participant removed by admin");
    return NextResponse.json({ success: true, removedId: removeId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove participant";
    log.error({ err: message }, "Admin DELETE error");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/admin - Merge Tier 2 picks from one participant to another (admin only)
export async function PATCH(request: Request) {
  const requestId = request.headers.get("x-request-id") || "unknown";
  const log = getLogger("api/admin").child({ requestId });
  log.info("PATCH /api/admin");
  try {
    if (!isKvConfigured()) {
      return NextResponse.json({ error: "KV not configured" }, { status: 503 });
    }

    const body = await request.json();
    const { userId, fromId, toId } = body;

    if (!userId || !fromId || !toId) {
      return NextResponse.json({ error: "userId, fromId, and toId required" }, { status: 400 });
    }

    const requestingUser = await getUserById(userId);
    if (!requestingUser || !isAdmin(requestingUser.email)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const fromPicks = await getPicks(fromId);
    const toPicks = await getPicks(toId);

    if (!fromPicks) {
      return NextResponse.json({ error: "Source participant has no picks" }, { status: 404 });
    }
    if (!toPicks) {
      return NextResponse.json({ error: "Target participant has no picks" }, { status: 404 });
    }

    toPicks.knockoutPicks = fromPicks.knockoutPicks;
    toPicks.goldenBall = fromPicks.goldenBall;
    toPicks.tier2Submitted = fromPicks.tier2Submitted;
    toPicks.submittedAt = fromPicks.submittedAt;

    await savePicks(toPicks);

    log.info({ fromId, toId, mergedBy: requestingUser.email }, "Tier 2 picks merged by admin");
    return NextResponse.json({
      success: true,
      merged: {
        from: fromId,
        to: toId,
        knockoutPicksCount: (fromPicks.knockoutPicks ?? []).length,
        goldenBall: fromPicks.goldenBall ?? "",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to merge picks";
    log.error({ err: message }, "Admin PATCH error");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
