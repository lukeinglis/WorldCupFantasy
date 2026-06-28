import { describe, it, expect, beforeEach } from "vitest";
import {
  scoreGroupPrediction,
  scoreTier1Groups,
  scoreTier1Bonus,
  scoreTier2Bracket,
  scoreTier2Bonus,
  calculatePoints,
  calculateAllPoints,
  setActualBonusResults,
  actualBonusResults,
  setActualKnockoutResults,
  fuzzyPlayerMatch,
} from "../scoring";
import type { Participant, GroupPrediction } from "../participants";

function makeParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    id: "test-1",
    name: "Test User",
    avatar: "",
    groupPredictions: [],
    bonusPicks: {
      goldenBoot: "",
      mostGoalsTeam: "",
      fewestConcededTeam: "",
      goldenBall: "",
    },
    knockoutPicks: [],
    tiebreaker: { homeScore: 0, awayScore: 0 },
    points: { tier1Groups: 0, tier1Bonus: 0, tier2Bracket: 0, tier2Bonus: 0, total: 0 },
    tier2SubmittedAt: null,
    ...overrides,
  };
}

describe("scoreGroupPrediction", () => {
  it("scores 12 for a perfect prediction (all 4 exact)", () => {
    const pred: GroupPrediction = { group: "A", order: ["USA", "MEX", "CAN", "JPN"] };
    const actual: [string, string, string, string] = ["USA", "MEX", "CAN", "JPN"];
    expect(scoreGroupPrediction(pred, actual)).toBe(12);
  });

  it("scores 0 for a completely wrong prediction", () => {
    const pred: GroupPrediction = { group: "A", order: ["USA", "MEX", "CAN", "JPN"] };
    const actual: [string, string, string, string] = ["JPN", "CAN", "MEX", "USA"];
    expect(scoreGroupPrediction(pred, actual)).toBe(0);
  });

  it("scores 4 for one exact + one right bucket", () => {
    const pred: GroupPrediction = { group: "A", order: ["USA", "BRA", "MEX", "JPN"] };
    const actual: [string, string, string, string] = ["USA", "MEX", "JPN", "BRA"];
    expect(scoreGroupPrediction(pred, actual)).toBe(4);
  });

  it("scores 1 for right bucket but wrong position (both advance)", () => {
    const pred: GroupPrediction = { group: "A", order: ["USA", "MEX", "CAN", "JPN"] };
    const actual: [string, string, string, string] = ["MEX", "USA", "CAN", "JPN"];
    expect(scoreGroupPrediction(pred, actual)).toBe(8);
  });

  it("scores 1 for right bucket but wrong position (both exit)", () => {
    const pred: GroupPrediction = { group: "A", order: ["USA", "MEX", "CAN", "JPN"] };
    const actual: [string, string, string, string] = ["USA", "MEX", "JPN", "CAN"];
    expect(scoreGroupPrediction(pred, actual)).toBe(8);
  });

  it("scores 0 for wrong bucket (predicted advance, actually exits)", () => {
    const pred: GroupPrediction = { group: "A", order: ["CAN", "JPN", "USA", "MEX"] };
    const actual: [string, string, string, string] = ["USA", "MEX", "CAN", "JPN"];
    expect(scoreGroupPrediction(pred, actual)).toBe(0);
  });

  it("handles a team not found in actual (returns 0 for that team)", () => {
    const pred: GroupPrediction = { group: "A", order: ["USA", "MEX", "FAKE", "JPN"] };
    const actual: [string, string, string, string] = ["USA", "MEX", "CAN", "JPN"];
    expect(scoreGroupPrediction(pred, actual)).toBe(9);
  });

  it("gives mixed scores for partial matches", () => {
    const pred: GroupPrediction = { group: "A", order: ["USA", "CAN", "MEX", "JPN"] };
    const actual: [string, string, string, string] = ["USA", "MEX", "CAN", "JPN"];
    expect(scoreGroupPrediction(pred, actual)).toBe(6);
  });
});

