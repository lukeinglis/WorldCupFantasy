# Factory Configuration
<!-- This file configures the Remote Factory for your project. -->

## Goal

World Cup 2026 Fantasy contest app: a friends league with two-tier scoring (group predictions + knockout bracket), mini games, live scoring via football-data.org API, deployed on Vercel.

## Scope

### Modifiable

- src/**/*.ts
- src/**/*.tsx
- src/app/**/*
- src/components/**/*
- src/data/**/*
- src/lib/**/*
- eval/**/*
- public/**/*
- factory.md
- next.config.ts
- package.json

### Read-only

- CLAUDE.md
- AGENTS.md
- tsconfig.json
- tailwind.config.ts
- postcss.config.mjs

## Guards

- Do not delete or overwrite existing tests
- Do not modify files outside the declared scope
- Do not introduce secrets or credentials into the repository
- Do not modify the scoring constants or max point values without explicit approval
- Do not change pick visibility date gates (June 11 for Tier 1, June 28 for Tier 2)

## Eval

### Command

```bash
python3 eval/score.py
```

### Threshold

0.6

## Target Branch

main

## Smoke Test

```bash
npm run build
```

## Constraints

- Prefer small, incremental changes over large rewrites
- Mobile-first responsive design: all UI changes must work on small screens
- Follow existing color scheme: pitch green (#1B5E20), navy (#0A1628), gold (#FFD700), accent green (#00E676)
- Sanitize for edge cases: Infinity, NaN, null, division by zero in frontend code
- Use Oswald for headings, Source Sans 3 for body text
- Never use emdashes or double-dashes in content text
