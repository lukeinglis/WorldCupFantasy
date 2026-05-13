export interface Team {
  name: string;
  code: string;
  flag: string;
  group: string;
  confederation: string;
  fifaRanking: number;
  nickname: string;
}

// FIFA World Cup 2026: 48 teams, 12 groups of 4
// Source: football-data.org API (verified May 2026)
// FIFA Rankings: April 1, 2026 release (latest official)
export const teams: Team[] = [
  // Group A: Czechia, Mexico, South Africa, South Korea
  { name: "Czechia", code: "CZE", flag: "🇨🇿", group: "A", confederation: "UEFA", fifaRanking: 41, nickname: "Narodní tým" },
  { name: "Mexico", code: "MEX", flag: "🇲🇽", group: "A", confederation: "CONCACAF", fifaRanking: 15, nickname: "El Tri" },
  { name: "South Africa", code: "RSA", flag: "🇿🇦", group: "A", confederation: "CAF", fifaRanking: 60, nickname: "Bafana Bafana" },
  { name: "South Korea", code: "KOR", flag: "🇰🇷", group: "A", confederation: "AFC", fifaRanking: 25, nickname: "Taegeuk Warriors" },

  // Group B: Bosnia-Herzegovina, Canada, Qatar, Switzerland
  { name: "Bosnia-Herzegovina", code: "BIH", flag: "🇧🇦", group: "B", confederation: "UEFA", fifaRanking: 65, nickname: "Zmajevi" },
  { name: "Canada", code: "CAN", flag: "🇨🇦", group: "B", confederation: "CONCACAF", fifaRanking: 30, nickname: "Les Rouges" },
  { name: "Qatar", code: "QAT", flag: "🇶🇦", group: "B", confederation: "AFC", fifaRanking: 55, nickname: "The Maroons" },
  { name: "Switzerland", code: "SUI", flag: "🇨🇭", group: "B", confederation: "UEFA", fifaRanking: 19, nickname: "Nati" },

  // Group C: Brazil, Morocco, Haiti, Scotland
  { name: "Brazil", code: "BRA", flag: "🇧🇷", group: "C", confederation: "CONMEBOL", fifaRanking: 6, nickname: "Selecao" },
  { name: "Morocco", code: "MAR", flag: "🇲🇦", group: "C", confederation: "CAF", fifaRanking: 8, nickname: "Atlas Lions" },
  { name: "Haiti", code: "HAI", flag: "🇭🇹", group: "C", confederation: "CONCACAF", fifaRanking: 83, nickname: "Les Grenadiers" },
  { name: "Scotland", code: "SCO", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", group: "C", confederation: "UEFA", fifaRanking: 43, nickname: "Tartan Army" },

  // Group D: Turkey, United States, Paraguay, Australia
  { name: "Turkey", code: "TUR", flag: "🇹🇷", group: "D", confederation: "UEFA", fifaRanking: 22, nickname: "Crescent Stars" },
  { name: "United States", code: "USA", flag: "🇺🇸", group: "D", confederation: "CONCACAF", fifaRanking: 16, nickname: "USMNT" },
  { name: "Paraguay", code: "PAR", flag: "🇵🇾", group: "D", confederation: "CONMEBOL", fifaRanking: 40, nickname: "La Albirroja" },
  { name: "Australia", code: "AUS", flag: "🇦🇺", group: "D", confederation: "AFC", fifaRanking: 27, nickname: "Socceroos" },

  // Group E: Germany, Curacao, Ivory Coast, Ecuador
  { name: "Germany", code: "GER", flag: "🇩🇪", group: "E", confederation: "UEFA", fifaRanking: 10, nickname: "Die Mannschaft" },
  { name: "Curacao", code: "CUR", flag: "🇨🇼", group: "E", confederation: "CONCACAF", fifaRanking: 82, nickname: "Team CUR" },
  { name: "Ivory Coast", code: "CIV", flag: "🇨🇮", group: "E", confederation: "CAF", fifaRanking: 34, nickname: "Les Elephants" },
  { name: "Ecuador", code: "ECU", flag: "🇪🇨", group: "E", confederation: "CONMEBOL", fifaRanking: 23, nickname: "La Tri" },

  // Group F: Sweden, Netherlands, Japan, Tunisia
  { name: "Sweden", code: "SWE", flag: "🇸🇪", group: "F", confederation: "UEFA", fifaRanking: 38, nickname: "Blagult" },
  { name: "Netherlands", code: "NED", flag: "🇳🇱", group: "F", confederation: "UEFA", fifaRanking: 7, nickname: "Oranje" },
  { name: "Japan", code: "JPN", flag: "🇯🇵", group: "F", confederation: "AFC", fifaRanking: 18, nickname: "Samurai Blue" },
  { name: "Tunisia", code: "TUN", flag: "🇹🇳", group: "F", confederation: "CAF", fifaRanking: 44, nickname: "Eagles of Carthage" },

  // Group G: Belgium, Egypt, Iran, New Zealand
  { name: "Belgium", code: "BEL", flag: "🇧🇪", group: "G", confederation: "UEFA", fifaRanking: 9, nickname: "Red Devils" },
  { name: "Egypt", code: "EGY", flag: "🇪🇬", group: "G", confederation: "CAF", fifaRanking: 29, nickname: "The Pharaohs" },
  { name: "Iran", code: "IRN", flag: "🇮🇷", group: "G", confederation: "AFC", fifaRanking: 21, nickname: "Team Melli" },
  { name: "New Zealand", code: "NZL", flag: "🇳🇿", group: "G", confederation: "OFC", fifaRanking: 85, nickname: "All Whites" },

  // Group H: Spain, Cape Verde, Saudi Arabia, Uruguay
  { name: "Spain", code: "ESP", flag: "🇪🇸", group: "H", confederation: "UEFA", fifaRanking: 2, nickname: "La Furia Roja" },
  { name: "Cape Verde", code: "CPV", flag: "🇨🇻", group: "H", confederation: "CAF", fifaRanking: 69, nickname: "Blue Sharks" },
  { name: "Saudi Arabia", code: "KSA", flag: "🇸🇦", group: "H", confederation: "AFC", fifaRanking: 61, nickname: "The Green Falcons" },
  { name: "Uruguay", code: "URY", flag: "🇺🇾", group: "H", confederation: "CONMEBOL", fifaRanking: 17, nickname: "La Celeste" },

  // Group I: Iraq, France, Senegal, Norway
  { name: "Iraq", code: "IRQ", flag: "🇮🇶", group: "I", confederation: "AFC", fifaRanking: 57, nickname: "Lions of Mesopotamia" },
  { name: "France", code: "FRA", flag: "🇫🇷", group: "I", confederation: "UEFA", fifaRanking: 1, nickname: "Les Bleus" },
  { name: "Senegal", code: "SEN", flag: "🇸🇳", group: "I", confederation: "CAF", fifaRanking: 14, nickname: "Lions of Teranga" },
  { name: "Norway", code: "NOR", flag: "🇳🇴", group: "I", confederation: "UEFA", fifaRanking: 31, nickname: "Landslaget" },

  // Group J: Argentina, Algeria, Austria, Jordan
  { name: "Argentina", code: "ARG", flag: "🇦🇷", group: "J", confederation: "CONMEBOL", fifaRanking: 3, nickname: "La Albiceleste" },
  { name: "Algeria", code: "ALG", flag: "🇩🇿", group: "J", confederation: "CAF", fifaRanking: 28, nickname: "Les Fennecs" },
  { name: "Austria", code: "AUT", flag: "🇦🇹", group: "J", confederation: "UEFA", fifaRanking: 24, nickname: "Das Team" },
  { name: "Jordan", code: "JOR", flag: "🇯🇴", group: "J", confederation: "AFC", fifaRanking: 63, nickname: "Al-Nashama" },

  // Group K: Congo DR, Portugal, Uzbekistan, Colombia
  { name: "Congo DR", code: "COD", flag: "🇨🇩", group: "K", confederation: "CAF", fifaRanking: 46, nickname: "The Leopards" },
  { name: "Portugal", code: "POR", flag: "🇵🇹", group: "K", confederation: "UEFA", fifaRanking: 5, nickname: "A Selecao" },
  { name: "Uzbekistan", code: "UZB", flag: "🇺🇿", group: "K", confederation: "AFC", fifaRanking: 49, nickname: "White Wolves" },
  { name: "Colombia", code: "COL", flag: "🇨🇴", group: "K", confederation: "CONMEBOL", fifaRanking: 13, nickname: "Los Cafeteros" },

  // Group L: England, Croatia, Ghana, Panama
  { name: "England", code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "L", confederation: "UEFA", fifaRanking: 4, nickname: "Three Lions" },
  { name: "Croatia", code: "CRO", flag: "🇭🇷", group: "L", confederation: "UEFA", fifaRanking: 11, nickname: "Vatreni" },
  { name: "Ghana", code: "GHA", flag: "🇬🇭", group: "L", confederation: "CAF", fifaRanking: 74, nickname: "Black Stars" },
  { name: "Panama", code: "PAN", flag: "🇵🇦", group: "L", confederation: "CONCACAF", fifaRanking: 33, nickname: "Los Canaleros" },
];

export function getTeamsByGroup(): Record<string, Team[]> {
  const groups: Record<string, Team[]> = {};
  for (const team of teams) {
    if (!groups[team.group]) groups[team.group] = [];
    groups[team.group].push(team);
  }
  return groups;
}

export function getTeamByCode(code: string): Team | undefined {
  return teams.find(t => t.code === code);
}

export const groupLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
