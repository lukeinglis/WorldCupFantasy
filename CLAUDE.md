@AGENTS.md

# World Cup 2026 Fantasy

## Project
- Next.js 16 App Router with TypeScript and Tailwind CSS v4
- Deployed on Vercel at soccer.lukeinglis.me
- Two-tier scoring system: Tier 1 (group predictions) + Tier 2 (knockout bracket)
- Participant data stored in Vercel KV (Redis); requires KV_REST_API_URL and KV_REST_API_TOKEN env vars
- Simple name + passcode authentication (SHA-256 hashed, stored in KV)
- $10 buy-in with honor-system payment confirmation

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
- `src/data/participants.ts` - Data model types, scoring constants, phase detection
- `src/data/scoring.ts` - Scoring logic for both tiers (group positions, bonuses, bracket)
- `src/data/schedule.ts` - Match schedule, venues, and `parseLocalDate()` helper
- `src/lib/storage.ts` - Vercel KV storage layer (user records, picks, participant lists)
- `src/lib/auth.ts` - SHA-256 passcode hashing and ID generation
- `src/lib/tournament-dates.ts` - Tournament date constants and pick visibility helpers
- `src/components/AuthProvider.tsx` - React context for auth state (localStorage + API)
- `src/components/` - Shared UI components (Card, Container, Nav, PicksTabs, CountdownTimer, etc.)
- `src/app/api/` - API routes for auth (register, login) and picks (save, fetch, participants list)
- `src/app/join/` - Registration page
- `src/app/login/` - Login page
- `src/app/my-picks/` - Multi-step pick submission form (groups, bonus, payment, review)
- `src/app/` - All display pages (home, leaderboard, picks, rules, groups, schedule, how-to-play)

## Data Model
- `UserRecord` in KV: id, name, email, passcodeHash, paymentConfirmed, createdAt
- `PicksRecord` in KV: participantId, groupPredictions, bonus picks, tiebreaker, knockout picks
- Scoring: Group exact position = 3 pts, right bucket = 1 pt. Bonuses = 10 pts each. Knockout: R32=2, R16=4, QF=6, SF=8, F=10 pts.
- Max points: Tier 1 = 174 (144 groups + 30 bonus), Tier 2 = 124 (114 bracket + 10 Golden Ball), Overall = 298

## Pick Visibility
- Tier 1 picks hidden from others until tournament starts (June 11, 2026). Each user sees only their own.
- Tier 2 picks hidden until knockout stage begins (June 28, 2026).
- Simple client-side date check; not a security measure.

## Notes
- Params in dynamic routes are a Promise in Next.js 16 (must `await params`)
- Picks page is a client component that fetches participants from /api/participants
- CountdownTimer shows dual countdown: Tier 1 picks deadline + tournament kickoff
- Date strings from schedule.ts parsed with parseLocalDate() to avoid UTC off-by-one
- Sanitize for edge cases: Infinity, NaN, null, division by zero in frontend code
