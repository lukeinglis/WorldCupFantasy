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
} from "../participants";

describe("scoring constants", () => {
  it("TIER1_MAX equals sum of tier1 category maxPoints", () => {
    const sum = tier1Categories.reduce((acc, c) => acc + c.maxPoints, 0);
    expect(sum).toBe(TIER1_MAX);
  });

  it("TIER2_MAX equals sum of tier2 category maxPoints", () => {
    const sum = tier2Categories.reduce((acc, c) => acc + c.maxPoints, 0);
    expect(sum).toBe(TIER2_MAX);
  });

  it("OVERALL_MAX equals TIER1_MAX + TIER2_MAX", () => {
    expect(OVERALL_MAX).toBe(TIER1_MAX + TIER2_MAX);
  });

  it("TIER1_MAX is 174 (144 group + 30 bonus)", () => {
    expect(TIER1_MAX).toBe(174);
  });

  it("TIER2_MAX is 124 (114 bracket + 10 golden ball)", () => {
    expect(TIER2_MAX).toBe(124);
  });

  it("OVERALL_MAX is 298", () => {
    expect(OVERALL_MAX).toBe(298);
  });
});

describe("knockoutRoundPoints", () => {
  it("has correct point values for each round", () => {
    expect(knockoutRoundPoints.round_of_32).toBe(2);
    expect(knockoutRoundPoints.round_of_16).toBe(4);
    expect(knockoutRoundPoints.quarter).toBe(6);
    expect(knockoutRoundPoints.semi).toBe(8);
    expect(knockoutRoundPoints.final).toBe(10);
  });

  it("total max bracket score is 114", () => {
    let total = 0;
    for (const [round, pts] of Object.entries(knockoutRoundPoints)) {
      total += pts * (knockoutRoundMatchCounts[round] ?? 0);
    }
    expect(total).toBe(114);
  });
});

describe("knockoutRoundMatchCounts", () => {
  it("has correct match counts", () => {
    expect(knockoutRoundMatchCounts.round_of_32).toBe(16);
    expect(knockoutRoundMatchCounts.round_of_16).toBe(8);
    expect(knockoutRoundMatchCounts.quarter).toBe(4);
    expect(knockoutRoundMatchCounts.semi).toBe(2);
    expect(knockoutRoundMatchCounts.final).toBe(1);
  });

  it("total knockout matches is 31", () => {
    const total = Object.values(knockoutRoundMatchCounts).reduce((a, b) => a + b, 0);
    expect(total).toBe(31);
  });
});

describe("getCurrentPhase", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns pre_tournament before June 11, 2026", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
    expect(getCurrentPhase()).toBe("pre_tournament");
  });

  it("returns group_stage after tournament starts but before knockout", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T00:00:00Z"));
    expect(getCurrentPhase()).toBe("group_stage");
  });

  it("returns knockout after knockout stage begins", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T00:00:00Z"));
    expect(getCurrentPhase()).toBe("knockout");
  });

  it("returns complete after the final", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-20T00:00:00Z"));
    expect(getCurrentPhase()).toBe("complete");
  });

  it("returns group_stage at exact tournament start time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T19:00:00Z"));
    expect(getCurrentPhase()).toBe("group_stage");
  });

  it("returns knockout at exact knockout start time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-28T19:00:00Z"));
    expect(getCurrentPhase()).toBe("knockout");
  });
});
