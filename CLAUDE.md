# timeslottr

## Project overview

A zero-dependency TypeScript library for generating time slots. Dual ESM/CJS build via tsup. Tests with Vitest.

## Key paths

- `src/` — library source (entry: `src/index.ts`)
- `src/types.ts` — all public TypeScript types
- `src/timeslot.ts` — utility functions (createTimeslot, overlaps, contains, mergeSlots, findGaps, JSON helpers)
- `src/generate-timeslots.ts` — single-day slot generation
- `src/generate-daily-timeslots.ts` — multi-day slot generation, Weekday enum
- `src/internal/` — internal implementation (boundaries, config validation, exclusions, slot algorithm, time utils)
- `demo/` — Next.js 14 demo site (deployed to Vercel at timeslottr.vercel.app)
- `demo/app/page.tsx` — main demo page
- `demo/components/api-reference.tsx` — API reference section component
- `dist/` — build output

## API documentation rule

**When the public API changes (new functions, changed signatures, new config options, removed exports, type changes), you MUST update BOTH:**

1. **`README.md`** — the Configuration table, Utilities section, and any relevant code examples
2. **`demo/components/api-reference.tsx`** — the corresponding function cards, config table rows, type definitions, and code examples

Always keep these two in sync. Do not consider an API change complete until both are updated.
