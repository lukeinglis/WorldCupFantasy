/**
 * football-data.org API v4 client.
 *
 * Features:
 *   - Typed responses for all endpoints
 *   - Server-side caching with configurable TTL
 *   - Graceful error handling (API down, rate limited, etc.)
 *   - Null/undefined sanitization on all response fields
 *   - Fallback: returns null on failure (callers use static data)
 */

import {
  type ApiTeamsResponse,
  type ApiStandingsResponse,
  type ApiMatchesResponse,
  type ApiMatchDetail,
  type ApiScorersResponse,
  type TransformedTeam,
  type TransformedGroupStandings,
  type TransformedMatch,
  type TransformedScorer,
  type TransformedStanding,
  type TeamStats,
  type ApiMatch,
  type ApiGoal,
  type ApiBooking,
  LIVE_STATUSES,
} from "./football-api-types";

import { getCached, setCache, CacheTTL } from "./api-cache";

// ── Config ──

const API_BASE = "https://api.football-data.org/v4";
const COMPETITION = "WC";

function getApiKey(): string | null {
  return process.env.FOOTBALL_DATA_API_KEY ?? null;
}

// ── Fetch helper ──

async function apiFetch<T>(path: string): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const url = `${API_BASE}${path}`;

  try {
    const res = await fetch(url, {
      headers: { "X-Auth-Token": apiKey },
      // Next.js extended fetch: do not cache at the framework level;
      // we handle caching ourselves via api-cache.ts
      cache: "no-store",
    });

    if (res.status === 429) {
      console.warn("[football-api] Rate limited. Returning cached data or null.");
      return null;
    }

    if (!res.ok) {
      console.warn(`[football-api] ${res.status} ${res.statusText} for ${path}`);
      return null;
    }

    const data: T = await res.json();
    return data;
  } catch (err) {
    console.error(`[football-api] Network error for ${path}:`, err);
    return null;
  }
}

// ── Sanitization helpers ──

/** Safely coerce a number, returning 0 for null/undefined/NaN/Infinity */
function safeNum(val: number | null | undefined): number {
  if (val === null || val === undefined || !Number.isFinite(val)) return 0;
  return val;
}

/** Safely coerce a string, returning fallback for null/undefined */
function safeStr(val: string | null | undefined, fallback = ""): string {
  return val ?? fallback;
}

// ── Group name extraction ──

/** Convert "GROUP_A" to "A", "GROUP_L" to "L", etc. */
function extractGroupLetter(apiGroup: string | null): string {
  if (!apiGroup) return "";
  return apiGroup.replace("GROUP_", "");
}

/** Map API stage names to our internal stage names */
function mapStage(apiStage: string): string {
  const stageMap: Record<string, string> = {
    GROUP_STAGE: "group",
    LAST_32: "round_of_32",
    LAST_16: "round_of_16",
    QUARTER_FINALS: "quarter",
    SEMI_FINALS: "semi",
    THIRD_PLACE: "third_place",
    FINAL: "final",
  };
  return stageMap[apiStage] ?? apiStage.toLowerCase();
}

// ── Public API methods ──

/**
 * Fetch all teams in the competition.
 */
export async function getTeams(): Promise<TransformedTeam[] | null> {
  const cacheKey = "teams";
  const cached = getCached<TransformedTeam[]>(cacheKey);
  if (cached) return cached;

  const raw = await apiFetch<ApiTeamsResponse>(`/competitions/${COMPETITION}/teams`);
  if (!raw?.teams) return null;

  // We need standings to map teams to groups
  const standings = await getStandings();
  const teamGroupMap = new Map<number, string>();
  if (standings) {
    for (const group of standings) {
      for (const entry of group.standings) {
        teamGroupMap.set(entry.team.id, group.group);
      }
    }
  }

  const transformed: TransformedTeam[] = raw.teams.map((t) => ({
    id: t.id,
    name: safeStr(t.name, "Unknown"),
    shortName: safeStr(t.shortName, safeStr(t.name, "Unknown")),
    tla: safeStr(t.tla, "???"),
    crest: t.crest ?? null,
    group: teamGroupMap.get(t.id) ?? "",
    area: safeStr(t.area?.name, ""),
    areaFlag: t.area?.flag ?? null,
  }));

  setCache(cacheKey, transformed, CacheTTL.TEAMS);
  return transformed;
}

/**
 * Fetch current group standings.
 */
