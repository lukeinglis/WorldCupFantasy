import { describe, it, expect, vi, afterEach } from "vitest";
import {
  tier1Categories,
  tier2Categories,
  TIER1_MAX,
  TIER2_MAX,
  OVERALL_MAX,
  knockoutRoundPoints,
  knockoutRoundMatchCounts,
  getCurrentPhase,
  getGoldenBootDistribution,
  getGroupWinnerDistribution,
  participants,
} from "../participants";
import type { Participant } from "../participants";

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

describe("scoring constants validation", () => {
  it("TIER1_MAX equals sum of tier1 category maxPoints", () => {
    const sum = tier1Categories.reduce((acc, cat) => acc + cat.maxPoints, 0);
    expect(sum).toBe(TIER1_MAX);
  });

  it("TIER2_MAX equals sum of tier2 category maxPoints", () => {
    const sum = tier2Categories.reduce((acc, cat) => acc + cat.maxPoints, 0);
    expect(sum).toBe(TIER2_MAX);
  });

  it("OVERALL_MAX equals TIER1_MAX + TIER2_MAX", () => {
    expect(OVERALL_MAX).toBe(TIER1_MAX + TIER2_MAX);
  });

  it("knockout round points has all six rounds", () => {
    expect(Object.keys(knockoutRoundPoints)).toEqual(
      expect.arrayContaining(["round_of_32", "round_of_16", "quarter", "semi", "third_place", "final"])
    );
  });

  it("knockout round points increase by round", () => {
    expect(knockoutRoundPoints.round_of_32).toBeLessThan(knockoutRoundPoints.round_of_16);
    expect(knockoutRoundPoints.round_of_16).toBeLessThan(knockoutRoundPoints.quarter);
    expect(knockoutRoundPoints.quarter).toBeLessThan(knockoutRoundPoints.semi);
    expect(knockoutRoundPoints.semi).toBeLessThanOrEqual(knockoutRoundPoints.final);
    expect(knockoutRoundPoints.third_place).toBe(knockoutRoundPoints.semi);
  });

  it("knockout match counts are correct for 48-team bracket", () => {
    expect(knockoutRoundMatchCounts.round_of_32).toBe(16);
    expect(knockoutRoundMatchCounts.round_of_16).toBe(8);
    expect(knockoutRoundMatchCounts.quarter).toBe(4);
    expect(knockoutRoundMatchCounts.semi).toBe(2);
    expect(knockoutRoundMatchCounts.third_place).toBe(1);
    expect(knockoutRoundMatchCounts.final).toBe(1);
  });

  it("tier1 categories have unique IDs", () => {
    const ids = tier1Categories.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("tier2 categories have unique IDs", () => {
    const ids = tier2Categories.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getCurrentPhase", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns pre_tournament before June 11, 2026", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    expect(getCurrentPhase()).toBe("pre_tournament");
  });

  it("returns group_stage during group matches", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
    expect(getCurrentPhase()).toBe("group_stage");
  });

  it("returns knockout after June 28, 2026", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-05T12:00:00Z"));
    expect(getCurrentPhase()).toBe("knockout");
  });

  it("returns complete after July 19, 2026", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-20T00:00:00Z"));
    expect(getCurrentPhase()).toBe("complete");
  });

  it("returns group_stage at exact tournament start", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T19:00:00Z"));
    expect(getCurrentPhase()).toBe("group_stage");
  });
});

describe("getGoldenBootDistribution", () => {
  it("returns empty object when no participants", () => {
    participants.length = 0;
    expect(getGoldenBootDistribution()).toEqual({});
  });

  it("counts golden boot picks correctly", () => {
    participants.length = 0;
    participants.push(
      makeParticipant({ id: "1", bonusPicks: { goldenBoot: "Mbappe", mostGoalsTeam: "", fewestConcededTeam: "", goldenBall: "" } }),
      makeParticipant({ id: "2", bonusPicks: { goldenBoot: "Mbappe", mostGoalsTeam: "", fewestConcededTeam: "", goldenBall: "" } }),
      makeParticipant({ id: "3", bonusPicks: { goldenBoot: "Kane", mostGoalsTeam: "", fewestConcededTeam: "", goldenBall: "" } })
    );
    const dist = getGoldenBootDistribution();
    expect(dist["Mbappe"]).toBe(2);
    expect(dist["Kane"]).toBe(1);
    participants.length = 0;
  });
});

describe("getGroupWinnerDistribution", () => {
  it("returns empty object when no participants", () => {
    participants.length = 0;
    expect(getGroupWinnerDistribution("A")).toEqual({});
  });

  it("counts 1st place picks per group", () => {
    participants.length = 0;
    participants.push(
      makeParticipant({
        id: "1",
        groupPredictions: [{ group: "A", order: ["USA", "MEX", "CAN", "JPN"] }],
      }),
      makeParticipant({
        id: "2",
        groupPredictions: [{ group: "A", order: ["BRA", "MEX", "CAN", "JPN"] }],
      }),
      makeParticipant({
        id: "3",
        groupPredictions: [{ group: "A", order: ["USA", "BRA", "CAN", "JPN"] }],
      })
    );
    const dist = getGroupWinnerDistribution("A");
    expect(dist["USA"]).toBe(2);
    expect(dist["BRA"]).toBe(1);
    participants.length = 0;
  });

  it("ignores participants without the requested group", () => {
    participants.length = 0;
    participants.push(
      makeParticipant({
        id: "1",
        groupPredictions: [{ group: "B", order: ["FRA", "GER", "ESP", "ITA"] }],
      })
    );
    expect(getGroupWinnerDistribution("A")).toEqual({});
    participants.length = 0;
  });
});
