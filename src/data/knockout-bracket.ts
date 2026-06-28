export interface KnockoutMatchData {
  round: string;
  matchNumber: number;
  homeTeam: string | null;
  awayTeam: string | null;
  utcDate: string;
  status: string;
}

// R32 matchups from FIFA official bracket (verified June 28, 2026)
export const R32_MATCHES: KnockoutMatchData[] = [
  { round: "round_of_32", matchNumber: 1, homeTeam: "RSA", awayTeam: "CAN", utcDate: "2026-06-28T19:00:00Z", status: "TIMED" },
  { round: "round_of_32", matchNumber: 2, homeTeam: "NED", awayTeam: "MAR", utcDate: "2026-06-29T01:00:00Z", status: "TIMED" },
  { round: "round_of_32", matchNumber: 3, homeTeam: "BRA", awayTeam: "JPN", utcDate: "2026-06-29T17:00:00Z", status: "TIMED" },
  { round: "round_of_32", matchNumber: 4, homeTeam: "GER", awayTeam: "PAR", utcDate: "2026-06-29T20:30:00Z", status: "TIMED" },
  { round: "round_of_32", matchNumber: 5, homeTeam: "CIV", awayTeam: "NOR", utcDate: "2026-06-30T17:00:00Z", status: "TIMED" },
  { round: "round_of_32", matchNumber: 6, homeTeam: "FRA", awayTeam: "SWE", utcDate: "2026-06-30T21:00:00Z", status: "TIMED" },
  { round: "round_of_32", matchNumber: 7, homeTeam: "MEX", awayTeam: "ECU", utcDate: "2026-07-01T01:00:00Z", status: "TIMED" },
  { round: "round_of_32", matchNumber: 8, homeTeam: "USA", awayTeam: "BIH", utcDate: "2026-07-01T00:00:00Z", status: "TIMED" },
  { round: "round_of_32", matchNumber: 9, homeTeam: "ENG", awayTeam: "COD", utcDate: "2026-07-01T16:00:00Z", status: "TIMED" },
  { round: "round_of_32", matchNumber: 10, homeTeam: "BEL", awayTeam: "SEN", utcDate: "2026-07-01T20:00:00Z", status: "TIMED" },
  { round: "round_of_32", matchNumber: 11, homeTeam: "ESP", awayTeam: "AUT", utcDate: "2026-07-02T19:00:00Z", status: "TIMED" },
  { round: "round_of_32", matchNumber: 12, homeTeam: "POR", awayTeam: "CRO", utcDate: "2026-07-02T23:00:00Z", status: "TIMED" },
  { round: "round_of_32", matchNumber: 13, homeTeam: "SUI", awayTeam: "ALG", utcDate: "2026-07-02T03:00:00Z", status: "TIMED" },
  { round: "round_of_32", matchNumber: 14, homeTeam: "AUS", awayTeam: "EGY", utcDate: "2026-07-03T18:00:00Z", status: "TIMED" },
  { round: "round_of_32", matchNumber: 15, homeTeam: "ARG", awayTeam: "CPV", utcDate: "2026-07-03T22:00:00Z", status: "TIMED" },
  { round: "round_of_32", matchNumber: 16, homeTeam: "COL", awayTeam: "GHA", utcDate: "2026-07-03T01:30:00Z", status: "TIMED" },
];

export function getAllKnockoutMatches(): KnockoutMatchData[] {
  const matches: KnockoutMatchData[] = [...R32_MATCHES];

  for (let i = 1; i <= 8; i++) {
    matches.push({ round: "round_of_16", matchNumber: i, homeTeam: null, awayTeam: null, utcDate: "", status: "TIMED" });
  }
  for (let i = 1; i <= 4; i++) {
    matches.push({ round: "quarter", matchNumber: i, homeTeam: null, awayTeam: null, utcDate: "", status: "TIMED" });
  }
  for (let i = 1; i <= 2; i++) {
    matches.push({ round: "semi", matchNumber: i, homeTeam: null, awayTeam: null, utcDate: "", status: "TIMED" });
  }
  matches.push({ round: "third_place", matchNumber: 1, homeTeam: null, awayTeam: null, utcDate: "", status: "TIMED" });
  matches.push({ round: "final", matchNumber: 1, homeTeam: null, awayTeam: null, utcDate: "", status: "TIMED" });

  return matches;
}
