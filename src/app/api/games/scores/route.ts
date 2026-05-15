import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

// --- Types ---

export interface GameScoreEntry {
  userId: string;
  userName: string;
  score: number;
  updatedAt: string;
}

const VALID_GAMES = ["penalty", "flags"] as const;
type GameName = (typeof VALID_GAMES)[number];

const MAX_ENTRIES = 50;

function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function kvKey(game: GameName): string {
  return `game-scores:${game}`;
}

function isValidGame(game: unknown): game is GameName {
  return typeof game === "string" && VALID_GAMES.includes(game as GameName);
}

function isFinitePositiveInt(val: unknown): val is number {
  return (
    typeof val === "number" &&
    Number.isFinite(val) &&
    Number.isInteger(val) &&
    val > 0
  );
}

// --- GET: Fetch leaderboard ---

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get("game");

  if (!isValidGame(game)) {
    return NextResponse.json(
      { error: "Invalid game. Must be 'penalty' or 'flags'." },
      { status: 400 }
    );
  }

  if (!isKvConfigured()) {
    return NextResponse.json({ scores: [], kvConfigured: false });
  }

  try {
    const scores = (await kv.get<GameScoreEntry[]>(kvKey(game))) ?? [];
    return NextResponse.json({ scores });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch leaderboard." },
      { status: 500 }
    );
  }
}

// --- POST: Save a game score ---

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { userId, userName, game, score } = body;

  // Validate required fields
  if (typeof userId !== "string" || userId.trim().length === 0) {
    return NextResponse.json(
      { error: "userId is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  if (typeof userName !== "string" || userName.trim().length === 0) {
    return NextResponse.json(
      { error: "userName is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  if (!isValidGame(game)) {
    return NextResponse.json(
      { error: "Invalid game. Must be 'penalty' or 'flags'." },
      { status: 400 }
    );
  }

  if (!isFinitePositiveInt(score)) {
    return NextResponse.json(
      { error: "score must be a finite positive integer." },
      { status: 400 }
    );
  }

  if (!isKvConfigured()) {
    return NextResponse.json(
      { error: "Score storage is not configured.", saved: false },
      { status: 503 }
    );
  }

  try {
    const key = kvKey(game);
    const existing = (await kv.get<GameScoreEntry[]>(key)) ?? [];

    // Check if the user already has an entry
    const userIndex = existing.findIndex((e) => e.userId === userId);

    if (userIndex !== -1) {
      // Only update if the new score is strictly higher
      if (score <= existing[userIndex].score) {
        return NextResponse.json({
          saved: false,
          reason: "Existing score is equal or higher.",
          scores: existing,
        });
      }
      // Update in place
      existing[userIndex] = {
        userId,
        userName: userName.trim(),
        score,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Add new entry
      existing.push({
        userId,
        userName: userName.trim(),
        score,
        updatedAt: new Date().toISOString(),
      });
    }

    // Sort descending by score, then by updatedAt ascending (earlier is better on ties)
    existing.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.updatedAt.localeCompare(b.updatedAt);
    });

    // Trim to max entries
    const trimmed = existing.slice(0, MAX_ENTRIES);

    await kv.set(key, trimmed);

    return NextResponse.json({ saved: true, scores: trimmed });
  } catch {
    return NextResponse.json(
      { error: "Failed to save score." },
      { status: 500 }
    );
  }
}
