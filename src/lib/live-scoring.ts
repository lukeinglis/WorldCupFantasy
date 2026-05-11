/**
 * Live scoring engine.
 *
 * Fetches actual tournament results from football-data.org and scores
 * participant picks against them. Falls back to static (null) results
 * when the API is unavailable.
 *
 * This module is meant to run server-side only. It calls the API client
 * directly (not via HTTP routes) for efficiency.
 */

import {
  getStandings,
  getScorers,
  getTeamStats,
  getMatches,
  isApiConfigured,
  type TransformedGroupStandings,
  type TransformedScorer,
  type TeamStats,
  type TransformedMatch,
} from "./football-api";

// ── Types ──

export interface LiveGroupResults {
  /** Mapping: group letter => [1st_tla, 2nd_tla, 3rd_tla, 4th_tla] */
  groups: Record<string, [string, string, string, string]>;
  /** Whether all groups have played all their matches (3 matches each) */
  isComplete: boolean;
}

export interface LiveBonusResults {
  goldenBoot: string | null;     // Player name of top scorer
  mostGoalsTeam: string | null;  // TLA of team with most group stage goals
  fewestConcededTeam: string | null; // TLA of team with fewest group stage goals conceded
}

export interface LiveTournamentStatus {
  currentMatchday: number | null;
  totalMatches: number;
  playedMatches: number;
  liveMatches: number;
  /** Distinct stages that have finished matches */
  completedStages: string[];
  /** Is the group stage fully complete? */
  groupStageComplete: boolean;
}

// ── Fetch live group results ──

export async function getLiveGroupResults(): Promise<LiveGroupResults | null> {
  if (!isApiConfigured()) return null;

  const standings = await getStandings();
  if (!standings || standings.length === 0) return null;

  const groups: Record<string, [string, string, string, string]> = {};
  let isComplete = true;

  for (const group of standings) {
    if (group.standings.length < 4) {
      // Not enough teams in standings yet
      isComplete = false;
      continue;
    }

    // Check if all matches are played (each team plays 3 group matches)
    const allPlayed = group.standings.every((s) => s.played >= 3);
    if (!allPlayed) isComplete = false;

    // Standings are already sorted by position from the API
    const sorted = [...group.standings].sort((a, b) => a.position - b.position);
    groups[group.group] = [
      sorted[0]?.team.tla ?? "",
      sorted[1]?.team.tla ?? "",
      sorted[2]?.team.tla ?? "",
      sorted[3]?.team.tla ?? "",
    ];
  }

  return { groups, isComplete };
}

// ── Fetch live bonus results ──

export async function getLiveBonusResults(): Promise<LiveBonusResults | null> {
  if (!isApiConfigured()) return null;

  const [scorers, stats] = await Promise.all([getScorers(), getTeamStats()]);

  let goldenBoot: string | null = null;
  if (scorers && scorers.length > 0) {
    goldenBoot = scorers[0].playerName;
  }

  let mostGoalsTeam: string | null = null;
  let fewestConcededTeam: string | null = null;

  if (stats && stats.length > 0) {
    const withMatches = stats.filter((t) => t.matchesPlayed > 0);
    if (withMatches.length > 0) {
      // Most goals scored in group stage
      const byGoals = [...withMatches].sort(
        (a, b) => b.goalsScored - a.goalsScored
      );
      mostGoalsTeam = byGoals[0].teamTla;

      // Fewest conceded in group stage
      const byConceded = [...withMatches].sort(
        (a, b) => a.goalsConceded - b.goalsConceded
      );
      fewestConcededTeam = byConceded[0].teamTla;
    }
  }

  return { goldenBoot, mostGoalsTeam, fewestConcededTeam };
}

// ── Fetch tournament status ──

export async function getLiveTournamentStatus(): Promise<LiveTournamentStatus | null> {
  if (!isApiConfigured()) return null;

  const matches = await getMatches();
  if (!matches) return null;

  const playedMatches = matches.filter((m) => m.status === "FINISHED");
  const liveMatches = matches.filter((m) => m.isLive);

  // Determine current matchday from the most recent match
  const matchdays = matches
    .filter((m) => m.matchday !== null)
    .map((m) => m.matchday!);
  const currentMatchday = matchdays.length > 0 ? Math.max(...matchdays) : null;

  // Completed stages
  const stageMatches = new Map<string, { total: number; finished: number }>();
  for (const m of matches) {
    const stage = m.stage;
    if (!stageMatches.has(stage)) {
      stageMatches.set(stage, { total: 0, finished: 0 });
    }
    const s = stageMatches.get(stage)!;
    s.total += 1;
    if (m.status === "FINISHED") s.finished += 1;
  }

  const completedStages: string[] = [];
  for (const [stage, counts] of stageMatches) {
    if (counts.total > 0 && counts.finished === counts.total) {
      completedStages.push(stage);
    }
  }

  const groupStageComplete = completedStages.includes("group");

  return {
    currentMatchday: isFinite(currentMatchday ?? NaN) ? currentMatchday : null,
    totalMatches: matches.length,
    playedMatches: playedMatches.length,
    liveMatches: liveMatches.length,
    completedStages,
    groupStageComplete,
  };
}

// ── Re-exports for convenience ──

export type {
  TransformedGroupStandings,
  TransformedScorer,
  TeamStats,
  TransformedMatch,
};
