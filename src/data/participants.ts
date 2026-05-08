export interface Participant {
  id: string;
  name: string;
  avatar: string; // emoji
  picks: Pick[];
  tiebreaker: number; // predicted total goals in final
}

export interface Pick {
  category: string;
  selection: string; // team code or player name
}

// Fantasy contest participants with their picks
export const participants: Participant[] = [
  {
    id: "luke",
    name: "Luke I.",
    avatar: "⚽",
    picks: [
      { category: "champion", selection: "ARG" },
      { category: "runner_up", selection: "FRA" },
      { category: "golden_boot", selection: "Kylian Mbappe" },
      { category: "golden_ball", selection: "Lionel Messi" },
      { category: "dark_horse", selection: "CRO" },
      { category: "group_stage_exit", selection: "KSA" },
      { category: "most_cards", selection: "ARG" },
      { category: "first_goal", selection: "USA" },
    ],
    tiebreaker: 3,
  },
  {
    id: "mike",
    name: "Mike T.",
    avatar: "🏆",
    picks: [
      { category: "champion", selection: "FRA" },
      { category: "runner_up", selection: "BRA" },
      { category: "golden_boot", selection: "Erling Haaland" },
      { category: "golden_ball", selection: "Kylian Mbappe" },
      { category: "dark_horse", selection: "JPN" },
      { category: "group_stage_exit", selection: "CRC" },
      { category: "most_cards", selection: "URU" },
      { category: "first_goal", selection: "MEX" },
    ],
    tiebreaker: 2,
  },
  {
    id: "sarah",
    name: "Sarah K.",
    avatar: "🥅",
    picks: [
      { category: "champion", selection: "ENG" },
      { category: "runner_up", selection: "ARG" },
      { category: "golden_boot", selection: "Harry Kane" },
      { category: "golden_ball", selection: "Jude Bellingham" },
      { category: "dark_horse", selection: "COL" },
      { category: "group_stage_exit", selection: "BOL" },
      { category: "most_cards", selection: "NED" },
      { category: "first_goal", selection: "USA" },
    ],
    tiebreaker: 4,
  },
  {
    id: "dave",
    name: "Dave R.",
    avatar: "🎯",
    picks: [
      { category: "champion", selection: "BRA" },
      { category: "runner_up", selection: "ESP" },
      { category: "golden_boot", selection: "Vinicius Jr" },
      { category: "golden_ball", selection: "Rodri" },
      { category: "dark_horse", selection: "MAR" },
      { category: "group_stage_exit", selection: "NZL" },
      { category: "most_cards", selection: "CMR" },
      { category: "first_goal", selection: "ARG" },
    ],
    tiebreaker: 3,
  },
  {
    id: "jess",
    name: "Jess M.",
    avatar: "⭐",
    picks: [
      { category: "champion", selection: "ESP" },
      { category: "runner_up", selection: "GER" },
      { category: "golden_boot", selection: "Lamine Yamal" },
      { category: "golden_ball", selection: "Florian Wirtz" },
      { category: "dark_horse", selection: "USA" },
      { category: "group_stage_exit", selection: "HON" },
      { category: "most_cards", selection: "SRB" },
      { category: "first_goal", selection: "MEX" },
    ],
    tiebreaker: 2,
  },
  {
    id: "rob",
    name: "Rob H.",
    avatar: "🦅",
    picks: [
      { category: "champion", selection: "GER" },
      { category: "runner_up", selection: "POR" },
      { category: "golden_boot", selection: "Kai Havertz" },
      { category: "golden_ball", selection: "Jamal Musiala" },
      { category: "dark_horse", selection: "DEN" },
      { category: "group_stage_exit", selection: "SLV" },
      { category: "most_cards", selection: "BRA" },
      { category: "first_goal", selection: "GER" },
    ],
    tiebreaker: 1,
  },
  {
    id: "alex",
    name: "Alex C.",
    avatar: "🎖️",
    picks: [
      { category: "champion", selection: "POR" },
      { category: "runner_up", selection: "ENG" },
      { category: "golden_boot", selection: "Cristiano Ronaldo" },
      { category: "golden_ball", selection: "Bruno Fernandes" },
      { category: "dark_horse", selection: "SEN" },
      { category: "group_stage_exit", selection: "JAM" },
      { category: "most_cards", selection: "COL" },
      { category: "first_goal", selection: "BRA" },
    ],
    tiebreaker: 5,
  },
  {
    id: "nina",
    name: "Nina P.",
    avatar: "🌟",
    picks: [
      { category: "champion", selection: "ARG" },
      { category: "runner_up", selection: "NED" },
      { category: "golden_boot", selection: "Julian Alvarez" },
      { category: "golden_ball", selection: "Lionel Messi" },
      { category: "dark_horse", selection: "NGA" },
      { category: "group_stage_exit", selection: "UGA" },
      { category: "most_cards", selection: "EGY" },
      { category: "first_goal", selection: "ARG" },
    ],
    tiebreaker: 3,
  },
  {
    id: "tom",
    name: "Tom W.",
    avatar: "🏅",
    picks: [
      { category: "champion", selection: "FRA" },
      { category: "runner_up", selection: "ARG" },
      { category: "golden_boot", selection: "Kylian Mbappe" },
      { category: "golden_ball", selection: "Pedri" },
      { category: "dark_horse", selection: "AUS" },
      { category: "group_stage_exit", selection: "PAN" },
      { category: "most_cards", selection: "CHI" },
      { category: "first_goal", selection: "FRA" },
    ],
    tiebreaker: 2,
  },
  {
    id: "kate",
    name: "Kate B.",
    avatar: "💫",
    picks: [
      { category: "champion", selection: "ENG" },
      { category: "runner_up", selection: "BRA" },
      { category: "golden_boot", selection: "Phil Foden" },
      { category: "golden_ball", selection: "Bukayo Saka" },
      { category: "dark_horse", selection: "TUR" },
      { category: "group_stage_exit", selection: "MLI" },
      { category: "most_cards", selection: "PER" },
      { category: "first_goal", selection: "ENG" },
    ],
    tiebreaker: 4,
  },
];

