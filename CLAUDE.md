# timeslottr

## Project overview

A zero-dependency TypeScript library for generating time slots. Dual ESM/CJS build via tsup. Tests with Vitest.

## Key paths

- `src/` — library source (entry: `src/index.ts`)
- `src/types.ts` — all public TypeScript types
- `src/timeslot.ts` — utility functions (createTimeslot, overlaps, contains, mergeSlots, findGaps, JSON helpers)
- `src/generate-timeslots.ts` — single-day slot generation (exports `prepareTimeslotGeneration` for reuse by the availability layer)
- `src/generate-daily-timeslots.ts` — multi-day slot generation, Weekday enum
- `src/availability.ts` — multi-party availability layer: `subtract` (availability − busy), `intersect` (overlap across participants), `generateAvailableTimeslots` (compose subtract/intersect + existing slotter). Half-open `[start, end)` intervals on the `Interval` type.
- `src/internal/` — internal implementation (boundaries, config validation, exclusions, slot algorithm, time utils)
- `demo/` — **Nextra 4** docs site (Next.js 14 App Router, deployed to Vercel at timeslottr.vercel.app)
- `demo/content/` — all docs as MDX, ordered by `_meta.ts` files: `index.mdx` (Getting Started), `docs/*` (Guide: core-concepts, scheduling, availability, recipes), `api/*` (Reference: generation, availability, utilities, configuration, types), `playground.mdx`
- `demo/app/layout.tsx` — Nextra `Layout`/`Navbar`/`Footer`; `app/[[...mdxPath]]/page.tsx` — Nextra catch-all route; `mdx-components.tsx` — MDX component map
- `demo/components/playground/` — the interactive Playground (client component embedded in `content/playground.mdx`); `components/ui/` — shadcn-style primitives it uses
- `dist/` — build output

## Demo (Nextra) notes

- Nextra's prebuilt CSS is **Tailwind v4** compiled; the demo runs Tailwind v3. To avoid a PostCSS clash, Nextra's `style.css` is copied to `public/nextra-theme.css` by the `copy:theme` script (run via `predev`/`prebuild`) and loaded with a `<link>` in `app/layout.tsx` — it does NOT pass through the demo's Tailwind pipeline. Tailwind (preflight disabled) processes only `app/globals.css` for the Playground's tokens/utilities.
- `package.json` pins `zod` to `~4.1.12` via `overrides`: Nextra 4.6 strips `children` before validating Layout props, and zod 4.4+ errors ("expected nonoptional") on the absent key.
- The demo depends on the **published** `timeslottr` package (`^1.0.0`), not the local source, so it builds standalone on Vercel (a `file:..` link can't resolve there — root `dist/` is gitignored). The Playground only uses released API; bump the version in `demo/package.json` after a library release to surface new APIs in examples.
- Search is Pagefind (`postbuild` script); it only indexes a production build, so search is empty under `next dev`.

## API documentation rule

**When the public API changes (new functions, changed signatures, new config options, removed exports, type changes), you MUST update BOTH:**

1. **`README.md`** — the Configuration table, Utilities section, and any relevant code examples
2. **`demo/content/`** — the relevant MDX: `api/*.mdx` (function signatures, config/type tables, examples) and any affected `docs/*.mdx` guide page

Always keep these two in sync. Do not consider an API change complete until both are updated.
