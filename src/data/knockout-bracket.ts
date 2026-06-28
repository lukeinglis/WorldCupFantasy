export interface KnockoutMatchData {
  round: string;
  matchNumber: number;
  homeTeam: string | null;
  awayTeam: string | null;
  utcDate: string;
  status: string;
}

// R32 matchups from FIFA official bracket (verified June 28, 2026)
// Match numbers correspond to the internal ordering within each round (1-16 for R32)
// Sorted by date/time ascending, match numbers assigned in that order
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

// R16 structure: which R32 winners feed into which R16 matches
// Based on FIFA bracket structure
// R16 match 1: W(R32 M4) vs W(R32 M6) => W(GER/PAR) vs W(FRA/SWE)
// R16 match 2: W(R32 M1) vs W(R32 M2) => W(RSA/CAN) vs W(NED/MAR)
// R16 match 3: W(R32 M3) vs W(R32 M5) => W(BRA/JPN) vs W(CIV/NOR)
// R16 match 4: W(R32 M7) vs W(R32 M9) => W(MEX/ECU) vs W(ENG/COD)
// R16 match 5: W(R32 M12) vs W(R32 M11) => W(POR/CRO) vs W(ESP/AUT)
// R16 match 6: W(R32 M8) vs W(R32 M10) => W(USA/BIH) vs W(BEL/SEN)
// R16 match 7: W(R32 M15) vs W(R32 M14) => W(ARG/CPV) vs W(AUS/EGY)
// R16 match 8: W(R32 M13) vs W(R32 M16) => W(SUI/ALG) vs W(COL/GHA)
export const R16_FEED: { r16Match: number; r32HomeMatch: number; r32AwayMatch: number }[] = [
  { r16Match: 1, r32HomeMatch: 4, r32AwayMatch: 6 },
  { r16Match: 2, r32HomeMatch: 1, r32AwayMatch: 2 },
  { r16Match: 3, r32HomeMatch: 3, r32AwayMatch: 5 },
  { r16Match: 4, r32HomeMatch: 7, r32AwayMatch: 9 },
  { r16Match: 5, r32HomeMatch: 12, r32AwayMatch: 11 },
  { r16Match: 6, r32HomeMatch: 8, r32AwayMatch: 10 },
  { r16Match: 7, r32HomeMatch: 15, r32AwayMatch: 14 },
  { r16Match: 8, r32HomeMatch: 13, r32AwayMatch: 16 },
];

export function getAllKnockoutMatches(): KnockoutMatchData[] {
  const matches: KnockoutMatchData[] = [...R32_MATCHES];

  // R16 placeholder matches (teams TBD until R32 finishes)
  for (let i = 1; i <= 8; i++) {
    matches.push({
      round: "round_of_16",
      matchNumber: i,
      homeTeam: null,
      awayTeam: null,
      utcDate: "",
      status: "TIMED",
    });
  }

  // QF placeholders
  for (let i = 1; i <= 4; i++) {
    matches.push({
      round: "quarter",
      matchNumber: i,
      homeTeam: null,
      awayTeam: null,
      utcDate: "",
      status: "TIMED",
    });
  }

  // SF placeholders
  for (let i = 1; i <= 2; i++) {
    matches.push({
      round: "semi",
      matchNumber: i,
      homeTeam: null,
      awayTeam: null,
      utcDate: "",
      status: "TIMED",
    });
  }

  // Third place
  matches.push({
    round: "third_place",
    matchNumber: 1,
    homeTeam: null,
    awayTeam: null,
    utcDate: "",
    status: "TIMED",
  });

  // Final
  matches.push({
    round: "final",
    matchNumber: 1,
    homeTeam: null,
    awayTeam: null,
    utcDate: "",
    status: "TIMED",
  });

  return matches;
}