describe("scoreTier1Groups", () => {
  it("scores against hardcoded results for group A", () => {
    const p = makeParticipant({
      groupPredictions: [{ group: "A", order: ["MEX", "RSA", "KOR", "CZE"] }],
    });
    expect(scoreTier1Groups(p)).toBe(12);
  });

  it("returns 0 for empty groupPredictions array", () => {
    const p = makeParticipant({ groupPredictions: [] });
    expect(scoreTier1Groups(p)).toBe(0);
  });

  it("ignores groups that don't exist in actual results", () => {
    const p = makeParticipant({
      groupPredictions: [{ group: "Z", order: ["AAA", "BBB", "CCC", "DDD"] }],
    });
    expect(scoreTier1Groups(p)).toBe(0);
  });
});

describe("fuzzyPlayerMatch", () => {
  it("matches exact names", () => {
    expect(fuzzyPlayerMatch("Lionel Messi", "Lionel Messi")).toBe(true);
  });

  it("matches case-insensitive", () => {
    expect(fuzzyPlayerMatch("lionel messi", "Lionel Messi")).toBe(true);
  });

  it("matches with accents stripped", () => {
    expect(fuzzyPlayerMatch("Kylian Mbappe", "Kylian Mbappé")).toBe(true);
  });

  it("matches last name only", () => {
    expect(fuzzyPlayerMatch("Mbappe", "Kylian Mbappé")).toBe(true);
  });

  it("matches substring (first + last vs full)", () => {
    expect(fuzzyPlayerMatch("Vinicius Junior", "Vinícius José Paixão de Oliveira Júnior")).toBe(true);
  });

  it("matches last word when >= 3 chars", () => {
    expect(fuzzyPlayerMatch("K. Mbappe", "Kylian Mbappe")).toBe(true);
  });

  it("does not match completely different names", () => {
    expect(fuzzyPlayerMatch("Messi", "Ronaldo")).toBe(false);
  });

  it("does not match empty strings", () => {
    expect(fuzzyPlayerMatch("", "Messi")).toBe(false);
    expect(fuzzyPlayerMatch("Messi", "")).toBe(false);
  });

  it("handles extra whitespace", () => {
    expect(fuzzyPlayerMatch("  Lionel  Messi  ", "Lionel Messi")).toBe(true);
  });
});

describe("scoreTier1Bonus", () => {
  beforeEach(() => {
    setActualBonusResults({ goldenBoot: null });
  });

  it("returns 0 when no golden boot result and wrong team picks", () => {
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Messi", mostGoalsTeam: "ARG", fewestConcededTeam: "ITA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(0);
  });

  it("scores 10 for correct golden boot", () => {
    setActualBonusResults({ goldenBoot: "Mbappe" });
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Mbappe", mostGoalsTeam: "BRA", fewestConcededTeam: "ITA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(10);
  });

  it("scores 10 for most goals team (tied: FRA/GER/NED)", () => {
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Nobody", mostGoalsTeam: "FRA", fewestConcededTeam: "ITA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(10);
  });

  it("scores 10 for most goals team GER (tied)", () => {
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Nobody", mostGoalsTeam: "GER", fewestConcededTeam: "ITA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(10);
  });

  it("scores 10 for fewest conceded team (tied: ESP/MEX)", () => {
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Nobody", mostGoalsTeam: "BRA", fewestConcededTeam: "ESP", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(10);
  });

  it("scores 10 for fewest conceded team MEX (tied)", () => {
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Nobody", mostGoalsTeam: "BRA", fewestConcededTeam: "MEX", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(10);
  });

  it("scores 30 for golden boot + both team bonuses correct", () => {
    setActualBonusResults({ goldenBoot: "Kane" });
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Kane", mostGoalsTeam: "NED", fewestConcededTeam: "MEX", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(30);
  });

  it("scores 0 for all wrong", () => {
    setActualBonusResults({ goldenBoot: "Kane" });
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Messi", mostGoalsTeam: "BRA", fewestConcededTeam: "ITA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(0);
  });
});

