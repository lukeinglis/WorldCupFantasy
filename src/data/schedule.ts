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

// Key matches from the tournament schedule
export const schedule: Match[] = [
  // Opening match and select group stage matches
  { id: "m1", date: "2026-06-11", time: "20:00", group: "F", homeTeam: "MEX", awayTeam: "JAM", venue: "Estadio Azteca", city: "Mexico City", stage: "group" },
  { id: "m2", date: "2026-06-11", time: "17:00", group: "A", homeTeam: "USA", awayTeam: "MLI", venue: "SoFi Stadium", city: "Los Angeles", stage: "group" },
  { id: "m3", date: "2026-06-12", time: "14:00", group: "B", homeTeam: "ENG", awayTeam: "CHI", venue: "MetLife Stadium", city: "New York", stage: "group" },
  { id: "m4", date: "2026-06-12", time: "17:00", group: "C", homeTeam: "ARG", awayTeam: "HON", venue: "Hard Rock Stadium", city: "Miami", stage: "group" },
  { id: "m5", date: "2026-06-12", time: "20:00", group: "D", homeTeam: "FRA", awayTeam: "CRC", venue: "AT&T Stadium", city: "Dallas", stage: "group" },
  { id: "m6", date: "2026-06-13", time: "14:00", group: "E", homeTeam: "BRA", awayTeam: "NZL", venue: "Rose Bowl", city: "Pasadena", stage: "group" },
  { id: "m7", date: "2026-06-13", time: "17:00", group: "F", homeTeam: "ESP", awayTeam: "IRN", venue: "Lincoln Financial Field", city: "Philadelphia", stage: "group" },
  { id: "m8", date: "2026-06-13", time: "20:00", group: "G", homeTeam: "GER", awayTeam: "CAN", venue: "BMO Field", city: "Toronto", stage: "group" },
  { id: "m9", date: "2026-06-14", time: "14:00", group: "H", homeTeam: "POR", awayTeam: "PAR", venue: "Lumen Field", city: "Seattle", stage: "group" },
  { id: "m10", date: "2026-06-14", time: "17:00", group: "I", homeTeam: "BEL", awayTeam: "UGA", venue: "NRG Stadium", city: "Houston", stage: "group" },
  { id: "m11", date: "2026-06-14", time: "20:00", group: "J", homeTeam: "ITA", awayTeam: "PAN", venue: "Mercedes-Benz Stadium", city: "Atlanta", stage: "group" },
  { id: "m12", date: "2026-06-15", time: "14:00", group: "K", homeTeam: "SUI", awayTeam: "BOL", venue: "Arrowhead Stadium", city: "Kansas City", stage: "group" },
  { id: "m13", date: "2026-06-15", time: "17:00", group: "L", homeTeam: "POL", awayTeam: "SLV", venue: "Levi's Stadium", city: "San Francisco", stage: "group" },

  // Key knockout stage matches (TBD teams)
  { id: "r32-1", date: "2026-06-28", time: "16:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "MetLife Stadium", city: "New York", stage: "round_of_32" },
  { id: "r16-1", date: "2026-07-04", time: "16:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "AT&T Stadium", city: "Dallas", stage: "round_of_16" },
  { id: "qf-1", date: "2026-07-09", time: "16:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "SoFi Stadium", city: "Los Angeles", stage: "quarter" },
  { id: "sf-1", date: "2026-07-14", time: "20:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "AT&T Stadium", city: "Dallas", stage: "semi" },
  { id: "sf-2", date: "2026-07-15", time: "20:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "MetLife Stadium", city: "New York", stage: "semi" },
  { id: "tp", date: "2026-07-18", time: "16:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "Hard Rock Stadium", city: "Miami", stage: "third_place" },
  { id: "final", date: "2026-07-19", time: "16:00", group: "", homeTeam: "TBD", awayTeam: "TBD", venue: "MetLife Stadium", city: "New York/New Jersey", stage: "final" },
];

export const venues = [
  { name: "MetLife Stadium", city: "East Rutherford, NJ", country: "USA", capacity: 82500 },
  { name: "SoFi Stadium", city: "Inglewood, CA", country: "USA", capacity: 70240 },
  { name: "AT&T Stadium", city: "Arlington, TX", country: "USA", capacity: 80000 },
  { name: "Hard Rock Stadium", city: "Miami Gardens, FL", country: "USA", capacity: 64767 },
  { name: "Rose Bowl", city: "Pasadena, CA", country: "USA", capacity: 88400 },
  { name: "Mercedes-Benz Stadium", city: "Atlanta, GA", country: "USA", capacity: 71000 },
  { name: "NRG Stadium", city: "Houston, TX", country: "USA", capacity: 72220 },
  { name: "Lincoln Financial Field", city: "Philadelphia, PA", country: "USA", capacity: 69328 },
  { name: "Lumen Field", city: "Seattle, WA", country: "USA", capacity: 68740 },
  { name: "Levi's Stadium", city: "Santa Clara, CA", country: "USA", capacity: 68500 },
  { name: "Arrowhead Stadium", city: "Kansas City, MO", country: "USA", capacity: 76416 },
  { name: "Estadio Azteca", city: "Mexico City", country: "Mexico", capacity: 87523 },
  { name: "Estadio BBVA", city: "Monterrey", country: "Mexico", capacity: 53500 },
  { name: "Estadio Akron", city: "Guadalajara", country: "Mexico", capacity: 49850 },
  { name: "BMO Field", city: "Toronto", country: "Canada", capacity: 45736 },
  { name: "BC Place", city: "Vancouver", country: "Canada", capacity: 54500 },
];

export const stageLabels: Record<string, string> = {
  group: "Group Stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter: "Quarterfinals",
  semi: "Semifinals",
  third_place: "Third Place",
  final: "Final",
};
