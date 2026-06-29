import type { Participant, GroupPrediction, Points } from "./participants";
import { knockoutRoundPoints } from "./participants";
import logger from "@/lib/logger";

/**
 * Normalize a player name for fuzzy comparison:
 * lowercase, strip diacritics, collapse whitespace.
 */
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fuzzy match for player names.
 * Returns true if:
 *   1. Normalized strings are equal, OR
 *   2. One is a substring of the other (handles "Mbappe" vs "Kylian Mbappe"), OR
 *   3. The last word of each string matches (handles "K. Mbappe" vs "Kylian Mbappe")
 */
export function fuzzyPlayerMatch(pick: string, actual: string): boolean {
  if (!pick || !actual) return false;
  const a = normalizeName(pick);
  const b = normalizeName(actual);
  if (!a || !b) return false;

  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const aWords = a.split(" ");
  const bWords = b.split(" ");
  const aLast = aWords[aWords.length - 1];
  const bLast = bWords[bWords.length - 1];
  if (aLast.length >= 3 && aLast === bLast) return true;

  return false;
}

/**
 * Tier 1 Group Scoring
 *
 * In the 2026 format (48 teams, 12 groups of 4):
 * - Top 2 from each group advance automatically
 * - 8 best 3rd-place teams also advance
 * - So "advances" = 1st, 2nd, or qualifying 3rd
 * - "Exits" = 4th or non-qualifying 3rd
 *
 * For simplicity, we treat 1st/2nd as "advances" and 3rd/4th as "exits"
 * for the bucket scoring (the 3rd-place qualification is unpredictable).
 *
 * Exact position: 3 pts per team
 * Right bucket (advance/exit correct but wrong position): 1 pt per team
 */

// Final group stage standings (all 48 group matches completed June 27, 2026)
export const actualGroupResults: Record<string, [string, string, string, string]> = {
  A: ["MEX", "RSA", "KOR", "CZE"],
  B: ["SUI", "CAN", "BIH", "QAT"],
  C: ["BRA", "MAR", "SCO", "HAI"],
  D: ["USA", "AUS", "PAR", "TUR"],
  E: ["GER", "CIV", "ECU", "CUR"],
  F: ["NED", "JPN", "SWE", "TUN"],
  G: ["BEL", "EGY", "IRN", "NZL"],
  H: ["ESP", "CPV", "URY", "KSA"],
  I: ["FRA", "NOR", "SEN", "IRQ"],
  J: ["ARG", "AUT", "ALG", "JOR"],
  K: ["COL", "POR", "COD", "UZB"],
  L: ["ENG", "CRO", "GHA", "PAN"],
};

// Hardcoded knockout results fallback (updated via scripts/update-knockout-results.sh)
// Live API results take precedence when available; this prevents zero scores during rate limiting
const HARDCODED_KNOCKOUT_RESULTS: Record<string, string> = {
  "round_of_32_1": "CAN",  // RSA 0:1 CAN (Jun 28)
};

// Active knockout results: starts from hardcoded, overwritten by live API when available
export let actualKnockoutResults: Record<string, string> | null = { ...HARDCODED_KNOCKOUT_RESULTS };

// Knockout match schedule for late submission penalty
export let knockoutMatchSchedule: { round: string; matchNumber: number; utcDate: string; homeTeam: string; awayTeam: string; status: string }[] | null = null;

export function setKnockoutMatchSchedule(matches: typeof knockoutMatchSchedule): void {
  const matchCount = matches ? matches.length : 0;
  logger.info({ matchCount }, "knockout match schedule updated");
  knockoutMatchSchedule = matches;
}

export function setActualKnockoutResults(
  results: Record<string, string> | null
): void {
  if (results) {
    actualKnockoutResults = { ...HARDCODED_KNOCKOUT_RESULTS, ...results };
  }
  const matchCount = actualKnockoutResults ? Object.keys(actualKnockoutResults).length : 0;
  logger.info({ matchCount }, "knockout results updated");
}

