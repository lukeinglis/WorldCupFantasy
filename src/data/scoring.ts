import type { Participant, GroupPrediction, Points } from "./participants";
import { knockoutRoundPoints } from "./participants";

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

    if (actualPosition === -1) continue; // team not in group (shouldn't happen)

    if (actualPosition === i) {
      // Exact position match
      points += 3;
    } else {
      // Check bucket: positions 0,1 = "advances", positions 2,3 = "exits"
      const predictedAdvances = i <= 1;
      const actualAdvances = actualPosition <= 1;
      if (predictedAdvances === actualAdvances) {
        points += 1;
      }
    }
  }
  return points;
}

export function scoreTier1Groups(participant: Participant): number {
  if (!actualGroupResults) return 0;

  let total = 0;
  for (const gp of participant.groupPredictions) {
    const actual = actualGroupResults[gp.group];
    if (actual) {
      total += scoreGroupPrediction(gp, actual);
    }
  }
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
  return points;
}

export function scoreTier2Bracket(participant: Participant): number {
  // Knockout picks would be scored against actual knockout results
  // For now, no knockout results exist
  const points = 0;
  for (const pick of participant.knockoutPicks) {
    // Would check against actual results here
    const roundPts = knockoutRoundPoints[pick.round] ?? 0;
    // If pick.winner matches actual winner of that match: points += roundPts
    // For now, all 0
    void roundPts;
  }
  return points;
}

export function scoreTier2Bonus(participant: Participant): number {
  if (actualBonusResults.goldenBall && participant.bonusPicks.goldenBall === actualBonusResults.goldenBall) {
    return 10;
  }
  return 0;
}

export function calculatePoints(participant: Participant): Points {
  const tier1Groups = scoreTier1Groups(participant);
  const tier1Bonus = scoreTier1Bonus(participant);
  const tier2Bracket = scoreTier2Bracket(participant);
  const tier2Bonus = scoreTier2Bonus(participant);

  return {
    tier1Groups,
    tier1Bonus,
    tier2Bracket,
    tier2Bonus,
    total: tier1Groups + tier1Bonus + tier2Bracket + tier2Bonus,
  };
}

export function calculateAllPoints(participants: Participant[]): (Participant & { calculatedPoints: Points })[] {
  return participants.map(p => ({
    ...p,
    calculatedPoints: calculatePoints(p),
  }));
}
