@AGENTS.md

# World Cup 2026 Fantasy

## Project
- Next.js 16 App Router with TypeScript and Tailwind CSS v4
- Deployed on Vercel at soccer.lukeinglis.me
- Static site with mock data (no database required)
- Two-tier scoring system: Tier 1 (group predictions) + Tier 2 (knockout bracket)

## Commands
- `npm run dev` to start dev server
- `npm run build` to build for production
- `npm run lint` to run ESLint

## Git
- Always sign off commits: `git commit -s`
- Never mention Claude or AI in commit messages

## Style
- Never use emdashes or double-dashes in content text
- Soccer/football theming: pitch green (#1B5E20), navy (#0A1628), gold (#FFD700), accent green (#00E676)
- Font: Oswald for headings, Source Sans 3 for body
- Mobile-first responsive design
- Tier 1 uses accent green color scheme, Tier 2 uses gold color scheme

## Key Files
- `src/data/teams.ts` - 48 World Cup teams with groups, rankings, flags
- `src/data/participants.ts` - Fantasy participants with group predictions, bonus picks, knockout picks, tiebreakers, and points breakdown
- `src/data/scoring.ts` - Scoring logic for both tiers (group positions, bonuses, bracket)
- `src/data/schedule.ts` - Match schedule and venues
- `src/components/` - Shared UI components (Card, Container, Nav, PicksTabs, CountdownTimer, etc.)
- `src/app/` - All pages (home, leaderboard, picks, rules, groups, schedule, how-to-play)

## Data Model
- `Participant` has: groupPredictions (12 groups, each with 4-team order), bonusPicks (goldenBoot, mostGoalsTeam, fewestConcededTeam, goldenBall), knockoutPicks (array, empty until Tier 2), tiebreaker (homeScore, awayScore), points (tier1Groups, tier1Bonus, tier2Bracket, tier2Bonus, total)
- Scoring: Group exact position = 3 pts, right bucket = 1 pt. Bonuses = 10 pts each. Knockout: R32=2, R16=4, QF=6, SF=8, F=10 pts.
- Max points: Tier 1 = 174 (144 groups + 30 bonus), Tier 2 = 128 (118 bracket + 10 Golden Ball), Overall = 302

## Notes
- Params in dynamic routes are a Promise in Next.js 16 (must `await params`)
- All pages are statically generated at build time
- CountdownTimer shows dual countdown: Tier 1 picks deadline + tournament kickoff
- Picks page uses client-side tabs (PicksTabs component) for Group/Bonus/Bracket/Participant views
