import { describe, it, expect } from "vitest";
import { parseLocalDate, schedule, venues, stageLabels } from "../schedule";

describe("parseLocalDate", () => {
  it("parses a date string as local time, not UTC", () => {
    const date = parseLocalDate("2026-06-11");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(5); // June is month 5 (0-indexed)
    expect(date.getDate()).toBe(11);
  });

  it("does not shift to the previous day (UTC midnight issue)", () => {
    const date = parseLocalDate("2026-06-11");
    expect(date.getDate()).toBe(11);
  });

  it("returns midnight local time", () => {
    const date = parseLocalDate("2026-06-11");
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
  });

  it("handles January 1st correctly", () => {
    const date = parseLocalDate("2026-01-01");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(1);
  });

  it("handles December 31st correctly", () => {
    const date = parseLocalDate("2026-12-31");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(11);
    expect(date.getDate()).toBe(31);
  });
});

describe("schedule", () => {
  it("contains the correct number of matches", () => {
    const groupMatches = schedule.filter((m) => m.stage === "group");
    const r32Matches = schedule.filter((m) => m.stage === "round_of_32");
    const r16Matches = schedule.filter((m) => m.stage === "round_of_16");
    const qfMatches = schedule.filter((m) => m.stage === "quarter");
    const sfMatches = schedule.filter((m) => m.stage === "semi");
    const finalMatches = schedule.filter((m) => m.stage === "final");
    const thirdPlace = schedule.filter((m) => m.stage === "third_place");

    expect(groupMatches).toHaveLength(72);
    expect(r32Matches).toHaveLength(16);
    expect(r16Matches).toHaveLength(8);
    expect(qfMatches).toHaveLength(4);
    expect(sfMatches).toHaveLength(2);
    expect(thirdPlace).toHaveLength(1);
    expect(finalMatches).toHaveLength(1);
  });

  it("has unique IDs for all matches", () => {
    const ids = schedule.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("opening match is MEX vs RSA on June 11", () => {
    const opener = schedule[0];
    expect(opener.homeTeam).toBe("MEX");
    expect(opener.awayTeam).toBe("RSA");
    expect(opener.date).toBe("2026-06-11");
  });

  it("final is at MetLife Stadium", () => {
    const final = schedule.find((m) => m.stage === "final");
    expect(final?.venue).toBe("MetLife Stadium");
  });
});

describe("venues", () => {
  it("has 17 venues across 3 countries", () => {
    expect(venues).toHaveLength(17);
    const countries = new Set(venues.map((v) => v.country));
    expect(countries.size).toBe(3);
    expect(countries).toContain("USA");
    expect(countries).toContain("Mexico");
    expect(countries).toContain("Canada");
  });
});

describe("stageLabels", () => {
  it("has labels for all stage types", () => {
    expect(stageLabels.group).toBe("Group Stage");
    expect(stageLabels.round_of_32).toBe("Round of 32");
    expect(stageLabels.round_of_16).toBe("Round of 16");
    expect(stageLabels.quarter).toBe("Quarterfinals");
    expect(stageLabels.semi).toBe("Semifinals");
    expect(stageLabels.third_place).toBe("Third Place");
    expect(stageLabels.final).toBe("Final");
  });
});