export function scoreGroupPrediction(
  prediction: GroupPrediction,
  actual: [string, string, string, string]
): number {
  let points = 0;
  for (let i = 0; i < 4; i++) {
    const predicted = prediction.order[i];
    const actualPosition = actual.indexOf(predicted);

    if (actualPosition === -1) {
      logger.warn({ team: predicted, group: prediction.group }, "predicted team not found in actual results");
      continue;
    }

    if (actualPosition === i) {
      points += 3;
    } else {
      const predictedAdvances = i <= 1;
      const actualAdvances = actualPosition <= 1;
      if (predictedAdvances === actualAdvances) {
        points += 1;
      }
    }
  }
  logger.debug({ group: prediction.group, points, predicted: prediction.order, actual }, "group prediction scored");
  return points;
}

export function scoreTier1Groups(participant: Participant): number {
  if (!actualGroupResults) {
    logger.debug({ participantId: participant.id }, "no group results available, returning 0");
    return 0;
  }

  let total = 0;
  for (const gp of participant.groupPredictions) {
    const actual = actualGroupResults[gp.group];
    if (actual) {
      total += scoreGroupPrediction(gp, actual);
    }
  }
  logger.debug({ participantId: participant.id, tier1Groups: total }, "tier 1 groups scored");
  return total;
}

// Hardcoded group-stage bonus results (ties: all tied teams count)
const MOST_GOALS_TEAMS = ["FRA", "GER", "NED"]; // all 10 goals in group stage
const FEWEST_CONCEDED_TEAMS = ["ESP", "MEX"]; // both 0 goals conceded in group stage

// Dynamic bonus results (Golden Boot and Golden Ball updated from API as tournament progresses)
export let actualBonusResults: {
  goldenBoot: string | null;
  goldenBall: string | null;
} = {
  goldenBoot: null,
  goldenBall: null,
};

/** Update dynamic bonus results from live data (Golden Boot scorer) */
export function setActualBonusResults(results: {
  goldenBoot: string | null;
}): void {
  logger.info({ goldenBoot: results.goldenBoot }, "bonus results updated");
  actualBonusResults = {
    ...actualBonusResults,
    goldenBoot: results.goldenBoot,
  };
}

export function scoreTier1Bonus(participant: Participant): number {
  let points = 0;
  if (actualBonusResults.goldenBoot && fuzzyPlayerMatch(participant.bonusPicks.goldenBoot, actualBonusResults.goldenBoot)) {
    points += 10;
  }
  if (MOST_GOALS_TEAMS.includes(participant.bonusPicks.mostGoalsTeam)) {
    points += 10;
  }
  if (FEWEST_CONCEDED_TEAMS.includes(participant.bonusPicks.fewestConcededTeam)) {
    points += 10;
  }
  logger.debug({ participantId: participant.id, tier1Bonus: points }, "tier 1 bonus scored");
  return points;
}

