import { NextResponse } from "next/server";
import { getUserById, isKvConfigured, savePersistedLiveResults } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import { isApiConfigured, getScorers, getMatches } from "@/lib/football-api";
import { getLiveKnockoutResults, getLiveBonusResults } from "@/lib/live-scoring";
import { getLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const log = getLogger("api/admin/refresh");
  log.info("POST /api/admin/refresh");

  try {
    if (!isKvConfigured()) {
      return NextResponse.json({ error: "KV not configured" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const user = await getUserById(userId);
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (!isApiConfigured()) {
      return NextResponse.json({ error: "FOOTBALL_DATA_API_KEY not set" }, { status: 503 });
    }

    const [knockoutResults, bonusResults, scorers, matches] = await Promise.all([
      getLiveKnockoutResults(),
      getLiveBonusResults(),
      getScorers(),
      getMatches(),
    ]);

    const knockoutMatches = matches
      ?.filter(m => ["round_of_32", "round_of_16", "quarter", "semi", "third_place", "final"].includes(m.stage))
      .map(m => ({
        stage: m.stage,
        home: m.homeTeam.tla,
        away: m.awayTeam.tla,
        score: `${m.score.fullTime.home ?? "?"}:${m.score.fullTime.away ?? "?"}`,
        status: m.status,
        date: m.utcDate,
      })) ?? [];

    const persistedResults = knockoutResults?.results ?? {};
    const goldenBoot = bonusResults?.goldenBoot ?? null;
    const scorersList = scorers?.slice(0, 20).map(s => ({
      playerName: s.playerName,
      teamTla: s.teamTla,
      teamCrest: s.teamCrest,
      goals: s.goals,
      assists: s.assists,
    })) ?? [];

    await savePersistedLiveResults({
      knockoutResults: persistedResults,
      goldenBoot,
      scorers: scorersList,
      updatedAt: new Date().toISOString(),
    });

    log.info(
      { knockoutCount: Object.keys(persistedResults).length, goldenBoot, scorerCount: scorersList.length },
      "live results persisted to KV"
    );

    return NextResponse.json({
      fetchedAt: new Date().toISOString(),
      persisted: true,
      knockoutResults: persistedResults,
      knockoutComplete: knockoutResults?.isComplete ?? false,
      bonusResults,
      topScorers: scorersList.slice(0, 10).map(s => ({
        player: s.playerName,
        team: s.teamTla,
        goals: s.goals,
      })),
      knockoutMatches,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refresh failed";
    log.error({ err: message }, "admin refresh error");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
