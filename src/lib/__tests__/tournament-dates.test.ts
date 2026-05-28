import { describe, it, expect, vi, afterEach } from "vitest";
import {
  TOURNAMENT_START,
  KNOCKOUT_START,
  areTier1PicksRevealed,
  areTier2PicksRevealed,
  formatRevealDate,
} from "../tournament-dates";

describe("tournament date constants", () => {
  it("TOURNAMENT_START is June 11, 2026 19:00 UTC", () => {
    expect(TOURNAMENT_START.getUTCFullYear()).toBe(2026);
    expect(TOURNAMENT_START.getUTCMonth()).toBe(5); // June
    expect(TOURNAMENT_START.getUTCDate()).toBe(11);
    expect(TOURNAMENT_START.getUTCHours()).toBe(19);
  });

  it("KNOCKOUT_START is June 28, 2026 19:00 UTC", () => {
    expect(KNOCKOUT_START.getUTCFullYear()).toBe(2026);
    expect(KNOCKOUT_START.getUTCMonth()).toBe(5);
    expect(KNOCKOUT_START.getUTCDate()).toBe(28);
    expect(KNOCKOUT_START.getUTCHours()).toBe(19);
  });

  it("KNOCKOUT_START is after TOURNAMENT_START", () => {
    expect(KNOCKOUT_START.getTime()).toBeGreaterThan(TOURNAMENT_START.getTime());
  });
});

describe("areTier1PicksRevealed", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false before tournament start", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
    expect(areTier1PicksRevealed()).toBe(false);
  });

  it("returns true at tournament start", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T19:00:00Z"));
    expect(areTier1PicksRevealed()).toBe(true);
  });

  it("returns true after tournament start", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
    expect(areTier1PicksRevealed()).toBe(true);
  });
});

describe("areTier2PicksRevealed", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false before knockout start", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-20T00:00:00Z"));
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

  it("returns false during group stage (before knockout)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
    expect(areTier2PicksRevealed()).toBe(false);
  });
});

describe("formatRevealDate", () => {
  it("formats TOURNAMENT_START correctly", () => {
    const formatted = formatRevealDate(TOURNAMENT_START);
    expect(formatted).toContain("2026");
    expect(formatted).toContain("June");
  });

  it("formats a known date", () => {
    const d = new Date(2026, 11, 25); // Dec 25 in local time
    const formatted = formatRevealDate(d);
    expect(formatted).toContain("2026");
    expect(formatted).toContain("December");
    expect(formatted).toContain("25");
  });
});
