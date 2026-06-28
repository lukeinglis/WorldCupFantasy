import { NextResponse } from "next/server";
import { getPicks, savePicks, archivePicks, getUserById, type PicksRecord } from "@/lib/storage";
import { getLogger } from "@/lib/logger";
import { TOURNAMENT_START } from "@/lib/tournament-dates";

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
async function handleTier1Submission(body: any, userId: string, log: any) {
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

  await archivePicks(userId);
  log.info({ userId, groupPredictions: record.groupPredictions, bonusPicks: { goldenBoot: record.goldenBoot, mostGoalsTeam: record.mostGoalsTeam, fewestConcededTeam: record.fewestConcededTeam } }, "Tier 1 picks saving");
  await savePicks(record);
  return NextResponse.json({ success: true, submittedAt: record.submittedAt });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleTier2Submission(body: any, userId: string, log: any) {
  // Temporary hold: picks open at 2am EST (6am UTC) June 28, 2026
  const TIER2_OPENS = new Date("2026-06-28T06:00:00Z");
  if (new Date() < TIER2_OPENS) {
    log.warn({ userId }, "Tier 2 picks rejected: submissions not yet open");
    return NextResponse.json(
      { error: "Knockout bracket picks are not open yet. Submissions open at 2:00 AM EST on June 28." },
      { status: 403 }
    );
  }

  const existing = await getPicks(userId);

  if (existing?.tier2Submitted) {
    log.warn({ userId }, "Tier 2 picks rejected: already submitted, no edits allowed");
    return NextResponse.json(
      { error: "Your Tier 2 picks have already been submitted. No changes are allowed after submission." },
      { status: 403 }
    );
  }

  const { knockoutPicks, goldenBall } = body as {
    knockoutPicks?: { round: string; matchNumber: number; winner: string }[];
    goldenBall?: string;
  };

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

  if (typeof goldenBall !== "string") {
    return NextResponse.json(
      { error: "goldenBall must be a string." },
      { status: 400 }
    );
  }

  // Check deadline for warning (still allow late submissions)
  const KNOCKOUT_DEADLINE = new Date("2026-06-28T19:00:00Z"); // 3pm EST
  const isLate = new Date() >= KNOCKOUT_DEADLINE;
  if (isLate) {
    log.warn({ userId }, "Tier 2 picks submitted after deadline, late submission penalty applies");
  }

  await archivePicks(userId);

  const merged: PicksRecord = {
    participantId: userId,
    groupPredictions: existing?.groupPredictions ?? [],
    goldenBoot: existing?.goldenBoot ?? "",
    mostGoalsTeam: existing?.mostGoalsTeam ?? "",
    fewestConcededTeam: existing?.fewestConcededTeam ?? "",
    goldenBall: goldenBall || existing?.goldenBall || "",
    tiebreaker: existing?.tiebreaker ?? { homeScore: 0, awayScore: 0 },
    knockoutPicks: knockoutPicks,
    tier2Submitted: true,
    submittedAt: new Date().toISOString(),
  };

  log.info({ userId, knockoutPickCount: knockoutPicks.length, goldenBall, isLate }, "Tier 2 picks saving");
  await savePicks(merged);

  return NextResponse.json({
    success: true,
    submittedAt: merged.submittedAt,
    isLate,
  });
}
