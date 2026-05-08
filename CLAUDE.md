@AGENTS.md

# World Cup 2026 Fantasy

## Project
- Next.js 16 App Router with TypeScript and Tailwind CSS v4
- Deployed on Vercel at soccer.lukeinglis.me
- Static site with mock data (no database required)

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

## Key Files
- `src/data/teams.ts` - 48 World Cup teams with groups, rankings, flags
- `src/data/participants.ts` - Fantasy contest participants and their picks
- `src/data/schedule.ts` - Match schedule and venues
- `src/components/` - Shared UI components (Card, Container, Nav, etc.)
- `src/app/` - All pages (home, leaderboard, picks, rules, groups, schedule, how-to-play)

## Notes
- Params in dynamic routes are a Promise in Next.js 16 (must `await params`)
- All pages are statically generated at build time
