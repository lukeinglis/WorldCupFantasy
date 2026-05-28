import { describe, it, expect } from "vitest";
import { schedule, venues, parseLocalDate, stageLabels } from "../schedule";

describe("parseLocalDate", () => {
  it("parses a date string without UTC shift", () => {
    const d = parseLocalDate("2026-06-11");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(5); // June = 5
    expect(d.getDate()).toBe(11);
  });

  it("returns midnight in local time, not UTC", () => {
    const d = parseLocalDate("2026-06-11");
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
  });

  it("handles year boundaries", () => {
    const d = parseLocalDate("2026-01-01");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it("handles end-of-month dates", () => {
    const d = parseLocalDate("2026-02-28");
    expect(d.getDate()).toBe(28);
    expect(d.getMonth()).toBe(1);
  });

  it("handles December 31", () => {
    const d = parseLocalDate("2026-12-31");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(11);
    expect(d.getDate()).toBe(31);
  });
});

describe("schedule data", () => {
  it("contains 104 matches", () => {
    expect(schedule).toHaveLength(104);
  });

  it("has 72 group stage matches", () => {
    const groupMatches = schedule.filter((m) => m.stage === "group");
    expect(groupMatches).toHaveLength(72);
  });

  it("has 16 round of 32 matches", () => {
    const r32 = schedule.filter((m) => m.stage === "round_of_32");
    expect(r32).toHaveLength(16);
  });

  it("has 8 round of 16 matches", () => {
    const r16 = schedule.filter((m) => m.stage === "round_of_16");
    expect(r16).toHaveLength(8);
  });

  it("has 4 quarterfinals", () => {
    const qf = schedule.filter((m) => m.stage === "quarter");
    expect(qf).toHaveLength(4);
  });

  it("has 2 semifinals", () => {
    const sf = schedule.filter((m) => m.stage === "semi");
    expect(sf).toHaveLength(2);
  });

  it("has 1 final", () => {
    const finals = schedule.filter((m) => m.stage === "final");
    expect(finals).toHaveLength(1);
  });

  it("has 1 third place match", () => {
    const tp = schedule.filter((m) => m.stage === "third_place");
    expect(tp).toHaveLength(1);
  });

  it("all matches have required fields", () => {
    for (const m of schedule) {
      expect(m.id).toBeTruthy();
      expect(m.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(m.time).toMatch(/^\d{2}:\d{2}$/);
      expect(m.stage).toBeTruthy();
    }
  });

  it("final is at MetLife Stadium", () => {
    const final = schedule.find((m) => m.stage === "final");
    expect(final?.venue).toBe("MetLife Stadium");
  });

  it("opening match is MEX vs RSA on June 11", () => {
    const opener = schedule[0];
    expect(opener.homeTeam).toBe("MEX");
    expect(opener.awayTeam).toBe("RSA");
    expect(opener.date).toBe("2026-06-11");
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

  it("all venues have positive capacity", () => {
    for (const v of venues) {
      expect(v.capacity).toBeGreaterThan(0);
    }
  });
});

describe("stageLabels", () => {
  it("has labels for all stages", () => {
    expect(stageLabels["group"]).toBe("Group Stage");
    expect(stageLabels["round_of_32"]).toBe("Round of 32");
    expect(stageLabels["round_of_16"]).toBe("Round of 16");
    expect(stageLabels["quarter"]).toBe("Quarterfinals");
    expect(stageLabels["semi"]).toBe("Semifinals");
    expect(stageLabels["third_place"]).toBe("Third Place");
    expect(stageLabels["final"]).toBe("Final");
  });
});
