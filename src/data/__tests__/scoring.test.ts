import { describe, it, expect, beforeEach } from "vitest";
import {
  scoreGroupPrediction,
  scoreTier1Groups,
  scoreTier1Bonus,
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
    const prediction: GroupPrediction = { group: "A", order: ["MEX", "KOR", "CZE", "RSA"] };
    const actual: [string, string, string, string] = ["MEX", "KOR", "CZE", "RSA"];
    expect(scoreGroupPrediction(prediction, actual)).toBe(12);
  });

  it("scores 0 when all positions are wrong and buckets are wrong", () => {
    const prediction: GroupPrediction = { group: "A", order: ["CZE", "RSA", "MEX", "KOR"] };
    const actual: [string, string, string, string] = ["MEX", "KOR", "CZE", "RSA"];
    expect(scoreGroupPrediction(prediction, actual)).toBe(0);
  });

  it("scores 1 per team for correct bucket but wrong position", () => {
    const prediction: GroupPrediction = { group: "A", order: ["KOR", "MEX", "RSA", "CZE"] };
    const actual: [string, string, string, string] = ["MEX", "KOR", "RSA", "CZE"];
    // KOR predicted 1st, actual 2nd -> bucket correct (both advance) = 1
    // MEX predicted 2nd, actual 1st -> bucket correct = 1
    // RSA predicted 3rd, actual 3rd -> exact = 3
    // CZE predicted 4th, actual 4th -> exact = 3
    expect(scoreGroupPrediction(prediction, actual)).toBe(8);
  });

  it("scores 3 for an exact match at one position", () => {
    const prediction: GroupPrediction = { group: "A", order: ["MEX", "RSA", "KOR", "CZE"] };
    const actual: [string, string, string, string] = ["MEX", "KOR", "CZE", "RSA"];
    // MEX: exact at 0 = 3
    // RSA: predicted 2nd (advance), actual 4th (exit) = 0
    // KOR: predicted 3rd (exit), actual 2nd (advance) = 0
    // CZE: predicted 4th (exit), actual 3rd (exit) = bucket correct = 1
    expect(scoreGroupPrediction(prediction, actual)).toBe(4);
  });

  it("scores 4 for all teams in correct bucket but no exact positions", () => {
    const prediction: GroupPrediction = { group: "A", order: ["KOR", "MEX", "RSA", "CZE"] };
    const actual: [string, string, string, string] = ["MEX", "KOR", "CZE", "RSA"];
    // KOR: predicted 1st, actual 2nd -> bucket match = 1
    // MEX: predicted 2nd, actual 1st -> bucket match = 1
    // RSA: predicted 3rd, actual 4th -> bucket match = 1
    // CZE: predicted 4th, actual 3rd -> bucket match = 1
    expect(scoreGroupPrediction(prediction, actual)).toBe(4);
  });

  it("handles a team not found in actual (returns 0 for that team)", () => {
    const prediction: GroupPrediction = { group: "A", order: ["XXX", "MEX", "KOR", "CZE"] };
    const actual: [string, string, string, string] = ["MEX", "KOR", "CZE", "RSA"];
    // XXX not found -> 0
    // MEX: predicted 2nd, actual 1st -> bucket = 1
    // KOR: predicted 3rd, actual 2nd -> cross-bucket = 0
    // CZE: predicted 4th, actual 3rd -> bucket = 1
    expect(scoreGroupPrediction(prediction, actual)).toBe(2);
  });

  it("scores partial matches correctly", () => {
    const prediction: GroupPrediction = { group: "B", order: ["BRA", "ARG", "GER", "FRA"] };
    const actual: [string, string, string, string] = ["BRA", "GER", "ARG", "FRA"];
    // BRA: exact at 0 = 3
    // ARG: predicted 2nd (advance), actual 3rd (exit) = 0
    // GER: predicted 3rd (exit), actual 2nd (advance) = 0
    // FRA: exact at 3 = 3
    expect(scoreGroupPrediction(prediction, actual)).toBe(6);
  });
});

describe("scoreTier1Groups", () => {
  beforeEach(() => {
    setActualGroupResults(null);
  });

  it("returns 0 when no actual results exist", () => {
    const participant = makeParticipant({
      groupPredictions: [{ group: "A", order: ["MEX", "KOR", "CZE", "RSA"] }],
    });
    expect(scoreTier1Groups(participant)).toBe(0);
  });

  it("sums scores across multiple groups", () => {
    setActualGroupResults({
      A: ["MEX", "KOR", "CZE", "RSA"],
      B: ["BRA", "GER", "ARG", "FRA"],
    });
    const participant = makeParticipant({
      groupPredictions: [
        { group: "A", order: ["MEX", "KOR", "CZE", "RSA"] },
        { group: "B", order: ["BRA", "GER", "ARG", "FRA"] },
      ],
    });
    expect(scoreTier1Groups(participant)).toBe(24);
  });

  it("skips groups without actual results", () => {
    setActualGroupResults({
      A: ["MEX", "KOR", "CZE", "RSA"],
    });
    const participant = makeParticipant({
      groupPredictions: [
        { group: "A", order: ["MEX", "KOR", "CZE", "RSA"] },
        { group: "B", order: ["BRA", "GER", "ARG", "FRA"] },
      ],
    });
    expect(scoreTier1Groups(participant)).toBe(12);
  });
});

