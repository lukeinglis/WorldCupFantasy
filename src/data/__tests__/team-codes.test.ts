import { describe, it, expect } from "vitest";
import { teams, groupLabels } from "../teams";

const API_TLA_MAP: Record<string, string> = {
  CUW: "CUR",
  URU: "URY",
};

describe("team codes", () => {
  it("every team has a non-empty code", () => {
    for (const team of teams) {
      expect(team.code).toBeTruthy();
    }
  });

  it("no duplicate codes exist", () => {
    const codes = teams.map((t) => t.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it("all group labels A-L have exactly 4 teams", () => {
    for (const label of groupLabels) {
      const groupTeams = teams.filter((t) => t.group === label);
      expect(groupTeams).toHaveLength(4);
    }
  });

  it("API TLA mappings resolve to valid internal codes", () => {
    const internalCodes = new Set(teams.map((t) => t.code));
    for (const [apiCode, internalCode] of Object.entries(API_TLA_MAP)) {
      expect(internalCodes.has(internalCode)).toBe(true);
      expect(apiCode).not.toBe(internalCode);
    }
  });
});
