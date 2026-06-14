# timeslottr docs

The documentation and playground site for the [`timeslottr`](https://www.npmjs.com/package/timeslottr)
library, built with [Nextra 4](https://nextra.site/) (Next.js 14, App Router) and
deployed to Vercel at [timeslottr.vercel.app](https://timeslottr.vercel.app/).

## Structure

All content is MDX under `content/`, ordered by `_meta.ts` files:

```
content/
  index.mdx              # Getting Started (home)
  docs/                  # Guide
    core-concepts.mdx    #   half-open intervals, timezones & DST
    scheduling.mdx       #   single / multi-day / per-weekday
    availability.mdx     #   multi-party availability
    recipes.mdx          #   task-oriented snippets
  api/                   # Reference
    generation.mdx       #   generateTimeslots, generateDailyTimeslots, generateAvailableTimeslots
    availability.mdx     #   subtract, intersect
    utilities.mdx        #   createTimeslot, overlaps, contains, mergeSlots, findGaps, JSON helpers
    configuration.mdx    #   config option tables
    types.mdx            #   exported types
  playground.mdx         # embeds the interactive <Playground />
```

Nextra provides the sidebar, per-page table of contents, search, and dark mode.
The interactive Playground (`components/playground/`) and the shadcn-style
primitives it uses (`components/ui/`) are React components embedded into
`content/playground.mdx`.

## Local development

```bash
cd demo
npm install        # also links the local library via "timeslottr": "file:.."
npm run dev        # http://localhost:3000 (auto-increments if the port is taken)
```

> **Search** is powered by [Pagefind](https://pagefind.app/), which only indexes a
> production build — it is empty under `npm run dev`. To try search locally:
>
> ```bash
> npm run build && npm run start
> ```

When you change the library source (`../src`), rebuild the root `dist` so the docs
and Playground pick up the changes (the dependency is a `file:..` symlink).

## How the styling is wired (gotchas)

- **Nextra theme CSS** is Tailwind-v4 compiled and would be mangled by this app's
  Tailwind v3 PostCSS pipeline. So it is copied to `public/nextra-theme.css` by the
  `copy:theme` script (run automatically via `predev`/`prebuild`) and loaded with a
  `<link>` in `app/layout.tsx`, bypassing PostCSS. Tailwind (with preflight
  disabled) processes only `app/globals.css`, which holds the Playground's design
  tokens and utilities.
- **`zod` is pinned** to `~4.1.12` via `overrides` in `package.json`: Nextra 4.6
  strips `children` before validating its `Layout` props, and zod 4.4+ errors
  ("expected nonoptional") on the absent key.

`public/nextra-theme.css` and `public/_pagefind/` are generated and git-ignored.

## Deployment on Vercel

1. Push to a GitHub repository.
2. Create a new Vercel project and import the repo.
3. Set the **Root Directory** to `demo` (the site lives in this subdirectory).
4. The build command (`next build`) and output (`.next`) are detected
   automatically; the `prebuild`/`postbuild` hooks copy the theme CSS and build the
   Pagefind search index.
5. Deploy.
