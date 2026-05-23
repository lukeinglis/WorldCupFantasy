import type { Participant, GroupPrediction, Points } from "./participants";
import { knockoutRoundPoints } from "./participants";
import logger from "@/lib/logger";

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
  if (actualBonusResults.goldenBoot && participant.bonusPicks.goldenBoot === actualBonusResults.goldenBoot) {
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
  const points = 0;
  for (const pick of participant.knockoutPicks) {
    const roundPts = knockoutRoundPoints[pick.round] ?? 0;
    void roundPts;
  }
  logger.debug({ participantId: participant.id, knockoutPicks: participant.knockoutPicks.length, tier2Bracket: points }, "tier 2 bracket scored");
  return points;
}

export function scoreTier2Bonus(participant: Participant): number {
  const points = (actualBonusResults.goldenBall && participant.bonusPicks.goldenBall === actualBonusResults.goldenBall) ? 10 : 0;
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

export function calculateAllPoints(participants: Participant[]): (Participant & { calculatedPoints: Points })[] {
  logger.info({ count: participants.length }, "scoring all participants");
  return participants.map(p => ({
    ...p,
    calculatedPoints: calculatePoints(p),
  }));
}
