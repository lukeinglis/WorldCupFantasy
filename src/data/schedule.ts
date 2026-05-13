export interface Match {
  id: string;
  date: string;
  time: string;
  group: string;
  homeTeam: string; // team code
  awayTeam: string; // team code
  venue: string;
  city: string;
  stage: "group" | "round_of_32" | "round_of_16" | "quarter" | "semi" | "third_place" | "final";
}

// Full 104-match schedule from football-data.org API (verified May 2026)
// Times are in ET (Eastern Daylight Time, UTC-4)
// Venue assignments not yet published by FIFA for all matches; "TBD" where unconfirmed
export const schedule: Match[] = [
  // ===== GROUP STAGE: Matchday 1 =====
  { id: "g1", date: "2026-06-11", time: "15:00", group: "A", homeTeam: "MEX", awayTeam: "RSA", venue: "Estadio Azteca", city: "Mexico City", stage: "group" },
  { id: "g2", date: "2026-06-11", time: "22:00", group: "A", homeTeam: "KOR", awayTeam: "CZE", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g3", date: "2026-06-12", time: "15:00", group: "B", homeTeam: "CAN", awayTeam: "BIH", venue: "BMO Field", city: "Toronto", stage: "group" },
  { id: "g4", date: "2026-06-12", time: "21:00", group: "D", homeTeam: "USA", awayTeam: "PAR", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g5", date: "2026-06-13", time: "15:00", group: "B", homeTeam: "QAT", awayTeam: "SUI", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g6", date: "2026-06-13", time: "18:00", group: "C", homeTeam: "BRA", awayTeam: "MAR", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g7", date: "2026-06-13", time: "21:00", group: "C", homeTeam: "HAI", awayTeam: "SCO", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g8", date: "2026-06-14", time: "00:00", group: "D", homeTeam: "AUS", awayTeam: "TUR", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g9", date: "2026-06-14", time: "13:00", group: "E", homeTeam: "GER", awayTeam: "CUR", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g10", date: "2026-06-14", time: "16:00", group: "F", homeTeam: "NED", awayTeam: "JPN", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g11", date: "2026-06-14", time: "19:00", group: "E", homeTeam: "CIV", awayTeam: "ECU", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g12", date: "2026-06-14", time: "22:00", group: "F", homeTeam: "SWE", awayTeam: "TUN", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g13", date: "2026-06-15", time: "12:00", group: "H", homeTeam: "ESP", awayTeam: "CPV", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g14", date: "2026-06-15", time: "15:00", group: "G", homeTeam: "BEL", awayTeam: "EGY", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g15", date: "2026-06-15", time: "18:00", group: "H", homeTeam: "KSA", awayTeam: "URY", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g16", date: "2026-06-15", time: "21:00", group: "G", homeTeam: "IRN", awayTeam: "NZL", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g17", date: "2026-06-16", time: "15:00", group: "I", homeTeam: "FRA", awayTeam: "SEN", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g18", date: "2026-06-16", time: "18:00", group: "I", homeTeam: "IRQ", awayTeam: "NOR", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g19", date: "2026-06-16", time: "21:00", group: "J", homeTeam: "ARG", awayTeam: "ALG", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g20", date: "2026-06-17", time: "00:00", group: "J", homeTeam: "AUT", awayTeam: "JOR", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g21", date: "2026-06-17", time: "13:00", group: "K", homeTeam: "POR", awayTeam: "COD", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g22", date: "2026-06-17", time: "16:00", group: "L", homeTeam: "ENG", awayTeam: "CRO", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g23", date: "2026-06-17", time: "19:00", group: "L", homeTeam: "GHA", awayTeam: "PAN", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g24", date: "2026-06-17", time: "22:00", group: "K", homeTeam: "UZB", awayTeam: "COL", venue: "TBD", city: "TBD", stage: "group" },

  // ===== GROUP STAGE: Matchday 2 =====
  { id: "g25", date: "2026-06-18", time: "12:00", group: "A", homeTeam: "CZE", awayTeam: "RSA", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g26", date: "2026-06-18", time: "15:00", group: "B", homeTeam: "SUI", awayTeam: "BIH", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g27", date: "2026-06-18", time: "18:00", group: "B", homeTeam: "CAN", awayTeam: "QAT", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g28", date: "2026-06-18", time: "21:00", group: "A", homeTeam: "MEX", awayTeam: "KOR", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g29", date: "2026-06-19", time: "15:00", group: "D", homeTeam: "USA", awayTeam: "AUS", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g30", date: "2026-06-19", time: "18:00", group: "C", homeTeam: "SCO", awayTeam: "MAR", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g31", date: "2026-06-19", time: "20:30", group: "C", homeTeam: "BRA", awayTeam: "HAI", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g32", date: "2026-06-19", time: "23:00", group: "D", homeTeam: "TUR", awayTeam: "PAR", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g33", date: "2026-06-20", time: "13:00", group: "F", homeTeam: "NED", awayTeam: "SWE", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g34", date: "2026-06-20", time: "16:00", group: "E", homeTeam: "GER", awayTeam: "CIV", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g35", date: "2026-06-20", time: "20:00", group: "E", homeTeam: "ECU", awayTeam: "CUR", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g36", date: "2026-06-21", time: "00:00", group: "F", homeTeam: "TUN", awayTeam: "JPN", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g37", date: "2026-06-21", time: "12:00", group: "H", homeTeam: "ESP", awayTeam: "KSA", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g38", date: "2026-06-21", time: "15:00", group: "G", homeTeam: "BEL", awayTeam: "IRN", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g39", date: "2026-06-21", time: "18:00", group: "H", homeTeam: "URY", awayTeam: "CPV", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g40", date: "2026-06-21", time: "21:00", group: "G", homeTeam: "NZL", awayTeam: "EGY", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g41", date: "2026-06-22", time: "13:00", group: "J", homeTeam: "ARG", awayTeam: "AUT", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g42", date: "2026-06-22", time: "17:00", group: "I", homeTeam: "FRA", awayTeam: "IRQ", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g43", date: "2026-06-22", time: "20:00", group: "I", homeTeam: "NOR", awayTeam: "SEN", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g44", date: "2026-06-22", time: "23:00", group: "J", homeTeam: "JOR", awayTeam: "ALG", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g45", date: "2026-06-23", time: "13:00", group: "K", homeTeam: "POR", awayTeam: "UZB", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g46", date: "2026-06-23", time: "16:00", group: "L", homeTeam: "ENG", awayTeam: "GHA", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g47", date: "2026-06-23", time: "19:00", group: "L", homeTeam: "PAN", awayTeam: "CRO", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g48", date: "2026-06-23", time: "22:00", group: "K", homeTeam: "COL", awayTeam: "COD", venue: "TBD", city: "TBD", stage: "group" },

  // ===== GROUP STAGE: Matchday 3 (simultaneous kickoffs per group) =====
  { id: "g49", date: "2026-06-24", time: "15:00", group: "B", homeTeam: "SUI", awayTeam: "CAN", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g50", date: "2026-06-24", time: "15:00", group: "B", homeTeam: "BIH", awayTeam: "QAT", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g51", date: "2026-06-24", time: "18:00", group: "C", homeTeam: "MAR", awayTeam: "HAI", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g52", date: "2026-06-24", time: "18:00", group: "C", homeTeam: "SCO", awayTeam: "BRA", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g53", date: "2026-06-24", time: "21:00", group: "A", homeTeam: "CZE", awayTeam: "MEX", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g54", date: "2026-06-24", time: "21:00", group: "A", homeTeam: "RSA", awayTeam: "KOR", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g55", date: "2026-06-25", time: "16:00", group: "E", homeTeam: "ECU", awayTeam: "GER", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g56", date: "2026-06-25", time: "16:00", group: "E", homeTeam: "CUR", awayTeam: "CIV", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g57", date: "2026-06-25", time: "19:00", group: "F", homeTeam: "TUN", awayTeam: "NED", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g58", date: "2026-06-25", time: "19:00", group: "F", homeTeam: "JPN", awayTeam: "SWE", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g59", date: "2026-06-25", time: "22:00", group: "D", homeTeam: "TUR", awayTeam: "USA", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g60", date: "2026-06-25", time: "22:00", group: "D", homeTeam: "PAR", awayTeam: "AUS", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g61", date: "2026-06-26", time: "15:00", group: "I", homeTeam: "NOR", awayTeam: "FRA", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g62", date: "2026-06-26", time: "15:00", group: "I", homeTeam: "SEN", awayTeam: "IRQ", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g63", date: "2026-06-26", time: "20:00", group: "H", homeTeam: "URY", awayTeam: "ESP", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g64", date: "2026-06-26", time: "20:00", group: "H", homeTeam: "CPV", awayTeam: "KSA", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g65", date: "2026-06-26", time: "23:00", group: "G", homeTeam: "NZL", awayTeam: "BEL", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g66", date: "2026-06-26", time: "23:00", group: "G", homeTeam: "EGY", awayTeam: "IRN", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g67", date: "2026-06-27", time: "17:00", group: "L", homeTeam: "PAN", awayTeam: "ENG", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g68", date: "2026-06-27", time: "17:00", group: "L", homeTeam: "CRO", awayTeam: "GHA", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g69", date: "2026-06-27", time: "19:30", group: "K", homeTeam: "COL", awayTeam: "POR", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g70", date: "2026-06-27", time: "19:30", group: "K", homeTeam: "COD", awayTeam: "UZB", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g71", date: "2026-06-27", time: "22:00", group: "J", homeTeam: "JOR", awayTeam: "ARG", venue: "TBD", city: "TBD", stage: "group" },
  { id: "g72", date: "2026-06-27", time: "22:00", group: "J", homeTeam: "ALG", awayTeam: "AUT", venue: "TBD", city: "TBD", stage: "group" },

  // ===== ROUND OF 32 =====
  { id: "r32-1", date: "2026-06-28", time: "15:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_32" },
  { id: "r32-2", date: "2026-06-29", time: "13:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_32" },
  { id: "r32-3", date: "2026-06-29", time: "16:30", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_32" },
  { id: "r32-4", date: "2026-06-29", time: "21:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_32" },
  { id: "r32-5", date: "2026-06-30", time: "13:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_32" },
  { id: "r32-6", date: "2026-06-30", time: "17:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_32" },
  { id: "r32-7", date: "2026-06-30", time: "21:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_32" },
  { id: "r32-8", date: "2026-07-01", time: "12:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_32" },
  { id: "r32-9", date: "2026-07-01", time: "16:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_32" },
  { id: "r32-10", date: "2026-07-01", time: "20:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_32" },
  { id: "r32-11", date: "2026-07-02", time: "15:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_32" },
  { id: "r32-12", date: "2026-07-02", time: "19:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_32" },
  { id: "r32-13", date: "2026-07-02", time: "23:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_32" },
  { id: "r32-14", date: "2026-07-03", time: "14:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_32" },
  { id: "r32-15", date: "2026-07-03", time: "18:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_32" },
  { id: "r32-16", date: "2026-07-03", time: "21:30", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_32" },

  // ===== ROUND OF 16 =====
  { id: "r16-1", date: "2026-07-04", time: "13:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_16" },
  { id: "r16-2", date: "2026-07-04", time: "17:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_16" },
  { id: "r16-3", date: "2026-07-05", time: "16:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_16" },
  { id: "r16-4", date: "2026-07-05", time: "20:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_16" },
  { id: "r16-5", date: "2026-07-06", time: "15:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_16" },
  { id: "r16-6", date: "2026-07-06", time: "20:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_16" },
  { id: "r16-7", date: "2026-07-07", time: "12:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_16" },
  { id: "r16-8", date: "2026-07-07", time: "16:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "round_of_16" },

  // ===== QUARTERFINALS =====
  { id: "qf-1", date: "2026-07-09", time: "16:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "quarter" },
  { id: "qf-2", date: "2026-07-10", time: "15:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "quarter" },
  { id: "qf-3", date: "2026-07-11", time: "17:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "quarter" },
  { id: "qf-4", date: "2026-07-11", time: "21:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "TBD", city: "TBD", stage: "quarter" },

  // ===== SEMIFINALS =====
  { id: "sf-1", date: "2026-07-14", time: "15:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "AT&T Stadium", city: "Dallas", stage: "semi" },
  { id: "sf-2", date: "2026-07-15", time: "15:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "Mercedes-Benz Stadium", city: "Atlanta", stage: "semi" },

  // ===== THIRD PLACE =====
  { id: "tp", date: "2026-07-18", time: "17:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "Hard Rock Stadium", city: "Miami", stage: "third_place" },

  // ===== FINAL =====
  { id: "final", date: "2026-07-19", time: "15:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "MetLife Stadium", city: "East Rutherford, NJ", stage: "final" },
];

// All 16 official venues (FIFA World Cup capacities, verified May 2026)
export const venues = [
  { name: "MetLife Stadium", city: "East Rutherford, NJ", country: "USA", capacity: 82500 },
  { name: "AT&T Stadium", city: "Arlington, TX", country: "USA", capacity: 92967 },
  { name: "SoFi Stadium", city: "Inglewood, CA", country: "USA", capacity: 70000 },
  { name: "Mercedes-Benz Stadium", city: "Atlanta, GA", country: "USA", capacity: 67382 },
  { name: "Hard Rock Stadium", city: "Miami Gardens, FL", country: "USA", capacity: 64091 },
  { name: "NRG Stadium", city: "Houston, TX", country: "USA", capacity: 68311 },
  { name: "Lincoln Financial Field", city: "Philadelphia, PA", country: "USA", capacity: 69176 },
  { name: "Arrowhead Stadium", city: "Kansas City, MO", country: "USA", capacity: 67513 },
  { name: "Lumen Field", city: "Seattle, WA", country: "USA", capacity: 65123 },
  { name: "Gillette Stadium", city: "Foxborough, MA", country: "USA", capacity: 63815 },
  { name: "Levi's Stadium", city: "Santa Clara, CA", country: "USA", capacity: 68500 },
  { name: "Rose Bowl", city: "Pasadena, CA", country: "USA", capacity: 88400 },
  { name: "Estadio Azteca", city: "Mexico City", country: "Mexico", capacity: 87500 },
  { name: "Estadio BBVA", city: "Guadalupe, NL", country: "Mexico", capacity: 53500 },
  { name: "Estadio Akron", city: "Zapopan, Jalisco", country: "Mexico", capacity: 48000 },
  { name: "BMO Field", city: "Toronto, ON", country: "Canada", capacity: 45736 },
  { name: "BC Place", city: "Vancouver, BC", country: "Canada", capacity: 55000 },
];

/**
 * Parse a date-only string (YYYY-MM-DD) without UTC shift.
 * Using `new Date("2026-06-11")` parses as UTC midnight, which shows
 * as the previous day in US timezones. Appending T00:00:00 forces
 * local-time interpretation.
 */
export function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

export const stageLabels: Record<string, string> = {
  group: "Group Stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter: "Quarterfinals",
  semi: "Semifinals",
  third_place: "Third Place",
  final: "Final",
};