describe("scoreTier1Bonus", () => {
  beforeEach(() => {
    setActualBonusResults({ goldenBoot: null, mostGoalsTeam: null, fewestConcededTeam: null });
  });

  it("returns 0 when no actual bonus results exist", () => {
    const participant = makeParticipant({
      bonusPicks: { goldenBoot: "Mbappe", mostGoalsTeam: "FRA", fewestConcededTeam: "ITA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(participant)).toBe(0);
  });

  it("awards 10 pts for correct Golden Boot", () => {
    setActualBonusResults({ goldenBoot: "Mbappe", mostGoalsTeam: null, fewestConcededTeam: null });
    const participant = makeParticipant({
      bonusPicks: { goldenBoot: "Mbappe", mostGoalsTeam: "FRA", fewestConcededTeam: "ITA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(participant)).toBe(10);
  });

  it("awards 10 pts for correct Most Goals Team", () => {
    setActualBonusResults({ goldenBoot: null, mostGoalsTeam: "FRA", fewestConcededTeam: null });
    const participant = makeParticipant({
      bonusPicks: { goldenBoot: "Nobody", mostGoalsTeam: "FRA", fewestConcededTeam: "ITA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(participant)).toBe(10);
  });

  it("awards 10 pts for correct Fewest Conceded Team", () => {
    setActualBonusResults({ goldenBoot: null, mostGoalsTeam: null, fewestConcededTeam: "ITA" });
    const participant = makeParticipant({
      bonusPicks: { goldenBoot: "Nobody", mostGoalsTeam: "GER", fewestConcededTeam: "ITA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(participant)).toBe(10);
  });

  it("awards 30 pts for all three correct", () => {
    setActualBonusResults({ goldenBoot: "Mbappe", mostGoalsTeam: "FRA", fewestConcededTeam: "ITA" });
    const participant = makeParticipant({
      bonusPicks: { goldenBoot: "Mbappe", mostGoalsTeam: "FRA", fewestConcededTeam: "ITA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(participant)).toBe(30);
  });

  it("awards 0 when all predictions are wrong", () => {
    setActualBonusResults({ goldenBoot: "Mbappe", mostGoalsTeam: "FRA", fewestConcededTeam: "ITA" });
    const participant = makeParticipant({
      bonusPicks: { goldenBoot: "Ronaldo", mostGoalsTeam: "GER", fewestConcededTeam: "BRA", goldenBall: "" },
    });
    expect(scoreTier1Bonus(participant)).toBe(0);
  });
});

describe("scoreTier2Bonus", () => {
  beforeEach(() => {
    actualBonusResults.goldenBall = null;
  });

  it("returns 0 when no Golden Ball result exists", () => {
    const participant = makeParticipant({
      bonusPicks: { goldenBoot: "", mostGoalsTeam: "", fewestConcededTeam: "", goldenBall: "Messi" },
    });
    expect(scoreTier2Bonus(participant)).toBe(0);
  });

  it("awards 10 pts for correct Golden Ball pick", () => {
    actualBonusResults.goldenBall = "Messi";
    const participant = makeParticipant({
      bonusPicks: { goldenBoot: "", mostGoalsTeam: "", fewestConcededTeam: "", goldenBall: "Messi" },
    });
    expect(scoreTier2Bonus(participant)).toBe(10);
  });

  it("awards 0 for incorrect Golden Ball pick", () => {
    actualBonusResults.goldenBall = "Messi";
    const participant = makeParticipant({
      bonusPicks: { goldenBoot: "", mostGoalsTeam: "", fewestConcededTeam: "", goldenBall: "Ronaldo" },
    });
    expect(scoreTier2Bonus(participant)).toBe(0);
  });
});

describe("calculatePoints", () => {
  beforeEach(() => {
    setActualGroupResults(null);
    setActualBonusResults({ goldenBoot: null, mostGoalsTeam: null, fewestConcededTeam: null });
    actualBonusResults.goldenBall = null;
  });

  it("returns all zeros when no results exist", () => {
    const participant = makeParticipant();
    const pts = calculatePoints(participant);
    expect(pts).toEqual({
      tier1Groups: 0,
      tier1Bonus: 0,
      tier2Bracket: 0,
      tier2Bonus: 0,
      total: 0,
    });
  });

  it("sums tier1Groups + tier1Bonus + tier2Bonus into total", () => {
    setActualGroupResults({ A: ["MEX", "KOR", "CZE", "RSA"] });
    setActualBonusResults({ goldenBoot: "Mbappe", mostGoalsTeam: null, fewestConcededTeam: null });
    actualBonusResults.goldenBall = "Messi";

    const participant = makeParticipant({
      groupPredictions: [{ group: "A", order: ["MEX", "KOR", "CZE", "RSA"] }],
      bonusPicks: { goldenBoot: "Mbappe", mostGoalsTeam: "GER", fewestConcededTeam: "ITA", goldenBall: "Messi" },
    });
    const pts = calculatePoints(participant);
    expect(pts.tier1Groups).toBe(12);
    expect(pts.tier1Bonus).toBe(10);
    expect(pts.tier2Bracket).toBe(0);
    expect(pts.tier2Bonus).toBe(10);
    expect(pts.total).toBe(32);
  });
});

describe("calculateAllPoints", () => {
  beforeEach(() => {
    setActualGroupResults({ A: ["MEX", "KOR", "CZE", "RSA"] });
    setActualBonusResults({ goldenBoot: null, mostGoalsTeam: null, fewestConcededTeam: null });
    actualBonusResults.goldenBall = null;
  });

  it("attaches calculatedPoints to each participant", () => {
    const p1 = makeParticipant({
      id: "p1",
      groupPredictions: [{ group: "A", order: ["MEX", "KOR", "CZE", "RSA"] }],
    });
    const p2 = makeParticipant({
      id: "p2",
      groupPredictions: [{ group: "A", order: ["RSA", "CZE", "KOR", "MEX"] }],
    });
    const results = calculateAllPoints([p1, p2]);
    expect(results).toHaveLength(2);
    expect(results[0].calculatedPoints.tier1Groups).toBe(12);
    expect(results[1].calculatedPoints.tier1Groups).toBe(0);
  });
});