export function scoreTier2Bracket(participant: Participant): number {
  if (!actualKnockoutResults) {
    logger.debug({ participantId: participant.id }, "no knockout results available, returning 0");
    return 0;
  }

  const taintedTeams = new Set<string>();
  const missedMatches = new Set<string>();

  const KNOCKOUT_DEADLINE = new Date("2026-06-28T19:00:00Z");
  const submittedAt = participant.tier2SubmittedAt ? new Date(participant.tier2SubmittedAt) : null;
  const isLate = submittedAt && submittedAt > KNOCKOUT_DEADLINE;

  if (isLate && knockoutMatchSchedule) {
    for (const match of knockoutMatchSchedule) {
      const matchDate = new Date(match.utcDate);
      if (match.status === "FINISHED" || matchDate < submittedAt) {
        missedMatches.add(`${match.round}_${match.matchNumber}`);
        if (match.homeTeam) taintedTeams.add(match.homeTeam);
        if (match.awayTeam) taintedTeams.add(match.awayTeam);
      }
    }
    logger.info(
      { participantId: participant.id, missedCount: missedMatches.size, taintedCount: taintedTeams.size },
      "late submission penalty applied"
    );
  }

  let points = 0;
  for (const pick of participant.knockoutPicks) {
    const key = `${pick.round}_${pick.matchNumber}`;
    const actualWinner = actualKnockoutResults[key];

    if (!actualWinner || pick.winner !== actualWinner) continue;

    const roundPts = knockoutRoundPoints[pick.round] ?? 0;

    if (missedMatches.has(key)) {
      continue;
    } else if (taintedTeams.has(pick.winner)) {
      points += Math.floor(roundPts / 2);
    } else {
      points += roundPts;
    }
  }
  logger.debug({ participantId: participant.id, knockoutPicks: participant.knockoutPicks.length, tier2Bracket: points, isLate: !!isLate }, "tier 2 bracket scored");
  return points;
}

export function scoreTier2Bonus(participant: Participant): number {
  const points = (actualBonusResults.goldenBall && fuzzyPlayerMatch(participant.bonusPicks.goldenBall, actualBonusResults.goldenBall)) ? 10 : 0;
  logger.debug({ participantId: participant.id, tier2Bonus: points }, "tier 2 bonus scored");
  return points;
}

export function calculatePoints(participant: Participant): Points {
  const tier1Groups = scoreTier1Groups(participant);
  const tier1Bonus = scoreTier1Bonus(participant);
  const tier2Bracket = scoreTier2Bracket(participant);
  const tier2Bonus = scoreTier2Bonus(participant);
  const total = tier1Groups + tier1Bonus + tier2Bracket + tier2Bonus;

  logger.info({ participantId: participant.id, tier1Groups, tier1Bonus, tier2Bracket, tier2Bonus, total }, "points calculated");
  return { tier1Groups, tier1Bonus, tier2Bracket, tier2Bonus, total };
}

export interface PotentialPoints {
  earned: number;
  remaining: number;
  maximum: number;
}

export function calculatePotentialPoints(participant: Participant): PotentialPoints {
  const earned = calculatePoints(participant);

  let remaining = 0;

  // Groups: 12 pts max per group (4 teams x 3 pts exact position)
  for (const gp of participant.groupPredictions) {
    if (!actualGroupResults || !actualGroupResults[gp.group]) {
      remaining += 12;
    }
  }

  // Tier 1 bonuses: Golden Boot is dynamic (10 pts if undecided)
  // Most Goals Team and Fewest Conceded are hardcoded (always decided)
  if (!actualBonusResults.goldenBoot && participant.bonusPicks.goldenBoot) {
    remaining += 10;
  }

  // Knockout picks: round points if match not yet decided
  for (const pick of participant.knockoutPicks) {
    const key = `${pick.round}_${pick.matchNumber}`;
    const actualWinner = actualKnockoutResults ? actualKnockoutResults[key] : undefined;
    if (!actualWinner) {
      remaining += knockoutRoundPoints[pick.round] ?? 0;
    }
  }

  // Golden Ball: 10 pts if not yet decided and participant made a pick
  if (!actualBonusResults.goldenBall && participant.bonusPicks.goldenBall) {
    remaining += 10;
  }

  logger.debug(
    { participantId: participant.id, earned: earned.total, remaining, maximum: earned.total + remaining },
    "potential points calculated"
  );

  return {
    earned: earned.total,
    remaining,
    maximum: earned.total + remaining,
  };
}

export function calculateAllPoints(participants: Participant[]): (Participant & { calculatedPoints: Points })[] {
  logger.info({ count: participants.length }, "scoring all participants");
  return participants.map(p => ({
    ...p,
    calculatedPoints: calculatePoints(p),
  }));
}
