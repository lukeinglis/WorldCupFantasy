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
// Groups are speculative/projected based on qualification as of early 2026
export const teams: Team[] = [
  // Group A
  { name: "United States", code: "USA", flag: "🇺🇸", group: "A", confederation: "CONCACAF", fifaRanking: 11, nickname: "USMNT" },
  { name: "Morocco", code: "MAR", flag: "🇲🇦", group: "A", confederation: "CAF", fifaRanking: 14, nickname: "Atlas Lions" },
  { name: "Ecuador", code: "ECU", flag: "🇪🇨", group: "A", confederation: "CONMEBOL", fifaRanking: 33, nickname: "La Tri" },
  { name: "Mali", code: "MLI", flag: "🇲🇱", group: "A", confederation: "CAF", fifaRanking: 48, nickname: "Les Aigles" },

  // Group B
  { name: "England", code: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", group: "B", confederation: "UEFA", fifaRanking: 4, nickname: "Three Lions" },
  { name: "Japan", code: "JPN", flag: "🇯🇵", group: "B", confederation: "AFC", fifaRanking: 15, nickname: "Samurai Blue" },
  { name: "Senegal", code: "SEN", flag: "🇸🇳", group: "B", confederation: "CAF", fifaRanking: 21, nickname: "Lions of Teranga" },
  { name: "Chile", code: "CHI", flag: "🇨🇱", group: "B", confederation: "CONMEBOL", fifaRanking: 35, nickname: "La Roja" },

  // Group C
  { name: "Argentina", code: "ARG", flag: "🇦🇷", group: "C", confederation: "CONMEBOL", fifaRanking: 1, nickname: "La Albiceleste" },
  { name: "Australia", code: "AUS", flag: "🇦🇺", group: "C", confederation: "AFC", fifaRanking: 24, nickname: "Socceroos" },
  { name: "Nigeria", code: "NGA", flag: "🇳🇬", group: "C", confederation: "CAF", fifaRanking: 28, nickname: "Super Eagles" },
  { name: "Honduras", code: "HON", flag: "🇭🇳", group: "C", confederation: "CONCACAF", fifaRanking: 76, nickname: "Los Catrachos" },

  // Group D
  { name: "France", code: "FRA", flag: "🇫🇷", group: "D", confederation: "UEFA", fifaRanking: 2, nickname: "Les Bleus" },
  { name: "South Korea", code: "KOR", flag: "🇰🇷", group: "D", confederation: "AFC", fifaRanking: 22, nickname: "Taegeuk Warriors" },
  { name: "Cameroon", code: "CMR", flag: "🇨🇲", group: "D", confederation: "CAF", fifaRanking: 44, nickname: "Indomitable Lions" },
  { name: "Costa Rica", code: "CRC", flag: "🇨🇷", group: "D", confederation: "CONCACAF", fifaRanking: 52, nickname: "Los Ticos" },

  // Group E
  { name: "Brazil", code: "BRA", flag: "🇧🇷", group: "E", confederation: "CONMEBOL", fifaRanking: 5, nickname: "Selecao" },
  { name: "Colombia", code: "COL", flag: "🇨🇴", group: "E", confederation: "CONMEBOL", fifaRanking: 12, nickname: "Los Cafeteros" },
  { name: "Turkey", code: "TUR", flag: "🇹🇷", group: "E", confederation: "UEFA", fifaRanking: 26, nickname: "Crescent Stars" },
  { name: "New Zealand", code: "NZL", flag: "🇳🇿", group: "E", confederation: "OFC", fifaRanking: 93, nickname: "All Whites" },

  // Group F
  { name: "Spain", code: "ESP", flag: "🇪🇸", group: "F", confederation: "UEFA", fifaRanking: 3, nickname: "La Furia Roja" },
  { name: "Mexico", code: "MEX", flag: "🇲🇽", group: "F", confederation: "CONCACAF", fifaRanking: 16, nickname: "El Tri" },
  { name: "Iran", code: "IRN", flag: "🇮🇷", group: "F", confederation: "AFC", fifaRanking: 20, nickname: "Team Melli" },
  { name: "Jamaica", code: "JAM", flag: "🇯🇲", group: "F", confederation: "CONCACAF", fifaRanking: 62, nickname: "Reggae Boyz" },

  // Group G
  { name: "Germany", code: "GER", flag: "🇩🇪", group: "G", confederation: "UEFA", fifaRanking: 6, nickname: "Die Mannschaft" },
  { name: "Uruguay", code: "URU", flag: "🇺🇾", group: "G", confederation: "CONMEBOL", fifaRanking: 9, nickname: "La Celeste" },
  { name: "Saudi Arabia", code: "KSA", flag: "🇸🇦", group: "G", confederation: "AFC", fifaRanking: 56, nickname: "The Green Falcons" },
  { name: "Canada", code: "CAN", flag: "🇨🇦", group: "G", confederation: "CONCACAF", fifaRanking: 40, nickname: "Les Rouges" },

  // Group H
  { name: "Portugal", code: "POR", flag: "🇵🇹", group: "H", confederation: "UEFA", fifaRanking: 7, nickname: "A Selecao" },
  { name: "Netherlands", code: "NED", flag: "🇳🇱", group: "H", confederation: "UEFA", fifaRanking: 8, nickname: "Oranje" },
  { name: "Ghana", code: "GHA", flag: "🇬🇭", group: "H", confederation: "CAF", fifaRanking: 36, nickname: "Black Stars" },
  { name: "Paraguay", code: "PAR", flag: "🇵🇾", group: "H", confederation: "CONMEBOL", fifaRanking: 58, nickname: "La Albirroja" },

  // Group I
  { name: "Belgium", code: "BEL", flag: "🇧🇪", group: "I", confederation: "UEFA", fifaRanking: 10, nickname: "Red Devils" },
  { name: "Croatia", code: "CRO", flag: "🇭🇷", group: "I", confederation: "UEFA", fifaRanking: 13, nickname: "Vatreni" },
  { name: "Peru", code: "PER", flag: "🇵🇪", group: "I", confederation: "CONMEBOL", fifaRanking: 31, nickname: "La Blanquirroja" },
  { name: "Uganda", code: "UGA", flag: "🇺🇬", group: "I", confederation: "CAF", fifaRanking: 82, nickname: "The Cranes" },

  // Group J
  { name: "Italy", code: "ITA", flag: "🇮🇹", group: "J", confederation: "UEFA", fifaRanking: 27, nickname: "Gli Azzurri" },
  { name: "Denmark", code: "DEN", flag: "🇩🇰", group: "J", confederation: "UEFA", fifaRanking: 18, nickname: "Danish Dynamite" },
  { name: "Egypt", code: "EGY", flag: "🇪🇬", group: "J", confederation: "CAF", fifaRanking: 37, nickname: "The Pharaohs" },
  { name: "Panama", code: "PAN", flag: "🇵🇦", group: "J", confederation: "CONCACAF", fifaRanking: 45, nickname: "Los Canaleros" },

  // Group K
  { name: "Switzerland", code: "SUI", flag: "🇨🇭", group: "K", confederation: "UEFA", fifaRanking: 17, nickname: "Nati" },
  { name: "Serbia", code: "SRB", flag: "🇷🇸", group: "K", confederation: "UEFA", fifaRanking: 25, nickname: "Orlovi" },
  { name: "Algeria", code: "ALG", flag: "🇩🇿", group: "K", confederation: "CAF", fifaRanking: 32, nickname: "Les Fennecs" },
  { name: "Bolivia", code: "BOL", flag: "🇧🇴", group: "K", confederation: "CONMEBOL", fifaRanking: 86, nickname: "La Verde" },

  // Group L
  { name: "Poland", code: "POL", flag: "🇵🇱", group: "L", confederation: "UEFA", fifaRanking: 19, nickname: "Bialo-czerwoni" },
  { name: "Austria", code: "AUT", flag: "🇦🇹", group: "L", confederation: "UEFA", fifaRanking: 23, nickname: "Das Team" },
  { name: "Tunisia", code: "TUN", flag: "🇹🇳", group: "L", confederation: "CAF", fifaRanking: 39, nickname: "Eagles of Carthage" },
  { name: "El Salvador", code: "SLV", flag: "🇸🇻", group: "L", confederation: "CONCACAF", fifaRanking: 71, nickname: "La Selecta" },
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
