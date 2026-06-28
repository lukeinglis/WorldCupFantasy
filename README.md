# World Cup 2026 Fantasy

A fantasy prediction contest for the FIFA World Cup 2026 (USA, Mexico, Canada).

Deployed at [worldcup.lukeinglis.me](https://worldcup.lukeinglis.me)

## Features

- **Two-tier scoring system**: Tier 1 (group predictions) + Tier 2 (knockout bracket)
- **Visual bracket picker**: March Madness style bracket for knockout picks on desktop, list view on mobile
- **Live scoring**: Points calculated from live tournament results via football-data.org API
- **Late submission penalty**: Tier 2 picks accepted after deadline with reduced points (0 for played matches, half for tainted teams)
- **Pick visibility**: Tier 1 picks hidden until tournament starts; Tier 2 picks hidden until you submit your own
- **Authentication**: Simple name + email login for a friends league
- **Leaderboard** with clickable participant detail pages showing full scoring breakdowns
- **Groups mega-page** with Standings, Picks, Schedule, and Knockout tabs
- **Homepage bracket** showing the full R32 through Final structure
- Free to play, just for fun among friends
- Responsive, mobile-first design with soccer theming

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Vercel KV (Redis) for data storage
- football-data.org API for live match data
- Vitest for testing
- Deployed on Vercel

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build & Test

```bash
npm run build
npm run test
npm run lint
```

## Environment Variables

```
FOOTBALL_DATA_API_KEY=   # football-data.org API key (free tier: 10 req/min)
KV_REST_API_URL=         # Vercel KV
KV_REST_API_TOKEN=       # Vercel KV
```

Without KV configured, the site works in read-only mode. Without the API key, scoring falls back to hardcoded group stage data.

## Scoring

### Tier 1: Group Stage Predictions (174 pts max)

| Category | Points |
|----------|--------|
| Group Finishing Order (12 groups x 4 teams) | 144 pts max (3 pts exact, 1 pt right bucket) |
| Golden Boot (top scorer) | 10 pts |
| Most Goals Team (group stage) | 10 pts |
| Fewest Goals Conceded Team (group stage) | 10 pts |

### Tier 2: Knockout Bracket (132 pts max)

| Round | Matches | Points Each | Max |
|-------|---------|-------------|-----|
| Round of 32 | 16 | 2 pts | 32 pts |
| Round of 16 | 8 | 4 pts | 32 pts |
| Quarterfinals | 4 | 6 pts | 24 pts |
| Semifinals | 2 | 8 pts | 16 pts |
| Third Place | 1 | 8 pts | 8 pts |
| Final | 1 | 10 pts | 10 pts |
| Golden Ball (best player) | | | 10 pts |

**Overall Maximum: 306 points**

### Bonus Ties

If multiple teams tie for Most Goals or Fewest Conceded in the group stage, all tied teams count as correct.

### Late Submission Penalty

Tier 2 picks submitted after the knockout deadline (June 28, 3:00 PM EST):
- Matches already played at submission time score 0 points
- Teams from those matches are "tainted": correct picks in future rounds earn half points

## Architecture

### Data Sources
- **Group stage results**: Hardcoded in `src/data/scoring.ts` (group stage complete)
- **R32 matchups**: Hardcoded in `src/data/knockout-bracket.ts` (from FIFA bracket)
- **Golden Boot / knockout results**: Live from football-data.org API
- **Participant data**: Vercel KV (Redis)

### Key Files
- `src/data/scoring.ts` - Scoring engine with hardcoded group results and bonus ties
- `src/data/knockout-bracket.ts` - R32 matchups and bracket structure
- `src/data/participants.ts` - Data model types, scoring constants, phase detection
- `src/components/BracketPicker.tsx` - Interactive bracket picker (March Madness layout on desktop)
- `src/lib/live-scoring.ts` - Fetches live results from football-data.org
- `src/lib/storage.ts` - Vercel KV storage layer
- `src/app/api/picks/route.ts` - Pick submission with Tier 1/2 handlers and deadline enforcement
