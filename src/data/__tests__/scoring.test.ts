import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  scoreGroupPrediction,
  scoreTier1Groups,
  scoreTier1Bonus,
  scoreTier2Bracket,
  scoreTier2Bonus,
  calculatePoints,
  calculateAllPoints,
  calculatePotentialPoints,
  setActualBonusResults,
  setActualKnockoutResults,
  actualBonusResults,
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
    // USA exact=3, BRA predicted advance actual exit=0, MEX predicted exit actual advance=0, JPN predicted exit(3) actual exit(2)=1
    expect(scoreGroupPrediction(pred, actual)).toBe(4);
  });

  it("scores 1 for right bucket but wrong position (both advance)", () => {
    const pred: GroupPrediction = { group: "A", order: ["USA", "MEX", "CAN", "JPN"] };
    const actual: [string, string, string, string] = ["MEX", "USA", "CAN", "JPN"];
    // USA: predicted 0, actual 1 (both advance bucket) = 1
    // MEX: predicted 1, actual 0 (both advance bucket) = 1
    // CAN: exact = 3
    // JPN: exact = 3
    expect(scoreGroupPrediction(pred, actual)).toBe(8);
  });

  it("scores 1 for right bucket but wrong position (both exit)", () => {
    const pred: GroupPrediction = { group: "A", order: ["USA", "MEX", "CAN", "JPN"] };
    const actual: [string, string, string, string] = ["USA", "MEX", "JPN", "CAN"];
    // USA exact = 3, MEX exact = 3, CAN predicted 2 actual 3 (both exit) = 1, JPN predicted 3 actual 2 (both exit) = 1
    expect(scoreGroupPrediction(pred, actual)).toBe(8);
  });

  it("scores 0 for wrong bucket (predicted advance, actually exits)", () => {
    const pred: GroupPrediction = { group: "A", order: ["CAN", "JPN", "USA", "MEX"] };
    const actual: [string, string, string, string] = ["USA", "MEX", "CAN", "JPN"];
    // CAN: predicted 0 (advance), actual 2 (exit) = 0
    // JPN: predicted 1 (advance), actual 3 (exit) = 0
    // USA: predicted 2 (exit), actual 0 (advance) = 0
    // MEX: predicted 3 (exit), actual 1 (advance) = 0
    expect(scoreGroupPrediction(pred, actual)).toBe(0);
  });

  it("handles a team not found in actual (returns 0 for that team)", () => {
    const pred: GroupPrediction = { group: "A", order: ["USA", "MEX", "FAKE", "JPN"] };
    const actual: [string, string, string, string] = ["USA", "MEX", "CAN", "JPN"];
    // USA exact=3, MEX exact=3, FAKE not found=0, JPN exact=3
    expect(scoreGroupPrediction(pred, actual)).toBe(9);
  });

  it("gives mixed scores for partial matches", () => {
    const pred: GroupPrediction = { group: "A", order: ["USA", "CAN", "MEX", "JPN"] };
    const actual: [string, string, string, string] = ["USA", "MEX", "CAN", "JPN"];
    // USA exact=3, CAN predicted 1 actual 2 (advance vs exit)=0, MEX predicted 2 actual 1 (exit vs advance)=0, JPN exact=3
    expect(scoreGroupPrediction(pred, actual)).toBe(6);
  });
});

