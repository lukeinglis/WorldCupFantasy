export interface ParticipantPicks {
  id: string;
  name: string;
  hasPicks: boolean;
  picks: {
    groupPredictions: { group: string; order: [string, string, string, string] }[];
    goldenBoot: string;
    mostGoalsTeam: string;
    fewestConcededTeam: string;
    goldenBall: string;
    tiebreaker: { homeScore: number; awayScore: number };
    submittedAt: string;
  } | null;
}

export interface GroupStanding {
  position: number;
  team: { tla: string; shortName: string; crest: string | null };
  played: number;
}

export interface MatchResult {
  group: string;
  homeTeam: { tla: string; shortName: string; crest: string | null };
  awayTeam: { tla: string; shortName: string; crest: string | null };
  score: { fullTime: { home: number | null; away: number | null } };
}

export function computeStandingsFromGroupMatches(matches: MatchResult[]): Record<string, GroupStanding[]> {
  const stats = new Map<string, {
    group: string; tla: string; shortName: string; crest: string | null;
    played: number; won: number; draw: number; lost: number; gf: number; ga: number; pts: number;
  }>();

  for (const m of matches) {
    const hKey = `${m.group}-${m.homeTeam.tla}`;
    const aKey = `${m.group}-${m.awayTeam.tla}`;
    if (!stats.has(hKey)) stats.set(hKey, { group: m.group, tla: m.homeTeam.tla, shortName: m.homeTeam.shortName, crest: m.homeTeam.crest, played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0, pts: 0 });
    if (!stats.has(aKey)) stats.set(aKey, { group: m.group, tla: m.awayTeam.tla, shortName: m.awayTeam.shortName, crest: m.awayTeam.crest, played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0, pts: 0 });

    const h = stats.get(hKey)!;
    const a = stats.get(aKey)!;
    const hg = m.score.fullTime.home ?? 0;
    const ag = m.score.fullTime.away ?? 0;

    h.played++; a.played++; h.gf += hg; h.ga += ag; a.gf += ag; a.ga += hg;
    if (hg > ag) { h.won++; h.pts += 3; a.lost++; }
    else if (hg < ag) { a.won++; a.pts += 3; h.lost++; }
    else { h.draw++; a.draw++; h.pts++; a.pts++; }
  }

  const grouped = new Map<string, typeof stats extends Map<string, infer V> ? V[] : never>();
  for (const s of stats.values()) {
    if (!grouped.has(s.group)) grouped.set(s.group, []);
    grouped.get(s.group)!.push(s);
  }

  const result: Record<string, GroupStanding[]> = {};
  for (const [group, teams] of grouped) {
    teams.sort((a, b) => (b.pts - a.pts) || ((b.gf - b.ga) - (a.gf - a.ga)) || (b.gf - a.gf));
    result[group] = teams.map((t, i) => ({
      position: i + 1,
      team: { tla: t.tla, shortName: t.shortName, crest: t.crest },
      played: t.played,
    }));
  }
  return result;
}