export const categories = [
  { id: "champion", label: "World Cup Champion", points: 25, icon: "🏆", description: "Pick the team that lifts the trophy" },
  { id: "runner_up", label: "Runner Up", points: 15, icon: "🥈", description: "Pick the losing finalist" },
  { id: "golden_boot", label: "Golden Boot", points: 20, icon: "👟", description: "Pick the tournament's top scorer" },
  { id: "golden_ball", label: "Golden Ball", points: 15, icon: "⚽", description: "Pick the tournament's best player" },
  { id: "dark_horse", label: "Dark Horse (Quarterfinals)", points: 20, icon: "🐴", description: "Pick a team outside the top 10 in FIFA rankings that reaches the quarterfinals" },
  { id: "group_stage_exit", label: "Group Stage Exit", points: 10, icon: "🚪", description: "Pick a team that fails to advance past the group stage" },
  { id: "most_cards", label: "Most Disciplined (Fewest Cards)", points: 10, icon: "🟨", description: "Pick the team with the fewest yellow and red cards" },
  { id: "first_goal", label: "First Goal of Tournament", points: 10, icon: "🥇", description: "Pick the team that scores the very first goal" },
];

// Pre-tournament: no results yet, so all scores are 0
export function calculateScore(participant: Participant): number {
  // Once the tournament starts, this would check against actual results
  // For now, return mock projected scores for display purposes
  const mockScores: Record<string, number> = {
    luke: 0,
    mike: 0,
    sarah: 0,
    dave: 0,
    jess: 0,
    rob: 0,
    alex: 0,
    nina: 0,
    tom: 0,
    kate: 0,
  };
  return mockScores[participant.id] ?? 0;
}
