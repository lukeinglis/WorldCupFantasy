// Two-Tier Fantasy Contest Data Model

export interface GroupPrediction {
  group: string;         // "A" through "L"
  order: [string, string, string, string]; // predicted 1st, 2nd, 3rd, 4th (team codes)
}

export interface BonusPicks {
  // Tier 1 bonuses (pre-tournament)
  goldenBoot: string;          // player name: top scorer of tournament
  mostGoalsTeam: string;       // team code: most goals in GROUP STAGE only
  fewestConcededTeam: string;  // team code: fewest goals conceded in GROUP STAGE only
  // Tier 2 bonus (pre-knockout)
  goldenBall: string;          // player name: best player of tournament (FIFA award)
}

export interface KnockoutPick {
  round: "round_of_32" | "round_of_16" | "quarter" | "semi" | "final";
  matchNumber: number;   // 1-based match index within the round
  winner: string;        // team code
}

export interface Tiebreaker {
  homeScore: number;     // predicted final score: home team
  awayScore: number;     // predicted final score: away team
}

export interface Points {
  tier1Groups: number;   // points from group finishing order predictions
  tier1Bonus: number;    // points from Golden Boot, Most Goals, Fewest Conceded
  tier2Bracket: number;  // points from knockout bracket predictions
  tier2Bonus: number;    // points from Golden Ball
  total: number;         // sum of all
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  groupPredictions: GroupPrediction[];
  bonusPicks: BonusPicks;
  knockoutPicks: KnockoutPick[];  // empty until Tier 2 opens
  tiebreaker: Tiebreaker;
  points: Points;
}

// Tier 1 scoring categories (displayed on Rules, How to Play)
export const tier1Categories = [
  {
    id: "group_positions",
    label: "Group Finishing Order",
    icon: "📊",
    description: "Predict 1st through 4th for each of the 12 groups.",
    scoring: "Exact position: 3 pts per team. Right bucket (advance/exit correct, wrong position): 1 pt per team.",
    maxPoints: 144,
  },
  {
    id: "golden_boot",
    label: "Golden Boot",
    icon: "👟",
    description: "Pick the player who scores the most goals in the tournament.",
    scoring: "10 points if correct.",
    maxPoints: 10,
  },
  {
    id: "most_goals_team",
    label: "Most Goals (Team)",
    icon: "⚽",
    description: "Pick the team that scores the most goals during the group stage.",
    scoring: "10 points if correct.",
    maxPoints: 10,
  },
  {
    id: "fewest_conceded_team",
    label: "Fewest Goals Conceded (Team)",
    icon: "🛡️",
    description: "Pick the team that concedes the fewest goals during the group stage.",
    scoring: "10 points if correct.",
    maxPoints: 10,
  },
];

export const tier2Categories = [
  {
    id: "knockout_bracket",
    label: "Knockout Bracket",
    icon: "🏆",
    description: "Predict the winner of every knockout match.",
    scoring: "R32: 2 pts, R16: 4 pts, QF: 6 pts, SF: 8 pts, Final: 10 pts.",
    maxPoints: 118,
  },
  {
    id: "golden_ball",
    label: "Golden Ball",
    icon: "🌟",
    description: "Pick the player awarded FIFA's Best Player of the tournament.",
    scoring: "10 points if correct.",
    maxPoints: 10,
  },
];

export const TIER1_MAX = 174;  // 144 group + 30 bonus
export const TIER2_MAX = 128;  // 118 bracket + 10 Golden Ball
export const OVERALL_MAX = 302;

export const knockoutRoundPoints: Record<string, number> = {
  round_of_32: 2,
  round_of_16: 4,
  quarter: 6,
  semi: 8,
  final: 10,
};

export const knockoutRoundMatchCounts: Record<string, number> = {
  round_of_32: 16,
  round_of_16: 8,
  quarter: 4,
  semi: 2,
  final: 1,
};

