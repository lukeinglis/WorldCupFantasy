import { NextResponse } from "next/server";
import { getPicks, savePicks, getUserById, type PicksRecord } from "@/lib/storage";
import { getLogger } from "@/lib/logger";
import { TOURNAMENT_START, KNOCKOUT_START } from "@/lib/tournament-dates";

// GET /api/picks?userId=xxx
export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") || "unknown";
  const log = getLogger("api/picks").child({ requestId });
  log.info("GET /api/picks");
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
    log.error({ err: message }, "Get picks error");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/picks  - Save picks for a participant
export async function POST(request: Request) {
  const postRequestId = request.headers.get("x-request-id") || "unknown";
  const postLog = getLogger("api/picks").child({ requestId: postRequestId });
  postLog.info("POST /api/picks");
  try {
    const body = await request.json();

    // Basic type checking on the request body
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { userId, tier } = body as { userId?: string; tier?: number };

    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId is required and must be a string." },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please join the league first." },
        { status: 404 }
      );
    }

    // Route to Tier 2 handler
    if (tier === 2) {
      return handleTier2Submission(body, user.id, postLog);
    }

    // Tier 1 (default)
    return handleTier1Submission(body, user.id, postLog);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save picks";
    postLog.error({ err: message }, "Save picks error");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleTier1Submission(body: any, userId: string, log: any) {
  const { picks } = body as {
    picks?: Omit<PicksRecord, "participantId" | "submittedAt">;
  };

  if (!picks || typeof picks !== "object") {
    return NextResponse.json(
      { error: "picks object is required." },
      { status: 400 }
    );
  }

  // Validate required picks fields
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

  // Enforce Tier 1 pick deadline
  if (new Date() >= TOURNAMENT_START) {
    log.warn({ userId }, "Tier 1 picks rejected: tournament has started");
    return NextResponse.json(
      { error: "Tier 1 picks are locked. The tournament has already started." },
      { status: 403 }
    );
  }

  // Validate group predictions: must be an array of exactly 12
  if (!Array.isArray(picks.groupPredictions) || picks.groupPredictions.length !== 12) {
    return NextResponse.json(
      { error: "All 12 group predictions are required." },
      { status: 400 }
    );
  }

  // Validate each group prediction has exactly 4 string elements
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

  const record: PicksRecord = {
    participantId: userId,
    groupPredictions: picks.groupPredictions,
    goldenBoot: picks.goldenBoot || "",
    mostGoalsTeam: picks.mostGoalsTeam || "",
    fewestConcededTeam: picks.fewestConcededTeam || "",
    goldenBall: picks.goldenBall || "",
    tiebreaker: picks.tiebreaker || { homeScore: 0, awayScore: 0 },
    submittedAt: new Date().toISOString(),
    tier2Submitted: false,
    knockoutPicks: [],
  };

  return savePicks(record).then(() => {
    return NextResponse.json({ success: true, submittedAt: record.submittedAt });
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleTier2Submission(body: any, userId: string, log: any) {
  // Enforce Tier 2 pick deadline
  if (new Date() >= KNOCKOUT_START) {
    log.warn({ userId }, "Tier 2 picks rejected: knockout stage has started");
    return NextResponse.json(
      { error: "Tier 2 picks are locked. The knockout stage has already started." },
      { status: 403 }
    );
  }

  // Read existing picks (user must have Tier 1 picks already)
  const existing = await getPicks(userId);
  if (!existing) {
    return NextResponse.json(
      { error: "You must submit Tier 1 picks before submitting Tier 2." },
      { status: 400 }
    );
  }

  const { knockoutPicks, goldenBall } = body as {
    knockoutPicks?: { round: string; matchNumber: number; winner: string }[];
    goldenBall?: string;
  };

  // Validate knockoutPicks
  if (!Array.isArray(knockoutPicks)) {
    return NextResponse.json(
      { error: "knockoutPicks must be an array." },
      { status: 400 }
    );
  }

  const validRounds = ["round_of_32", "round_of_16", "quarter", "semi", "third_place", "final"];
  for (const pick of knockoutPicks) {
    if (
      !pick ||
      typeof pick.round !== "string" ||
      !validRounds.includes(pick.round) ||
      typeof pick.matchNumber !== "number" ||
      pick.matchNumber < 1 ||
      typeof pick.winner !== "string" ||
      !pick.winner
    ) {
      return NextResponse.json(
        { error: `Invalid knockout pick: ${JSON.stringify(pick)}` },
        { status: 400 }
      );
    }
  }

  // Validate goldenBall
  if (typeof goldenBall !== "string") {
    return NextResponse.json(
      { error: "goldenBall must be a string." },
      { status: 400 }
    );
  }

  // Merge Tier 2 fields into existing picks
  const merged: PicksRecord = {
    ...existing,
    knockoutPicks,
    goldenBall: goldenBall || "",
    tier2Submitted: true,
    submittedAt: new Date().toISOString(),
  };

  await savePicks(merged);
  log.info({ userId, knockoutPicksCount: knockoutPicks.length }, "Tier 2 picks saved");

  return NextResponse.json({ success: true, submittedAt: merged.submittedAt });
}
