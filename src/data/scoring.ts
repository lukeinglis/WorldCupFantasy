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

// Static fallback results (null = tournament hasn't happened yet)
// When live API data is available, these are overridden by live-scoring.ts
export let actualGroupResults: Record<string, [string, string, string, string]> | null = null;

/** Update group results from live data (called from server components) */
export function setActualGroupResults(
  results: Record<string, [string, string, string, string]> | null
): void {
  const groupCount = results ? Object.keys(results).length : 0;
  logger.info({ groupCount, hasResults: results !== null }, "group results updated");
  actualGroupResults = results;
}

// Map knockout match results: key = "{round}_{matchNumber}", value = winning team TLA
export let actualKnockoutResults: Record<string, string> | null = null;

export function setActualKnockoutResults(
  results: Record<string, string> | null
): void {
  const matchCount = results ? Object.keys(results).length : 0;
  logger.info({ matchCount, hasResults: results !== null }, "knockout results updated");
  actualKnockoutResults = results;
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

// Static bonus results (overridden by live-scoring when available)
export let actualBonusResults: {
  goldenBoot: string | null;
  mostGoalsTeam: string | null;
  fewestConcededTeam: string | null;
  goldenBall: string | null;
} = {
  goldenBoot: null,
  mostGoalsTeam: null,
  fewestConcededTeam: null,
  goldenBall: null,
};

/** Update bonus results from live data */
export function setActualBonusResults(results: {
  goldenBoot: string | null;
  mostGoalsTeam: string | null;
  fewestConcededTeam: string | null;
}): void {
  logger.info({ goldenBoot: results.goldenBoot, mostGoalsTeam: results.mostGoalsTeam, fewestConcededTeam: results.fewestConcededTeam }, "bonus results updated");
  actualBonusResults = {
    ...actualBonusResults,
    goldenBoot: results.goldenBoot,
    mostGoalsTeam: results.mostGoalsTeam,
    fewestConcededTeam: results.fewestConcededTeam,
  };
}

export function scoreTier1Bonus(participant: Participant): number {
  let points = 0;
  if (actualBonusResults.goldenBoot && fuzzyPlayerMatch(participant.bonusPicks.goldenBoot, actualBonusResults.goldenBoot)) {
    points += 10;
  }
  if (actualBonusResults.mostGoalsTeam && participant.bonusPicks.mostGoalsTeam === actualBonusResults.mostGoalsTeam) {
    points += 10;
  }
  if (actualBonusResults.fewestConcededTeam && participant.bonusPicks.fewestConcededTeam === actualBonusResults.fewestConcededTeam) {
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

  let points = 0;
  for (const pick of participant.knockoutPicks) {
    const key = `${pick.round}_${pick.matchNumber}`;
    const actualWinner = actualKnockoutResults[key];
    if (actualWinner && pick.winner === actualWinner) {
      const roundPts = knockoutRoundPoints[pick.round] ?? 0;
      points += roundPts;
    }
  }
  logger.debug({ participantId: participant.id, knockoutPicks: participant.knockoutPicks.length, tier2Bracket: points }, "tier 2 bracket scored");
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

  // Tier 1 bonuses: 10 pts each if undecided and participant made a pick
  if (!actualBonusResults.goldenBoot && participant.bonusPicks.goldenBoot) {
    remaining += 10;
  }
  if (!actualBonusResults.mostGoalsTeam && participant.bonusPicks.mostGoalsTeam) {
    remaining += 10;
  }
  if (!actualBonusResults.fewestConcededTeam && participant.bonusPicks.fewestConcededTeam) {
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