// Mock participants with realistic Tier 1 predictions
// Knockout picks are empty (Tier 2 not yet open)
export const participants: Participant[] = [
  {
    id: "luke",
    name: "Luke I.",
    avatar: "⚽",
    groupPredictions: [
      { group: "A", order: ["USA", "MAR", "ECU", "MLI"] },
      { group: "B", order: ["ENG", "JPN", "SEN", "CHI"] },
      { group: "C", order: ["ARG", "NGA", "AUS", "HON"] },
      { group: "D", order: ["FRA", "KOR", "CMR", "CRC"] },
      { group: "E", order: ["BRA", "COL", "TUR", "NZL"] },
      { group: "F", order: ["ESP", "MEX", "IRN", "JAM"] },
      { group: "G", order: ["GER", "URU", "CAN", "KSA"] },
      { group: "H", order: ["POR", "NED", "GHA", "PAR"] },
      { group: "I", order: ["BEL", "CRO", "PER", "UGA"] },
      { group: "J", order: ["ITA", "DEN", "EGY", "PAN"] },
      { group: "K", order: ["SUI", "SRB", "ALG", "BOL"] },
      { group: "L", order: ["POL", "AUT", "TUN", "SLV"] },
    ],
    bonusPicks: {
      goldenBoot: "Kylian Mbappe",
      mostGoalsTeam: "FRA",
      fewestConcededTeam: "ESP",
      goldenBall: "Lionel Messi",
    },
    knockoutPicks: [],
    tiebreaker: { homeScore: 2, awayScore: 1 },
    points: { tier1Groups: 0, tier1Bonus: 0, tier2Bracket: 0, tier2Bonus: 0, total: 0 },
  },
  {
    id: "mike",
    name: "Mike T.",
    avatar: "🏆",
    groupPredictions: [
      { group: "A", order: ["MAR", "USA", "ECU", "MLI"] },
      { group: "B", order: ["ENG", "SEN", "JPN", "CHI"] },
      { group: "C", order: ["ARG", "AUS", "NGA", "HON"] },
      { group: "D", order: ["FRA", "KOR", "CRC", "CMR"] },
      { group: "E", order: ["BRA", "TUR", "COL", "NZL"] },
      { group: "F", order: ["ESP", "IRN", "MEX", "JAM"] },
      { group: "G", order: ["GER", "URU", "CAN", "KSA"] },
      { group: "H", order: ["NED", "POR", "GHA", "PAR"] },
      { group: "I", order: ["CRO", "BEL", "PER", "UGA"] },
      { group: "J", order: ["ITA", "DEN", "PAN", "EGY"] },
      { group: "K", order: ["SRB", "SUI", "ALG", "BOL"] },
      { group: "L", order: ["AUT", "POL", "TUN", "SLV"] },
    ],
    bonusPicks: {
      goldenBoot: "Erling Haaland",
      mostGoalsTeam: "BRA",
      fewestConcededTeam: "ITA",
      goldenBall: "Kylian Mbappe",
    },
    knockoutPicks: [],
    tiebreaker: { homeScore: 1, awayScore: 1 },
    points: { tier1Groups: 0, tier1Bonus: 0, tier2Bracket: 0, tier2Bonus: 0, total: 0 },
  },
  {
    id: "sarah",
    name: "Sarah K.",
    avatar: "🥅",
    groupPredictions: [
      { group: "A", order: ["USA", "MAR", "MLI", "ECU"] },
      { group: "B", order: ["ENG", "JPN", "CHI", "SEN"] },
      { group: "C", order: ["ARG", "NGA", "AUS", "HON"] },
      { group: "D", order: ["FRA", "CMR", "KOR", "CRC"] },
      { group: "E", order: ["COL", "BRA", "TUR", "NZL"] },
      { group: "F", order: ["ESP", "MEX", "IRN", "JAM"] },
      { group: "G", order: ["URU", "GER", "CAN", "KSA"] },
      { group: "H", order: ["POR", "NED", "PAR", "GHA"] },
      { group: "I", order: ["BEL", "CRO", "PER", "UGA"] },
      { group: "J", order: ["DEN", "ITA", "EGY", "PAN"] },
      { group: "K", order: ["SUI", "ALG", "SRB", "BOL"] },
      { group: "L", order: ["POL", "AUT", "TUN", "SLV"] },
    ],
    bonusPicks: {
      goldenBoot: "Harry Kane",
      mostGoalsTeam: "ARG",
      fewestConcededTeam: "FRA",
      goldenBall: "Jude Bellingham",
    },
    knockoutPicks: [],
    tiebreaker: { homeScore: 3, awayScore: 2 },
    points: { tier1Groups: 0, tier1Bonus: 0, tier2Bracket: 0, tier2Bonus: 0, total: 0 },
  },
  {
    id: "dave",
    name: "Dave R.",
    avatar: "🎯",
    groupPredictions: [
      { group: "A", order: ["MAR", "USA", "MLI", "ECU"] },
      { group: "B", order: ["ENG", "JPN", "SEN", "CHI"] },
      { group: "C", order: ["ARG", "AUS", "HON", "NGA"] },
      { group: "D", order: ["FRA", "KOR", "CMR", "CRC"] },
      { group: "E", order: ["BRA", "COL", "NZL", "TUR"] },
      { group: "F", order: ["MEX", "ESP", "IRN", "JAM"] },
      { group: "G", order: ["GER", "CAN", "URU", "KSA"] },
      { group: "H", order: ["POR", "NED", "GHA", "PAR"] },
      { group: "I", order: ["BEL", "CRO", "UGA", "PER"] },
      { group: "J", order: ["ITA", "DEN", "EGY", "PAN"] },
      { group: "K", order: ["SUI", "SRB", "ALG", "BOL"] },
      { group: "L", order: ["AUT", "POL", "SLV", "TUN"] },
    ],
    bonusPicks: {
      goldenBoot: "Vinicius Jr",
      mostGoalsTeam: "GER",
      fewestConcededTeam: "POR",
      goldenBall: "Rodri",
    },
    knockoutPicks: [],
    tiebreaker: { homeScore: 2, awayScore: 0 },
    points: { tier1Groups: 0, tier1Bonus: 0, tier2Bracket: 0, tier2Bonus: 0, total: 0 },
  },
  {
    id: "jess",
    name: "Jess M.",
    avatar: "⭐",
    groupPredictions: [
      { group: "A", order: ["USA", "ECU", "MAR", "MLI"] },
      { group: "B", order: ["ENG", "JPN", "SEN", "CHI"] },
      { group: "C", order: ["ARG", "NGA", "AUS", "HON"] },
      { group: "D", order: ["FRA", "KOR", "CMR", "CRC"] },
      { group: "E", order: ["BRA", "COL", "TUR", "NZL"] },
      { group: "F", order: ["ESP", "MEX", "JAM", "IRN"] },
      { group: "G", order: ["GER", "URU", "KSA", "CAN"] },
      { group: "H", order: ["NED", "POR", "GHA", "PAR"] },
      { group: "I", order: ["BEL", "CRO", "PER", "UGA"] },
      { group: "J", order: ["ITA", "EGY", "DEN", "PAN"] },
      { group: "K", order: ["SUI", "SRB", "ALG", "BOL"] },
      { group: "L", order: ["POL", "AUT", "TUN", "SLV"] },
    ],
    bonusPicks: {
      goldenBoot: "Lamine Yamal",
      mostGoalsTeam: "ESP",
      fewestConcededTeam: "ARG",
      goldenBall: "Florian Wirtz",
    },
    knockoutPicks: [],
    tiebreaker: { homeScore: 1, awayScore: 2 },
    points: { tier1Groups: 0, tier1Bonus: 0, tier2Bracket: 0, tier2Bonus: 0, total: 0 },
  },
  {
    id: "rob",
    name: "Rob H.",
    avatar: "🦅",
    groupPredictions: [
      { group: "A", order: ["USA", "MAR", "ECU", "MLI"] },
      { group: "B", order: ["JPN", "ENG", "SEN", "CHI"] },
      { group: "C", order: ["ARG", "AUS", "NGA", "HON"] },
      { group: "D", order: ["FRA", "CMR", "KOR", "CRC"] },
      { group: "E", order: ["BRA", "TUR", "COL", "NZL"] },
      { group: "F", order: ["ESP", "MEX", "IRN", "JAM"] },
      { group: "G", order: ["GER", "URU", "CAN", "KSA"] },
      { group: "H", order: ["POR", "NED", "GHA", "PAR"] },
      { group: "I", order: ["CRO", "BEL", "PER", "UGA"] },
      { group: "J", order: ["ITA", "DEN", "EGY", "PAN"] },
      { group: "K", order: ["SRB", "SUI", "BOL", "ALG"] },
      { group: "L", order: ["POL", "AUT", "TUN", "SLV"] },
    ],
    bonusPicks: {
      goldenBoot: "Kai Havertz",
      mostGoalsTeam: "GER",
      fewestConcededTeam: "ENG",
      goldenBall: "Jamal Musiala",
    },
    knockoutPicks: [],
    tiebreaker: { homeScore: 0, awayScore: 1 },
    points: { tier1Groups: 0, tier1Bonus: 0, tier2Bracket: 0, tier2Bonus: 0, total: 0 },
  },
  {
    id: "alex",
    name: "Alex C.",
    avatar: "🎖️",
    groupPredictions: [
      { group: "A", order: ["MAR", "ECU", "USA", "MLI"] },
      { group: "B", order: ["ENG", "SEN", "JPN", "CHI"] },
      { group: "C", order: ["ARG", "NGA", "HON", "AUS"] },
      { group: "D", order: ["FRA", "KOR", "CMR", "CRC"] },
      { group: "E", order: ["COL", "BRA", "TUR", "NZL"] },
      { group: "F", order: ["ESP", "MEX", "IRN", "JAM"] },
      { group: "G", order: ["URU", "GER", "CAN", "KSA"] },
      { group: "H", order: ["POR", "GHA", "NED", "PAR"] },
      { group: "I", order: ["BEL", "CRO", "PER", "UGA"] },
      { group: "J", order: ["ITA", "DEN", "EGY", "PAN"] },
      { group: "K", order: ["SUI", "SRB", "ALG", "BOL"] },
      { group: "L", order: ["POL", "TUN", "AUT", "SLV"] },
    ],
    bonusPicks: {
      goldenBoot: "Cristiano Ronaldo",
      mostGoalsTeam: "ARG",
      fewestConcededTeam: "ESP",
      goldenBall: "Bruno Fernandes",
    },
    knockoutPicks: [],
    tiebreaker: { homeScore: 3, awayScore: 1 },
    points: { tier1Groups: 0, tier1Bonus: 0, tier2Bracket: 0, tier2Bonus: 0, total: 0 },
  },
  {
    id: "nina",
    name: "Nina P.",
    avatar: "🌟",
    groupPredictions: [
      { group: "A", order: ["USA", "MAR", "ECU", "MLI"] },
      { group: "B", order: ["ENG", "JPN", "SEN", "CHI"] },
      { group: "C", order: ["ARG", "NGA", "AUS", "HON"] },
      { group: "D", order: ["FRA", "KOR", "CMR", "CRC"] },
      { group: "E", order: ["BRA", "COL", "TUR", "NZL"] },
      { group: "F", order: ["ESP", "MEX", "IRN", "JAM"] },
      { group: "G", order: ["GER", "URU", "CAN", "KSA"] },
      { group: "H", order: ["POR", "NED", "GHA", "PAR"] },
      { group: "I", order: ["BEL", "CRO", "PER", "UGA"] },
      { group: "J", order: ["ITA", "DEN", "EGY", "PAN"] },
      { group: "K", order: ["SUI", "SRB", "ALG", "BOL"] },
      { group: "L", order: ["POL", "AUT", "TUN", "SLV"] },
    ],
    bonusPicks: {
      goldenBoot: "Julian Alvarez",
      mostGoalsTeam: "ARG",
      fewestConcededTeam: "GER",
      goldenBall: "Lionel Messi",
    },
    knockoutPicks: [],
    tiebreaker: { homeScore: 2, awayScore: 2 },
    points: { tier1Groups: 0, tier1Bonus: 0, tier2Bracket: 0, tier2Bonus: 0, total: 0 },
  },
  {
    id: "tom",
    name: "Tom W.",
    avatar: "🏅",
    groupPredictions: [
      { group: "A", order: ["USA", "MAR", "MLI", "ECU"] },
      { group: "B", order: ["ENG", "JPN", "CHI", "SEN"] },
      { group: "C", order: ["ARG", "AUS", "NGA", "HON"] },
      { group: "D", order: ["FRA", "KOR", "CRC", "CMR"] },
      { group: "E", order: ["BRA", "COL", "TUR", "NZL"] },
      { group: "F", order: ["ESP", "IRN", "MEX", "JAM"] },
      { group: "G", order: ["GER", "CAN", "URU", "KSA"] },
      { group: "H", order: ["NED", "POR", "PAR", "GHA"] },
      { group: "I", order: ["BEL", "PER", "CRO", "UGA"] },
      { group: "J", order: ["DEN", "ITA", "EGY", "PAN"] },
      { group: "K", order: ["SUI", "SRB", "ALG", "BOL"] },
      { group: "L", order: ["POL", "AUT", "TUN", "SLV"] },
    ],
    bonusPicks: {
      goldenBoot: "Kylian Mbappe",
      mostGoalsTeam: "FRA",
      fewestConcededTeam: "ITA",
      goldenBall: "Pedri",
    },
    knockoutPicks: [],
    tiebreaker: { homeScore: 1, awayScore: 0 },
    points: { tier1Groups: 0, tier1Bonus: 0, tier2Bracket: 0, tier2Bonus: 0, total: 0 },
  },
  {
    id: "kate",
    name: "Kate B.",
    avatar: "💫",
    groupPredictions: [
      { group: "A", order: ["MAR", "USA", "ECU", "MLI"] },
      { group: "B", order: ["ENG", "SEN", "JPN", "CHI"] },
      { group: "C", order: ["ARG", "NGA", "AUS", "HON"] },
      { group: "D", order: ["FRA", "CMR", "KOR", "CRC"] },
      { group: "E", order: ["BRA", "COL", "TUR", "NZL"] },
      { group: "F", order: ["ESP", "MEX", "IRN", "JAM"] },
      { group: "G", order: ["GER", "URU", "KSA", "CAN"] },
      { group: "H", order: ["POR", "NED", "GHA", "PAR"] },
      { group: "I", order: ["CRO", "BEL", "PER", "UGA"] },
      { group: "J", order: ["ITA", "DEN", "PAN", "EGY"] },
      { group: "K", order: ["SRB", "SUI", "ALG", "BOL"] },
      { group: "L", order: ["AUT", "POL", "TUN", "SLV"] },
    ],
    bonusPicks: {
      goldenBoot: "Phil Foden",
      mostGoalsTeam: "ENG",
      fewestConcededTeam: "FRA",
      goldenBall: "Bukayo Saka",
    },
    knockoutPicks: [],
    tiebreaker: { homeScore: 2, awayScore: 1 },
    points: { tier1Groups: 0, tier1Bonus: 0, tier2Bracket: 0, tier2Bonus: 0, total: 0 },
  },
];

// Tournament phase detection
export type TournamentPhase = "pre_tournament" | "group_stage" | "knockout" | "complete";

export function getCurrentPhase(): TournamentPhase {
  const now = new Date();
  const tier1Deadline = new Date("2026-06-01T00:00:00-05:00");
  const tournamentStart = new Date("2026-06-11T20:00:00-05:00");
  const knockoutStart = new Date("2026-06-28T00:00:00-05:00");
  const finalDate = new Date("2026-07-19T23:59:59-05:00");

  if (now < tournamentStart) return "pre_tournament";
  if (now < knockoutStart) return "group_stage";
  if (now < finalDate) return "knockout";
  return "complete";
}

// Helper to get Golden Boot pick distribution
export function getGoldenBootDistribution(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of participants) {
    const pick = p.bonusPicks.goldenBoot;
    counts[pick] = (counts[pick] ?? 0) + 1;
  }
  return counts;
}

// Helper to get most popular 1st-place pick per group
export function getGroupWinnerDistribution(group: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of participants) {
    const gp = p.groupPredictions.find(g => g.group === group);
    if (gp) {
      const winner = gp.order[0];
      counts[winner] = (counts[winner] ?? 0) + 1;
    }
  }
  return counts;
}
