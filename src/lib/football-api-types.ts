/**
 * TypeScript types for football-data.org API v4 responses.
 * Covers: teams, standings, matches, scorers, match detail.
 */

// ── Common types ──

export interface ApiArea {
  id: number;
  name: string;
  code: string;
  flag: string | null;
}

export interface ApiCompetition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string | null;
}

export interface ApiSeason {
  id: number;
  startDate: string;
  endDate: string;
  currentMatchday: number | null;
  winner: ApiTeamRef | null;
}

export interface ApiTeamRef {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string | null;
}

// ── Teams endpoint ──

export interface ApiTeam {
  area: ApiArea;
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string | null;
  address: string | null;
  website: string | null;
  founded: number | null;
  clubColors: string | null;
  venue: string | null;
  coach: ApiCoach | null;
  squad: ApiPlayer[];
}

export interface ApiCoach {
  id: number;
  firstName: string | null;
  lastName: string | null;
  name: string;
  dateOfBirth: string | null;
  nationality: string | null;
  contract: {
    start: string | null;
    until: string | null;
  } | null;
}

export interface ApiPlayer {
  id: number;
  name: string;
  position: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
}

export interface ApiTeamsResponse {
  count: number;
  filters: Record<string, unknown>;
  competition: ApiCompetition;
  season: ApiSeason;
  teams: ApiTeam[];
}

// ── Standings endpoint ──

export interface ApiStandingEntry {
  position: number;
  team: ApiTeamRef;
  playedGames: number;
  form: string | null;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface ApiStandingGroup {
  stage: string;
  type: string;
  group: string; // e.g. "GROUP_A"
  table: ApiStandingEntry[];
}

export interface ApiStandingsResponse {
  filters: Record<string, unknown>;
  competition: ApiCompetition;
  season: ApiSeason;
  standings: ApiStandingGroup[];
}

// ── Matches endpoint ──

export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "EXTRA_TIME"
  | "PENALTY_SHOOTOUT"
  | "FINISHED"
  | "SUSPENDED"
  | "POSTPONED"
  | "CANCELLED"
  | "AWARDED";

export const LIVE_STATUSES: MatchStatus[] = [
  "IN_PLAY",
  "PAUSED",
  "EXTRA_TIME",
  "PENALTY_SHOOTOUT",
];

export interface ApiScore {
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  duration: "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT" | null;
  fullTime: { home: number | null; away: number | null };
  halfTime: { home: number | null; away: number | null };
}

export interface ApiMatch {
  area: ApiArea;
  competition: ApiCompetition;
  season: ApiSeason;
  id: number;
  utcDate: string;
  status: MatchStatus;
  matchday: number | null;
  stage: string;
  group: string | null; // e.g. "GROUP_A" or null for knockout
  lastUpdated: string;
  homeTeam: ApiTeamRef;
  awayTeam: ApiTeamRef;
  score: ApiScore;
  odds: Record<string, unknown> | null;
  referees: ApiReferee[];
}

export interface ApiReferee {
  id: number;
  name: string;
  type: string;
  nationality: string | null;
}

export interface ApiMatchesResponse {
  filters: Record<string, unknown>;
  resultSet: {
    count: number;
    competitions: string;
    first: string;
    last: string;
    played: number;
  };
  matches: ApiMatch[];
}

// ── Match detail (single match) ──

export interface ApiGoal {
  minute: number;
  injuryTime: number | null;
  type: string; // "REGULAR", "OWN", "PENALTY"
  team: ApiTeamRef;
  scorer: { id: number; name: string } | null;
  assist: { id: number; name: string } | null;
}

export interface ApiBooking {
  minute: number;
  team: ApiTeamRef;
  player: { id: number; name: string } | null;
  card: "YELLOW_CARD" | "YELLOW_RED" | "RED_CARD";
}

export interface ApiSubstitution {
  minute: number;
  team: ApiTeamRef;
  playerOut: { id: number; name: string } | null;
  playerIn: { id: number; name: string } | null;
}

export interface ApiMatchDetail extends ApiMatch {
  goals: ApiGoal[];
  bookings: ApiBooking[];
  substitutions: ApiSubstitution[];
}

// ── Scorers endpoint ──

export interface ApiScorer {
  player: {
    id: number;
    name: string;
    firstName: string | null;
    lastName: string | null;
    dateOfBirth: string | null;
    nationality: string | null;
    section: string | null;
    position: string | null;
    shirtNumber: number | null;
    lastUpdated: string | null;
  };
  team: ApiTeamRef;
  playedMatches: number;
  goals: number;
  assists: number | null;
  penalties: number | null;
}

export interface ApiScorersResponse {
  count: number;
  filters: Record<string, unknown>;
  competition: ApiCompetition;
  season: ApiSeason;
  scorers: ApiScorer[];
}

// ── Transformed types for frontend ──

export interface TransformedTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string | null;
  group: string; // "A", "B", etc. (extracted from standings)
  area: string;
  areaFlag: string | null;
}

export interface TransformedStanding {
  position: number;
  team: TransformedTeam;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string | null;
}

export interface TransformedGroupStandings {
  group: string; // "A", "B", etc.
  standings: TransformedStanding[];
}

export interface TransformedMatch {
  id: number;
  utcDate: string;
  status: MatchStatus;
  matchday: number | null;
  stage: string;
  group: string | null;
  homeTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string | null;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string | null;
  };
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
  isLive: boolean;
}

export interface TransformedScorer {
  playerName: string;
  teamName: string;
  teamTla: string;
  teamCrest: string | null;
  goals: number;
  assists: number;
  playedMatches: number;
  penalties: number;
}

export interface TeamStats {
  teamName: string;
  teamTla: string;
  teamCrest: string | null;
  goalsScored: number;
  goalsConceded: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
}
