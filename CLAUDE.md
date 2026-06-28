@AGENTS.md

# World Cup 2026 Fantasy

## Project
- Next.js 16 App Router with TypeScript and Tailwind CSS v4
- Deployed on Vercel at worldcup.lukeinglis.me
- Two-tier scoring system: Tier 1 (group predictions) + Tier 2 (knockout bracket)
- Participant data stored in Vercel KV (Redis); requires KV_REST_API_URL and KV_REST_API_TOKEN env vars
- Simple name + email authentication (no passwords, friends league)
- Free to play, just for fun among friends

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
- `src/data/scoring.ts` - Scoring engine with hardcoded group results, bonus ties, knockout scoring with late penalty
- `src/data/knockout-bracket.ts` - Hardcoded R32 matchups from FIFA bracket, bracket structure
- `src/data/schedule.ts` - Match schedule, venues, and `parseLocalDate()` helper
- `src/lib/storage.ts` - Vercel KV storage layer (user records, picks, participant lists)
- `src/lib/live-scoring.ts` - Fetches live results from football-data.org (Golden Boot, knockout results, tournament status)
- `src/lib/auth.ts` - User ID generation, admin email check
- `src/lib/tournament-dates.ts` - Tournament date constants and pick visibility helpers
- `src/components/BracketPicker.tsx` - Interactive bracket picker (March Madness layout desktop, list view mobile)
- `src/components/AuthProvider.tsx` - React context for auth state (localStorage + API)
- `src/components/picks/KnockoutBracketSection.tsx` - Knockout picks display with submission-gated visibility
- `src/app/api/picks/route.ts` - Pick submission with Tier 1/2 handlers, deadline enforcement, lock after submit
- `src/app/api/knockout-matches/route.ts` - Serves hardcoded R32 matchups
- `src/app/api/participants/route.ts` - Participants list with conditional knockout pick visibility
- `src/app/my-picks/` - Pick form with group rankings, bonus picks, and bracket picker
- `src/app/groups/` - Groups mega-page with Standings, Picks, Schedule, Knockout tabs

## Data Model
- `UserRecord` in KV: id, name, email, emailLower, createdAt
- `PicksRecord` in KV: participantId, groupPredictions, bonus picks, tiebreaker, knockoutPicks, tier2Submitted
- `Participant` includes `tier2SubmittedAt` for late penalty calculation
- Scoring: Group exact position = 3 pts, right bucket = 1 pt. Bonuses = 10 pts each. Knockout: R32=2, R16=4, QF=6, SF=8, 3rd=8, F=10 pts.
- Max points: Tier 1 = 174 (144 groups + 30 bonus), Tier 2 = 132 (122 bracket + 10 Golden Ball), Overall = 306
- Group results hardcoded in scoring.ts (group stage complete June 27)
- Bonus ties: FRA/GER/NED all count for Most Goals Team, ESP/MEX for Fewest Conceded
- Golden Boot stays dynamic (tournament-wide award, pulled from API)
- R32 matchups hardcoded in knockout-bracket.ts with FIFA bracket path lookup
- Late penalty: 0 pts for played matches at submission time, half pts for tainted teams in future rounds

## Pick Visibility
- Tier 1 picks hidden from others until tournament starts (June 11, 2026)
- Tier 2 picks hidden until the viewer has submitted their own knockout picks (submission-gated, not date-gated)
- Tier 1 submissions locked after tournament start (server enforced)
- Tier 2 submissions locked after first submit (no edits allowed)

## Notes
- Params in dynamic routes are a Promise in Next.js 16 (must `await params`)
- Groups page consolidates Standings, Picks, Schedule, Knockout into tabbed mega-page
- Date strings from schedule.ts parsed with parseLocalDate() to avoid UTC off-by-one
- Sanitize for edge cases: Infinity, NaN, null, division by zero in frontend code
- football-data.org free tier: 10 req/min, request deduplication prevents cold-cache rate limiting
- TLA normalization at API boundary: CUW->CUR, URU->URY