export async function getStandings(): Promise<TransformedGroupStandings[] | null> {
  const cacheKey = "standings";
  const cached = getCached<TransformedGroupStandings[]>(cacheKey);
  if (cached) return cached;

  const raw = await apiFetch<ApiStandingsResponse>(`/competitions/${COMPETITION}/standings`);
  if (!raw?.standings) return null;

  const transformed: TransformedGroupStandings[] = raw.standings
    .filter((s) => s.type === "TOTAL")
    .map((group) => ({
      group: extractGroupLetter(group.group),
      standings: group.table.map(
        (entry): TransformedStanding => ({
          position: safeNum(entry.position),
          team: {
            id: entry.team.id,
            name: safeStr(entry.team.name, "Unknown"),
            shortName: safeStr(entry.team.shortName, "Unknown"),
            tla: safeStr(entry.team.tla, "???"),
            crest: entry.team.crest ?? null,
            group: extractGroupLetter(group.group),
            area: "",
            areaFlag: null,
          },
          played: safeNum(entry.playedGames),
          won: safeNum(entry.won),
          draw: safeNum(entry.draw),
          lost: safeNum(entry.lost),
          goalsFor: safeNum(entry.goalsFor),
          goalsAgainst: safeNum(entry.goalsAgainst),
          goalDifference: safeNum(entry.goalDifference),
          points: safeNum(entry.points),
          form: entry.form ?? null,
        })
      ),
    }));

  setCache(cacheKey, transformed, CacheTTL.STANDINGS);
  return transformed;
}

/**
 * Fetch all matches, optionally filtered by status.
 */
export async function getMatches(
  statusFilter?: string
): Promise<TransformedMatch[] | null> {
  // Use different cache keys for different status filters
  const cacheKey = statusFilter ? `matches_${statusFilter}` : "matches";
  const ttl = statusFilter === "LIVE" ? CacheTTL.MATCHES_LIVE : CacheTTL.MATCHES;

  const cached = getCached<TransformedMatch[]>(cacheKey);
  if (cached) return cached;

  let path = `/competitions/${COMPETITION}/matches`;
  if (statusFilter && statusFilter !== "LIVE") {
    path += `?status=${statusFilter}`;
  }

  const raw = await apiFetch<ApiMatchesResponse>(path);
  if (!raw?.matches) return null;

  let matches = raw.matches;

  // Custom "LIVE" filter that combines multiple live statuses
  if (statusFilter === "LIVE") {
    matches = matches.filter((m) =>
      LIVE_STATUSES.includes(m.status)
    );
  }

  const transformed = matches.map(transformMatch);

  setCache(cacheKey, transformed, ttl);
  return transformed;
}

/**
 * Fetch a single match with full detail (goals, cards, substitutions).
 */
export async function getMatchDetail(matchId: number): Promise<ApiMatchDetail | null> {
  const cacheKey = `match_detail_${matchId}`;
  const cached = getCached<ApiMatchDetail>(cacheKey);
  if (cached) return cached;

  const raw = await apiFetch<ApiMatchDetail>(`/matches/${matchId}`);
  if (!raw) return null;

  setCache(cacheKey, raw, CacheTTL.MATCH_DETAIL);
  return raw;
}

/**
 * Fetch top scorers.
 */
export async function getScorers(): Promise<TransformedScorer[] | null> {
  const cacheKey = "scorers";
  const cached = getCached<TransformedScorer[]>(cacheKey);
  if (cached) return cached;

  const raw = await apiFetch<ApiScorersResponse>(`/competitions/${COMPETITION}/scorers`);
  if (!raw?.scorers) return null;

  const transformed: TransformedScorer[] = raw.scorers.map((s) => ({
    playerName: safeStr(s.player?.name, "Unknown"),
    teamName: safeStr(s.team?.name, "Unknown"),
    teamTla: safeStr(s.team?.tla, "???"),
    teamCrest: s.team?.crest ?? null,
    goals: safeNum(s.goals),
    assists: safeNum(s.assists),
    playedMatches: safeNum(s.playedMatches),
    penalties: safeNum(s.penalties),
  }));

  setCache(cacheKey, transformed, CacheTTL.SCORERS);
  return transformed;
}

/**
 * Compute aggregated team stats from group stage matches.
 * Used for: most goals scored, fewest conceded, discipline stats.
 */
