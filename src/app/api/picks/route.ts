import { NextResponse } from "next/server";
import { getPicks, savePicks, getUserById, type PicksRecord } from "@/lib/storage";
import { TOURNAMENT_START, KNOCKOUT_START } from "@/lib/tournament-dates";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

// GET /api/picks?userId=xxx
export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = rateLimit({ key: `picks-get:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId parameter is required." },
        { status: 400 }
      );
    }

    const picks = await getPicks(userId);
    return NextResponse.json({ picks });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch picks";
    console.error("Get picks error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/picks  - Save picks for a participant
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic type checking on the request body
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { userId, picks } = body as {
      userId?: string;
      picks?: Omit<PicksRecord, "participantId" | "submittedAt">;
    };

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId is required and must be a string." },
        { status: 400 }
      );
    }

    const rl = rateLimit({ key: `picks-post:${userId}`, limit: 10, windowMs: 60_000 });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const now = new Date();
    const tier1Locked = now >= TOURNAMENT_START;
    const tier2Locked = now >= KNOCKOUT_START;

    const hasTier1 = !tier1Locked && Array.isArray(picks?.groupPredictions) && picks.groupPredictions.length > 0;
    const hasTier2 = !tier2Locked && Array.isArray(picks?.knockoutPicks) && picks.knockoutPicks.length > 0;

    if (!hasTier1 && !hasTier2) {
      return NextResponse.json(
        { error: "All pick deadlines have passed. Picks can no longer be submitted." },
        { status: 403 }
      );
    }

    if (!picks || typeof picks !== "object") {
      return NextResponse.json(
        { error: "picks object is required." },
        { status: 400 }
      );
    }

    if (hasTier1) {
      if (typeof picks.goldenBoot !== "string") {
        return NextResponse.json(
          { error: "goldenBoot must be a string." },
          { status: 400 }
        );
      }
      if (typeof picks.mostGoalsTeam !== "string") {
        return NextResponse.json(
          { error: "mostGoalsTeam must be a string." },
          { status: 400 }
        );
      }
      if (typeof picks.fewestConcededTeam !== "string") {
        return NextResponse.json(
          { error: "fewestConcededTeam must be a string." },
          { status: 400 }
        );
      }
    }

    // Verify user exists
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please join the league first." },
        { status: 404 }
      );
    }

    if (hasTier1) {
      if (!Array.isArray(picks.groupPredictions) || picks.groupPredictions.length !== 12) {
        return NextResponse.json(
          { error: "All 12 group predictions are required." },
          { status: 400 }
        );
      }

      for (const gp of picks.groupPredictions) {
        if (
          !gp ||
          typeof gp.group !== "string" ||
          !Array.isArray(gp.order) ||
          gp.order.length !== 4 ||
          gp.order.some((code: unknown) => typeof code !== "string" || code === "")
        ) {
          return NextResponse.json(
            { error: `Invalid prediction for group ${gp?.group ?? "unknown"}. Each group must have exactly 4 team codes.` },
            { status: 400 }
          );
        }
      }
    }

    const existing = await getPicks(userId);

    const record: PicksRecord = {
      participantId: user.id,
      groupPredictions: hasTier1
        ? picks.groupPredictions!
        : existing?.groupPredictions ?? [],
      goldenBoot: picks.goldenBoot || existing?.goldenBoot || "",
      mostGoalsTeam: picks.mostGoalsTeam || existing?.mostGoalsTeam || "",
      fewestConcededTeam: picks.fewestConcededTeam || existing?.fewestConcededTeam || "",
      goldenBall: picks.goldenBall || existing?.goldenBall || "",
      tiebreaker: picks.tiebreaker || existing?.tiebreaker || { homeScore: 0, awayScore: 0 },
      submittedAt: new Date().toISOString(),
      tier2Submitted: hasTier2 ? true : existing?.tier2Submitted ?? false,
      knockoutPicks: hasTier2
        ? picks.knockoutPicks!
        : existing?.knockoutPicks ?? [],
    };

    await savePicks(record);

    // Update payment confirmation on user record
    if (!user.paymentConfirmed) {
      user.paymentConfirmed = true;
      // Import updateUser dynamically to avoid circular issues
      const { updateUser } = await import("@/lib/storage");
      await updateUser(user);
    }

    return NextResponse.json({ success: true, submittedAt: record.submittedAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save picks";
    console.error("Save picks error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
