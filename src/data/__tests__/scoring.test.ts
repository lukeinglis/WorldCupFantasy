import { describe, it, expect, beforeEach } from "vitest";
import {
  scoreGroupPrediction,
  scoreTier1Groups,
  scoreTier1Bonus,
  scoreTier2Bracket,
  scoreTier2Bonus,
  calculatePoints,
  calculateAllPoints,
  setActualGroupResults,
  setActualBonusResults,
  actualBonusResults,
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
  beforeEach(() => {
    setActualGroupResults(null);
  });

  it("returns 0 when no actual results exist", () => {
    const p = makeParticipant({
      groupPredictions: [{ group: "A", order: ["USA", "MEX", "CAN", "JPN"] }],
    });
    expect(scoreTier1Groups(p)).toBe(0);
  });

  it("scores all groups correctly", () => {
    setActualGroupResults({
      A: ["USA", "MEX", "CAN", "JPN"],
      B: ["BRA", "ARG", "FRA", "GER"],
    });
    const p = makeParticipant({
      groupPredictions: [
        { group: "A", order: ["USA", "MEX", "CAN", "JPN"] },
        { group: "B", order: ["BRA", "ARG", "FRA", "GER"] },
      ],
    });
    expect(scoreTier1Groups(p)).toBe(24);
  });

  it("ignores groups without actual results", () => {
    setActualGroupResults({ A: ["USA", "MEX", "CAN", "JPN"] });
    const p = makeParticipant({
      groupPredictions: [
        { group: "A", order: ["USA", "MEX", "CAN", "JPN"] },
        { group: "B", order: ["BRA", "ARG", "FRA", "GER"] },
      ],
    });
    expect(scoreTier1Groups(p)).toBe(12);
  });

  it("returns 0 for empty groupPredictions array", () => {
    setActualGroupResults({ A: ["USA", "MEX", "CAN", "JPN"] });
    const p = makeParticipant({ groupPredictions: [] });
    expect(scoreTier1Groups(p)).toBe(0);
  });
});

describe("scoreTier1Bonus", () => {
  beforeEach(() => {
    setActualBonusResults({
      goldenBoot: null,
      mostGoalsTeam: null,
      fewestConcededTeam: null,
    });
  });

  it("returns 0 when no actual bonus results", () => {
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Messi", mostGoalsTeam: "ARG", fewestConcededTeam: "ITA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(0);
  });

  it("scores 10 for correct golden boot", () => {
    setActualBonusResults({ goldenBoot: "Mbappe", mostGoalsTeam: null, fewestConcededTeam: null });
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Mbappe", mostGoalsTeam: "BRA", fewestConcededTeam: "ITA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(10);
  });

  it("scores 10 for correct most goals team", () => {
    setActualBonusResults({ goldenBoot: null, mostGoalsTeam: "GER", fewestConcededTeam: null });
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Messi", mostGoalsTeam: "GER", fewestConcededTeam: "ITA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(10);
  });

  it("scores 10 for correct fewest conceded team", () => {
    setActualBonusResults({ goldenBoot: null, mostGoalsTeam: null, fewestConcededTeam: "FRA" });
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Messi", mostGoalsTeam: "BRA", fewestConcededTeam: "FRA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(10);
  });

  it("scores 30 for all three correct", () => {
    setActualBonusResults({ goldenBoot: "Kane", mostGoalsTeam: "ENG", fewestConcededTeam: "ESP" });
    const p = makeParticipant({
      bonusPicks: { goldenBoot: "Kane", mostGoalsTeam: "ENG", fewestConcededTeam: "ESP", goldenBall: "" },
    });
    expect(scoreTier1Bonus(p)).toBe(30);
  });

  it("scores 0 for all wrong", () => {
    setActualBonusResults({ goldenBoot: "Kane", mostGoalsTeam: "ENG", fewestConcededTeam: "ESP" });
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
    setActualGroupResults(null);
    setActualBonusResults({ goldenBoot: null, mostGoalsTeam: null, fewestConcededTeam: null });
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
    setActualGroupResults({ A: ["USA", "MEX", "CAN", "JPN"] });
    setActualBonusResults({ goldenBoot: "Kane", mostGoalsTeam: null, fewestConcededTeam: null });
    const p = makeParticipant({
      groupPredictions: [{ group: "A", order: ["USA", "MEX", "CAN", "JPN"] }],
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
    setActualGroupResults(null);
    setActualBonusResults({ goldenBoot: null, mostGoalsTeam: null, fewestConcededTeam: null });
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
