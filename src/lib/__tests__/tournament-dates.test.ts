import { describe, it, expect, vi, afterEach } from "vitest";
import {
  TOURNAMENT_START,
  KNOCKOUT_START,
  areTier1PicksRevealed,
  areTier2PicksRevealed,
  formatRevealDate,
} from "../tournament-dates";

describe("tournament date constants", () => {
  it("TOURNAMENT_START is June 11, 2026 at 19:00 UTC", () => {
    expect(TOURNAMENT_START.toISOString()).toBe("2026-06-11T19:00:00.000Z");
  });

  it("KNOCKOUT_START is June 28, 2026 at 19:00 UTC", () => {
    expect(KNOCKOUT_START.toISOString()).toBe("2026-06-28T19:00:00.000Z");
  });

  it("knockout starts after tournament start", () => {
    expect(KNOCKOUT_START.getTime()).toBeGreaterThan(TOURNAMENT_START.getTime());
  });
});

describe("areTier1PicksRevealed", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false before tournament start", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T18:59:59Z"));
    expect(areTier1PicksRevealed()).toBe(false);
  });

  it("returns true at tournament start", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T19:00:00Z"));
    expect(areTier1PicksRevealed()).toBe(true);
  });

  it("returns true after tournament start", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T00:00:00Z"));
    expect(areTier1PicksRevealed()).toBe(true);
  });
});

describe("areTier2PicksRevealed", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false before knockout start", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-28T18:59:59Z"));
    expect(areTier2PicksRevealed()).toBe(false);
  });

  it("returns true at knockout start", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-28T19:00:00Z"));
    expect(areTier2PicksRevealed()).toBe(true);
  });

  it("returns true after knockout start", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T00:00:00Z"));
    expect(areTier2PicksRevealed()).toBe(true);
  });

  it("returns false during group stage (after Tier 1 but before Tier 2)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-20T00:00:00Z"));
    expect(areTier1PicksRevealed()).toBe(true);
    expect(areTier2PicksRevealed()).toBe(false);
  });
});

describe("formatRevealDate", () => {
  it("formats TOURNAMENT_START as a readable date string", () => {
    const formatted = formatRevealDate(TOURNAMENT_START);
    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/June/);
  });

  it("formats KNOCKOUT_START as a readable date string", () => {
    const formatted = formatRevealDate(KNOCKOUT_START);
    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/June/);
  });

  it("formats an arbitrary date correctly", () => {
    const date = new Date("2026-01-15T00:00:00Z");
    const formatted = formatRevealDate(date);
    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/January/);
  });
});
