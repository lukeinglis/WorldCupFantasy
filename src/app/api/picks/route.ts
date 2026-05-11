import { NextResponse } from "next/server";
import { getPicks, savePicks, getUser, type PicksRecord } from "@/lib/storage";
import { hashPasscode } from "@/lib/auth";

// GET /api/picks?userId=xxx  or  GET /api/picks?all=true
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
    const { userName, passcode, picks } = body as {
      userName?: string;
      passcode?: string;
      picks?: Omit<PicksRecord, "participantId" | "submittedAt">;
    };

    if (!userName || !passcode || !picks) {
      return NextResponse.json(
        { error: "userName, passcode, and picks are required." },
        { status: 400 }
      );
    }

    // Verify auth
    const user = await getUser(userName);
    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    const hash = await hashPasscode(passcode);
    if (hash !== user.passcodeHash) {
      return NextResponse.json(
        { error: "Incorrect passcode." },
        { status: 401 }
      );
    }

    // Validate group predictions
    if (!picks.groupPredictions || picks.groupPredictions.length !== 12) {
      return NextResponse.json(
        { error: "All 12 group predictions are required." },
        { status: 400 }
      );
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

    return NextResponse.json({ success: true, submittedAt: record.submittedAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save picks";
    console.error("Save picks error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