export async function getTeamStats(): Promise<TeamStats[] | null> {
  const cacheKey = "team_stats";
  const cached = getCached<TeamStats[]>(cacheKey);
  if (cached) return cached;

  // Fetch all matches (we filter to group stage only)
  const allMatches = await apiFetch<ApiMatchesResponse>(
    `/competitions/${COMPETITION}/matches`
  );
  if (!allMatches?.matches) return null;

  const groupMatches = allMatches.matches.filter(
    (m) => m.stage === "GROUP_STAGE" && m.status === "FINISHED"
  );

  if (groupMatches.length === 0) return null;

  // Aggregate stats per team
  const statsMap = new Map<
    number,
    {
      name: string;
      tla: string;
      crest: string | null;
      goalsScored: number;
      goalsConceded: number;
      yellowCards: number;
      redCards: number;
      matchesPlayed: number;
    }
  >();

  function ensureTeam(team: ApiMatch["homeTeam"]): void {
    if (!statsMap.has(team.id)) {
      statsMap.set(team.id, {
        name: safeStr(team.name, "Unknown"),
        tla: safeStr(team.tla, "???"),
        crest: team.crest ?? null,
        goalsScored: 0,
        goalsConceded: 0,
        yellowCards: 0,
        redCards: 0,
        matchesPlayed: 0,
      });
    }
  }

  for (const match of groupMatches) {
    ensureTeam(match.homeTeam);
    ensureTeam(match.awayTeam);

    const homeStats = statsMap.get(match.homeTeam.id)!;
    const awayStats = statsMap.get(match.awayTeam.id)!;

    const homeGoals = safeNum(match.score.fullTime.home);
    const awayGoals = safeNum(match.score.fullTime.away);

    homeStats.goalsScored += homeGoals;
    homeStats.goalsConceded += awayGoals;
    homeStats.matchesPlayed += 1;

    awayStats.goalsScored += awayGoals;
    awayStats.goalsConceded += homeGoals;
    awayStats.matchesPlayed += 1;
  }

  // Fetch cards from individual match details (if available)
  // Only fetch details for finished group matches to get booking data
  for (const match of groupMatches) {
    const detail = await getMatchDetail(match.id);
    if (!detail?.bookings) continue;

    for (const booking of detail.bookings) {
      const teamId = booking.team?.id;
      if (!teamId || !statsMap.has(teamId)) continue;

      const teamStats = statsMap.get(teamId)!;
      if (booking.card === "YELLOW_CARD") {
        teamStats.yellowCards += 1;
      } else if (booking.card === "RED_CARD" || booking.card === "YELLOW_RED") {
        teamStats.redCards += 1;
      }
    }
  }

  const result: TeamStats[] = Array.from(statsMap.values()).map((s) => ({
    teamName: s.name,
    teamTla: s.tla,
    teamCrest: s.crest,
    goalsScored: s.goalsScored,
    goalsConceded: s.goalsConceded,
    yellowCards: s.yellowCards,
    redCards: s.redCards,
    matchesPlayed: s.matchesPlayed,
  }));

  setCache(cacheKey, result, CacheTTL.STATS);
  return result;
}

// ── Transform helpers ──

function transformMatch(m: ApiMatch): TransformedMatch {
  return {
    id: m.id,
    utcDate: safeStr(m.utcDate),
    status: m.status,
    matchday: m.matchday ?? null,
    stage: mapStage(safeStr(m.stage, "GROUP_STAGE")),
    group: extractGroupLetter(m.group ?? null) || null,
    homeTeam: {
      id: m.homeTeam.id,
      name: safeStr(m.homeTeam.name, "TBD"),
      shortName: safeStr(m.homeTeam.shortName, "TBD"),
      tla: safeStr(m.homeTeam.tla, "TBD"),
      crest: m.homeTeam.crest ?? null,
    },
    awayTeam: {
      id: m.awayTeam.id,
      name: safeStr(m.awayTeam.name, "TBD"),
      shortName: safeStr(m.awayTeam.shortName, "TBD"),
      tla: safeStr(m.awayTeam.tla, "TBD"),
      crest: m.awayTeam.crest ?? null,
    },
    score: {
      winner: m.score?.winner ?? null,
      fullTime: {
        home: m.score?.fullTime?.home ?? null,
        away: m.score?.fullTime?.away ?? null,
      },
      halfTime: {
        home: m.score?.halfTime?.home ?? null,
        away: m.score?.halfTime?.away ?? null,
      },
    },
    isLive: LIVE_STATUSES.includes(m.status),
  };
}

// ── Convenience: check if API is configured ──

export function isApiConfigured(): boolean {
  return !!getApiKey();
}

// Re-export types used by API routes
export type {
  TransformedTeam,
  TransformedGroupStandings,
  TransformedMatch,
  TransformedScorer,
  TeamStats,
  ApiGoal,
  ApiBooking,
  ApiMatchDetail,
};
