# Factory Configuration: World Cup Fantasy

## Goal
Ship a production-quality World Cup 2026 fantasy league app with structured logging, test coverage, and clean types.

## Scope
- Next.js 16 App Router, TypeScript, Tailwind CSS v4
- Vercel deployment with KV storage
- Two-tier scoring: group predictions + knockout bracket

## Guards
- No modifications to eval/score.py or .factory/
- Python stdlib only in eval scripts
- All src/ changes must pass lint, type check, and tests

## Eval
```
python3 eval/score.py
```

## Smoke Test
```
npm run build
```

## Constraints
- Do not break existing API routes or storage layer
- Sanitize edge cases: Infinity, NaN, null, division by zero
- Mobile-first responsive design
- Follow CLAUDE.md conventions
