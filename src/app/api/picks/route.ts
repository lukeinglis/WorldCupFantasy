import { NextResponse } from "next/server";
import { getPicks, savePicks, getUserById, type PicksRecord } from "@/lib/storage";

// GET /api/picks?userId=xxx
export async function GET(request: Request) {
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

    // Verify user exists
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found. Please join the league first." },
        { status: 404 }
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
      participantId: user.id,
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
