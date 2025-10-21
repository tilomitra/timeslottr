# timeslottr

A TypeScript library for generating time slots and checking if they overlap. Works with both ESM and CommonJS modules.

## Key features

- **Fast:** Written in TypeScript with efficient code that only uses the memory you need.
- **Zero dependencies:** No external packages, keeping the library small and secure.
- **Works everywhere:** Runs in Node.js, edge runtimes, and modern browsers.
- **Timezone support:** Handles different date and time formats in any timezone.
- **Flexible scheduling:** Add buffers, exclude time ranges, customize intervals, and control slot alignment.
- **Built-in metadata:** Each slot includes useful information like index, duration, and custom labels.

## Installation

```bash
npm install timeslottr
```

## Quick start

```ts
import { generateTimeslots } from 'timeslottr';

const slots = generateTimeslots({
  day: '2024-01-01',
  timezone: 'America/New_York',
  range: { start: '09:00', end: '17:30' },
  slotDurationMinutes: 45,
  slotIntervalMinutes: 30,
  bufferBeforeMinutes: 15,
  excludedWindows: [
    { start: '12:00', end: '13:00' } // lunch break
  ],
  minimumSlotDurationMinutes: 20,
  alignment: 'start',
  labelFormatter: ({ start }) => start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
});

console.log(slots.map((slot) => ({
  start: slot.start.toISOString(),
  end: slot.end.toISOString(),
  label: slot.metadata?.label
})));
```

## Demo playground

- Generate the latest library build: `npm run build`.
- Serve the `demo/` directory with any static file server (for example: `npx serve demo`).
- Open the displayed URL to interact with the Tailwind-powered playground that consumes the compiled module from `dist/`.

When you are ready to publish the playground on GitHub Pages, copy the contents of `demo/` together with the freshly built `dist/` directory into your `gh-pages` branch so that `index.html` and the compiled bundle live side-by-side.

## Configuration

| Option | Type | Description |
| --- | --- | --- |
| `range` | `{ start, end }` | Required boundaries for the generation window. Each boundary accepts a `Date`, an ISO-like string, a time-only string (`"09:00"`), or `{ date, time }`. Time-only inputs need a `day` default or an inline `date`. |
| `day` | `string \| Date` | Default calendar day when `range`/`excludedWindows` use time-only strings. |
| `slotDurationMinutes` | `number` | Length of each primary slot. Must be positive. |
| `slotIntervalMinutes` | `number` | Step between slot starts. Defaults to `slotDurationMinutes`, enabling overlaps or gaps when customised. |
| `bufferBeforeMinutes` / `bufferAfterMinutes` | `number` | Trim the usable window by applying leading/trailing buffers. |
| `excludedWindows` | `TimeslotRangeInput[]` | Sub-ranges to omit (breaks, blackout periods). Overlapping windows are merged. |
| `timezone` | `string` | IANA time zone used when interpreting date-only or time-only inputs (`America/New_York`, `UTC`, …). |
| `alignment` | `'start' \| 'end' \| 'center'` | Controls how leftover time is handled. `start` truncates at the end, `end` aligns slots backwards from the range end, `center` distributes leftover time evenly. |
| `minimumSlotDurationMinutes` | `number` | Minimum allowable length for partial edge slots. Defaults to `slotDurationMinutes`. |
| `includeEdge` | `boolean` | Include truncated edge slots when their duration is above the minimum. Defaults to `true`. |
| `maxSlots` | `number` | Hard limit on the number of generated slots. |
| `labelFormatter` | `({ start, end }, index, durationMinutes) => string` | Optional metadata helper for injecting labels or display text. |

Each generated `Timeslot` contains immutable `Date` instances and optional metadata:

```ts
{
  start: Date;
  end: Date;
  metadata?: {
    index: number;
    durationMinutes: number;
    label?: string;
  };
}
```

## Additional utilities

- `createTimeslot(start: Date, end: Date)` — runtime validation helper that clones the provided `Date` instances.
- `overlaps(a: Timeslot, b: Timeslot)` — predicate that reports whether two slots intersect.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Generate production build
npm run build
```

The build pipeline uses [tsup](https://github.com/egoist/tsup) to emit dual ESM/CJS bundles in `dist/` with type definitions. Tests are written with [Vitest](https://vitest.dev/).