describe("scoreTier2Bracket", () => {
  beforeEach(() => {
    setActualKnockoutResults(null);
  });

  it("returns 0 with no knockout results", () => {
    const p = makeParticipant({ knockoutPicks: [] });
    expect(scoreTier2Bracket(p)).toBe(0);
  });

  it("returns 0 when no actual results yet", () => {
    const p = makeParticipant({
      knockoutPicks: [
        { round: "round_of_32", matchNumber: 1, winner: "USA" },
        { round: "final", matchNumber: 1, winner: "BRA" },
      ],
    });
    expect(scoreTier2Bracket(p)).toBe(0);
  });

  it("scores correct picks against knockout results", () => {
    setActualKnockoutResults({ round_of_32_1: "USA", round_of_32_2: "BRA" });
    const p = makeParticipant({
      knockoutPicks: [
        { round: "round_of_32", matchNumber: 1, winner: "USA" },
        { round: "round_of_32", matchNumber: 2, winner: "ARG" },
      ],
    });
    expect(scoreTier2Bracket(p)).toBe(2);
  });
});

describe("scoreTier2Bonus", () => {
  it("returns 0 when no golden ball result", () => {
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "", mostGoalsTeam: "", fewestConcededTeam: "", goldenBall: "Messi" },
    });
    expect(scoreTier2Bonus(p)).toBe(0);
  });

  it("returns 10 for correct golden ball", () => {
    actualBonusResults.goldenBall = "Messi";
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "", mostGoalsTeam: "", fewestConcededTeam: "", goldenBall: "Messi" },
    });
    expect(scoreTier2Bonus(p)).toBe(10);
    actualBonusResults.goldenBall = null;
  });

  it("returns 0 for wrong golden ball", () => {
    actualBonusResults.goldenBall = "Ronaldo";
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "", mostGoalsTeam: "", fewestConcededTeam: "", goldenBall: "Messi" },
    });
    expect(scoreTier2Bonus(p)).toBe(0);
    actualBonusResults.goldenBall = null;
  });
});

describe("calculatePoints", () => {
  beforeEach(() => {
    setActualBonusResults({ goldenBoot: null });
    setActualKnockoutResults(null);
    actualBonusResults.goldenBall = null;
  });

  it("calculates total as sum of all components", () => {
    setActualBonusResults({ goldenBoot: "Kane" });
    const p = makeParticipant({
      groupPredictions: [{ group: "A", order: ["MEX", "RSA", "KOR", "CZE"] }],
      bonusPicks: { goldenBoot: "Kane", mostGoalsTeam: "BRA", fewestConcededTeam: "FRA", goldenBall: "" },
    });
    const pts = calculatePoints(p);
    expect(pts.tier1Groups).toBe(12);
    expect(pts.tier1Bonus).toBe(10);
    expect(pts.total).toBe(22);
  });
});

describe("calculateAllPoints", () => {
  beforeEach(() => {
    setActualBonusResults({ goldenBoot: null });
    setActualKnockoutResults(null);
    actualBonusResults.goldenBall = null;
  });

  it("returns empty array for empty input", () => {
    expect(calculateAllPoints([])).toEqual([]);
  });

  it("adds calculatedPoints to each participant", () => {
    const participants = [makeParticipant({ id: "p1" }), makeParticipant({ id: "p2" })];
    const result = calculateAllPoints(participants);
    expect(result).toHaveLength(2);
    expect(result[0].calculatedPoints).toBeDefined();
    expect(result[1].calculatedPoints).toBeDefined();
  });

  it("preserves original participant fields", () => {
    const p = makeParticipant({ id: "p1", name: "Alice" });
    const result = calculateAllPoints([p]);
    expect(result[0].id).toBe("p1");
    expect(result[0].name).toBe("Alice");
  });
});
