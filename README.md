# timeslottr

[**View Interactive Demo**](https://timeslottr.vercel.app/)

A TypeScript library for generating time slots and checking if they overlap. Works with both ESM and CommonJS modules.

## Key features

- **Fast:** Written in TypeScript with efficient code that only uses the memory you need.
- **Zero dependencies:** No external packages, keeping the library small and secure.
- **Works everywhere:** Runs in Node.js, edge runtimes, and modern browsers.
- **Timezone support:** Handles different date and time formats in any timezone.
- **Flexible scheduling:** Add buffers, exclude time ranges, customize intervals, and control slot alignment.
- **Comprehensive Test Coverage:** 90%+ test coverage.
- **Built-in metadata:** Each slot includes useful information like index, duration, and custom labels.
- **Rich utilities:** Merge overlapping slots, find gaps in schedules, check containment, and serialize to/from JSON.

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

## Multi-day scheduling

To generate slots across a range of dates (e.g., "9am to 5pm" for every day from Jan 1st to Jan 7th), use `generateDailyTimeslots`. This helper applies your configuration to each day within the specified period.

```ts
import { generateDailyTimeslots } from 'timeslottr';

const slots = generateDailyTimeslots(
  // The outer window (e.g. a full week)
  { start: '2024-01-01', end: '2024-01-08' },
  {
    // The daily schedule (applied to each day in the window)
    range: { start: '09:00', end: '17:00' },
    slotDurationMinutes: 60,
    timezone: 'America/New_York',
    // ... other config options (buffers, exclusions, etc.)
  }
);
```

## Demo playground

The project includes a Next.js-based interactive playground hosted at [timeslottr.vercel.app](https://timeslottr.vercel.app/).

You can also run it locally:

1. Navigate to the demo directory: `cd demo`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

The demo showcases various configuration options and visualizes the generated timeslots.

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

## Utilities

### Creating and validating slots

```ts
import { createTimeslot } from 'timeslottr';

const slot = createTimeslot(
  new Date('2024-01-01T09:00:00Z'),
  new Date('2024-01-01T10:00:00Z')
);
// Throws TypeError for invalid dates, RangeError if end <= start
```

### Checking for overlaps

```ts
import { overlaps } from 'timeslottr';

overlaps(slotA, slotB); // true if the two slots intersect
```

### Checking if a time falls within a slot

```ts
import { contains } from 'timeslottr';

contains(slot, new Date('2024-01-01T09:30:00Z')); // true
contains(slot, new Date('2024-01-01T10:00:00Z')); // false (end is exclusive)
```

### Merging overlapping slots

```ts
import { mergeSlots } from 'timeslottr';

const merged = mergeSlots([slotA, slotB, slotC]);
// Sorts by start time, merges any overlapping or adjacent slots
```

### Finding gaps (free time)

```ts
import { findGaps } from 'timeslottr';

const free = findGaps(bookedSlots, {
  start: new Date('2024-01-01T09:00:00Z'),
  end: new Date('2024-01-01T17:00:00Z')
});
// Returns unbooked time slots within the range
```

### JSON serialization

`Date` objects don't survive `JSON.stringify` → `JSON.parse` round-trips. Use the built-in helpers:

```ts
import { timeslotToJSON, timeslotFromJSON } from 'timeslottr';

const json = timeslotToJSON(slot);
// { start: "2024-01-01T09:00:00.000Z", end: "2024-01-01T10:00:00.000Z", metadata: { ... } }

const restored = timeslotFromJSON(json);
// Timeslot with proper Date instances — validates dates and start < end
```

### Multi-day scheduling

`generateDailyTimeslots` applies your configuration to each day within a date range:

```ts
import { generateDailyTimeslots } from 'timeslottr';

const slots = generateDailyTimeslots(
  { start: '2024-01-01', end: '2024-01-08' },
  {
    range: { start: '09:00', end: '17:00' },
    slotDurationMinutes: 60,
    timezone: 'America/New_York',
    maxDays: 365, // optional safety limit (default: 10,000)
  }
);
```

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
