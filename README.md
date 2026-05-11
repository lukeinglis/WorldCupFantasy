# World Cup 2026 Fantasy

A fantasy prediction contest for the FIFA World Cup 2026 (USA, Mexico, Canada).

Deployed at [soccer.lukeinglis.me](https://soccer.lukeinglis.me)

## Features

- **Two-tier scoring system**: Tier 1 (group predictions) + Tier 2 (knockout bracket)
- **Pick submission**: Multi-step form for group order predictions, bonus picks, and tiebreaker
- **Authentication**: Simple name + passcode login for a friends league
- **Hidden picks**: Picks hidden from others until the tournament starts
- **Leaderboard** with standings and scoring breakdown
- **Groups** overview for all 48 teams in 12 groups
- **Schedule** with match dates and venues
- **Rules** page with full contest details and $10 buy-in info
- **Countdown timer** to tournament kickoff
- Responsive, mobile-first design with soccer theming

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Vercel KV (Redis) for data storage
- Deployed on Vercel

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
```

## Vercel KV Setup

The pick submission system requires a Vercel KV store for data persistence.

1. Go to your Vercel dashboard
2. Select the project
3. Go to **Storage** > **Create** > **KV**
4. Name it (e.g. `world-cup-fantasy-kv`)
5. Connect it to your project
6. Vercel automatically sets the environment variables: `KV_REST_API_URL` and `KV_REST_API_TOKEN`
7. Redeploy the project

Without KV configured, the site works in read-only mode (displays static content, no pick submission).

## Scoring

### Tier 1: Group Stage Predictions (174 pts max)

| Category | Points |
|----------|--------|
| Group Finishing Order (12 groups x 4 teams) | 144 pts max |
| Golden Boot (top scorer) | 10 pts |
| Most Goals Team (group stage) | 10 pts |
| Fewest Goals Conceded Team (group stage) | 10 pts |

### Tier 2: Knockout Bracket (124 pts max)

| Round | Matches | Points Each | Max |
|-------|---------|-------------|-----|
| Round of 32 | 16 | 2 pts | 32 pts |
| Round of 16 | 8 | 4 pts | 32 pts |
| Quarterfinals | 4 | 6 pts | 24 pts |
| Semifinals | 2 | 8 pts | 16 pts |
| Final | 1 | 10 pts | 10 pts |
| Golden Ball (best player) | | | 10 pts |

**Overall Maximum: 298 points**