describe("scoreTier1Groups", () => {
  it("scores perfect prediction for group A (MEX, RSA, KOR, CZE)", () => {
    const p = makeParticipant({
      groupPredictions: [{ group: "A", order: ["MEX", "RSA", "KOR", "CZE"] }],
    });
    expect(scoreTier1Groups(p)).toBe(12);
  });

  it("scores partial match against hardcoded group results", () => {
    const p = makeParticipant({
      groupPredictions: [
        { group: "A", order: ["MEX", "RSA", "KOR", "CZE"] },
        { group: "B", order: ["SUI", "CAN", "BIH", "QAT"] },
      ],
    });
    expect(scoreTier1Groups(p)).toBe(24);
  });

  it("ignores groups that don't exist in results (e.g. group Z)", () => {
    const p = makeParticipant({
      groupPredictions: [
        { group: "Z", order: ["AAA", "BBB", "CCC", "DDD"] },
      ],
    });
    expect(scoreTier1Groups(p)).toBe(0);
  });

  it("returns 0 for empty groupPredictions array", () => {
    const p = makeParticipant({ groupPredictions: [] });
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

  it("returns 0 when no actual bonus results", () => {
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

  it("scores 10 for golden boot with accent mismatch", () => {
    setActualBonusResults({ goldenBoot: "Kylian Mbappé" });
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Kylian Mbappe", mostGoalsTeam: "BRA", fewestConcededTeam: "ITA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(10);
  });

  it("scores 10 for golden boot with last name only", () => {
    setActualBonusResults({ goldenBoot: "Lionel Messi" });
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Messi", mostGoalsTeam: "BRA", fewestConcededTeam: "ITA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(10);
  });

  it("scores 10 for correct most goals team", () => {
    setActualBonusResults({ goldenBoot: null });
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Messi", mostGoalsTeam: "GER", fewestConcededTeam: "ITA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(10);
  });

  it("scores 10 for correct fewest conceded team (ESP or MEX)", () => {
    setActualBonusResults({ goldenBoot: null });
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Messi", mostGoalsTeam: "BRA", fewestConcededTeam: "ESP", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(10);
  });

  it("scores 30 for golden boot + both team bonuses correct", () => {
    setActualBonusResults({ goldenBoot: "Kane" });
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Kane", mostGoalsTeam: "FRA", fewestConcededTeam: "MEX", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(30);
  });

  it("scores 0 for all wrong", () => {
    setActualBonusResults({ goldenBoot: "Kane" });
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Messi", mostGoalsTeam: "BRA", fewestConcededTeam: "FRA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(0);
  });
});

describe("scoreTier2Bracket", () => {
  it("returns 0 with no knockout picks", () => {
    const p = makeParticipant({ knockoutPicks: [] });
    expect(scoreTier2Bracket(p)).toBe(0);
  });

  it("returns 0 for picks (no actual results implemented yet)", () => {
    const p = makeParticipant({
      knockoutPicks: [
        { round: "round_of_32", matchNumber: 1, winner: "USA" },
        { round: "final", matchNumber: 1, winner: "BRA" },
      ],
    });
    expect(scoreTier2Bracket(p)).toBe(0);
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
    // Directly set the module-level variable through the export
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
    actualBonusResults.goldenBall = null;
  });

  it("returns all zeros when no results exist", () => {
    const p = makeParticipant();
    const pts = calculatePoints(p);
    expect(pts.tier1Groups).toBe(0);
    expect(pts.tier1Bonus).toBe(0);
    expect(pts.tier2Bracket).toBe(0);
    expect(pts.tier2Bonus).toBe(0);
    expect(pts.total).toBe(0);
  });

  it("calculates total as sum of all components", () => {
    setActualBonusResults({ goldenBoot: "Kane" });
    const p = makeParticipant({
      groupPredictions: [{ group: "A", order: ["MEX", "RSA", "KOR", "CZE"] }],
      bonusPicks: { goldenBoot: "Kane", mostGoalsTeam: "BRA", fewestConcededTeam: "ITA", goldenBall: "" },
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
    expect(result[0].calculatedPoints.total).toBe(0);
    expect(result[1].calculatedPoints).toBeDefined();
  });

  it("preserves original participant fields", () => {
    const p = makeParticipant({ id: "p1", name: "Alice" });
    const result = calculateAllPoints([p]);
    expect(result[0].id).toBe("p1");
    expect(result[0].name).toBe("Alice");
  });
});

describe("scoreTier2Bracket with knockout results", () => {
  afterEach(() => {
    setActualKnockoutResults(null);
  });

  it("returns 0 with no knockout results set", () => {
    expect(scoreTier2Bracket(makeParticipant({ knockoutPicks: [
      { round: "round_of_32", matchNumber: 1, winner: "GER" },
    ]}))).toBe(0);
  });

  it("awards round_of_32 points (2) for correct prediction", () => {
    setActualKnockoutResults({ "round_of_32_1": "GER" });
    expect(scoreTier2Bracket(makeParticipant({ knockoutPicks: [
      { round: "round_of_32", matchNumber: 1, winner: "GER" },
    ]}))).toBe(2);
  });

  it("awards 0 for wrong prediction", () => {
    setActualKnockoutResults({ "round_of_32_1": "FRA" });
    expect(scoreTier2Bracket(makeParticipant({ knockoutPicks: [
      { round: "round_of_32", matchNumber: 1, winner: "GER" },
    ]}))).toBe(0);
  });

  it("awards points per round correctly", () => {
    setActualKnockoutResults({
      "round_of_32_1": "GER",
      "round_of_16_1": "GER",
      "quarter_1": "GER",
      "semi_1": "GER",
      "final_1": "GER",
    });
    expect(scoreTier2Bracket(makeParticipant({ knockoutPicks: [
      { round: "round_of_32", matchNumber: 1, winner: "GER" },
      { round: "round_of_16", matchNumber: 1, winner: "GER" },
      { round: "quarter", matchNumber: 1, winner: "GER" },
      { round: "semi", matchNumber: 1, winner: "GER" },
      { round: "final", matchNumber: 1, winner: "GER" },
    ]}))).toBe(2 + 4 + 6 + 8 + 10); // 30
  });

  it("ignores matches without actual results", () => {
    setActualKnockoutResults({ "round_of_32_1": "GER" });
    expect(scoreTier2Bracket(makeParticipant({ knockoutPicks: [
      { round: "round_of_32", matchNumber: 1, winner: "GER" },
      { round: "round_of_32", matchNumber: 2, winner: "FRA" }, // no actual result for match 2
    ]}))).toBe(2);
  });

  it("returns 0 with empty knockout picks", () => {
    setActualKnockoutResults({ "round_of_32_1": "GER" });
    expect(scoreTier2Bracket(makeParticipant({ knockoutPicks: [] }))).toBe(0);
  });

  it("handles multiple correct and incorrect predictions", () => {
    setActualKnockoutResults({
      "round_of_32_1": "GER",
      "round_of_32_2": "BRA",
      "round_of_16_1": "FRA",
    });
    expect(scoreTier2Bracket(makeParticipant({ knockoutPicks: [
      { round: "round_of_32", matchNumber: 1, winner: "GER" }, // correct: 2
      { round: "round_of_32", matchNumber: 2, winner: "ARG" }, // wrong: 0
      { round: "round_of_16", matchNumber: 1, winner: "FRA" }, // correct: 4
    ]}))).toBe(6);
  });
});

describe("calculatePotentialPoints", () => {
  afterEach(() => {
    setActualKnockoutResults(null);
    // Reset bonus results
    setActualBonusResults({ goldenBoot: null });
  });

  it("calculates remaining with hardcoded group results", () => {
    const p = makeParticipant({
      bonusPicks: {
        goldenBoot: "Mbappe",
        mostGoalsTeam: "GER",
        fewestConcededTeam: "ITA",
        goldenBall: "Messi",
      },
      knockoutPicks: [
        { round: "round_of_32", matchNumber: 1, winner: "GER" },
        { round: "final", matchNumber: 1, winner: "GER" },
      ],
    });
    const result = calculatePotentialPoints(p);
    // Groups are all hardcoded (0 remaining), GER is in MOST_GOALS_TEAMS (10 earned)
    // Golden Boot undecided (10 remaining), R32+Final undecided (12 remaining), Golden Ball (10 remaining)
    expect(result.remaining).toBe(10 + 12 + 10); // 32
  });

  it("returns 0 remaining for golden boot when decided", () => {
    setActualBonusResults({ goldenBoot: "Kane" });
    const p = makeParticipant({
      bonusPicks: {
        goldenBoot: "Mbappe",
        mostGoalsTeam: "GER",
        fewestConcededTeam: "ESP",
        goldenBall: "",
      },
    });
    const result = calculatePotentialPoints(p);
    // goldenBoot decided (wrong, 0 earned, 0 remaining)
    // mostGoalsTeam hardcoded correct (10 earned)
    // fewestConcededTeam hardcoded correct (10 earned)
    // goldenBall empty pick (0 remaining)
    expect(result.earned).toBe(20);
    expect(result.remaining).toBe(0);
  });

  it("reduces remaining as knockout results come in", () => {
    setActualKnockoutResults({
      "round_of_32_1": "GER",
    });
    const p = makeParticipant({
      knockoutPicks: [
        { round: "round_of_32", matchNumber: 1, winner: "GER" }, // decided, correct
        { round: "round_of_32", matchNumber: 2, winner: "BRA" }, // undecided
        { round: "quarter", matchNumber: 1, winner: "FRA" },     // undecided
      ],
    });
    const result = calculatePotentialPoints(p);
    // R32_1 decided (2 earned, 0 remaining)
    // R32_2 undecided (2 remaining)
    // QF_1 undecided (6 remaining)
    expect(result.earned).toBe(2);
    expect(result.remaining).toBe(8);
    expect(result.maximum).toBe(10);
  });

  it("returns 0 remaining when all results are in", () => {
    setActualBonusResults({ goldenBoot: "Mbappe" });
    setActualKnockoutResults({
      "round_of_32_1": "GER",
    });
    actualBonusResults.goldenBall = "Messi";

    const p = makeParticipant({
      groupPredictions: [
        { group: "A", order: ["USA", "MEX", "URU", "MAR"] },
      ],
      bonusPicks: {
        goldenBoot: "Mbappe",
        mostGoalsTeam: "GER",
        fewestConcededTeam: "FRA",
        goldenBall: "Messi",
      },
      knockoutPicks: [
        { round: "round_of_32", matchNumber: 1, winner: "GER" },
      ],
    });
    const result = calculatePotentialPoints(p);
    expect(result.remaining).toBe(0);
    expect(result.earned).toBe(result.maximum);

    actualBonusResults.goldenBall = null;
  });

  it("does not count remaining for empty bonus picks", () => {
    const p = makeParticipant({
      bonusPicks: {
        goldenBoot: "",
        mostGoalsTeam: "",
        fewestConcededTeam: "",
        goldenBall: "",
      },
    });
    const result = calculatePotentialPoints(p);
    // No bonus picks made, so 0 bonus remaining
    expect(result.remaining).toBe(0);
  });
});
