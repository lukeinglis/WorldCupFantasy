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
    maxPoints: 114,
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
export const TIER2_MAX = 124;  // 114 bracket + 10 Golden Ball
export const OVERALL_MAX = 298;

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

// Participants array (populated when contestants submit their picks)
export const participants: Participant[] = [];

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
