<div align="center">

# timeslottr

Generate time slots — and find when everyone's free.<br>
Timezone- and DST-correct. Zero dependencies. TypeScript-first.

[![npm version](https://img.shields.io/npm/v/timeslottr)](https://www.npmjs.com/package/timeslottr)
[![gzip size](https://img.shields.io/bundlephobia/minzip/timeslottr)](https://bundlephobia.com/package/timeslottr)
[![license](https://img.shields.io/npm/l/timeslottr)](https://www.npmjs.com/package/timeslottr)
[![downloads](https://img.shields.io/npm/dm/timeslottr)](https://www.npmjs.com/package/timeslottr)

[Docs](https://timeslottr.vercel.app/) · [API Reference](https://timeslottr.vercel.app/api/generation) · [Playground](https://timeslottr.vercel.app/playground)

</div>

## Why timeslottr

- **Multi-party availability, built in.** Subtract booked time and intersect across people to find slots that work for the whole team — the Calendly / cal.com primitive, as pure interval math (sort-and-sweep, not naive `n × m`). No other zero-dependency library ships this.
- **Timezone & DST correct.** Built on the platform `Intl` API — no `dayjs` or `date-fns`. Spring-forward and fall-back days produce the right number of real-time slots, and every slot is exactly its duration in elapsed time.
- **Zero dependencies.** Dual ESM/CJS, fully typed, tree-shakeable; runs in Node.js, edge runtimes, and modern browsers — with no transitive supply-chain surface.
- **Half-open `[start, end)` everywhere.** Slots that touch a boundary never falsely overlap — the off-by-one class of booking bug is designed out, across `overlaps`, `subtract`, `intersect`, and `findGaps`.
- **Flexible generation.** Single-day, multi-day, and per-weekday schedules with buffers, exclusions, alignment, edge slots, minimum duration, `maxSlots`, and custom labels.
- **Batteries included.** Slot metadata (index, duration, label), utilities to merge, find gaps, check containment, and serialize to/from JSON — and 90%+ test coverage.

> timeslottr is a slot & availability **engine**, not a booking product — it gives you the interval math to build on, not calendar sync or persistence.

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

### Per-weekday schedules

You can define different time ranges for each day of the week by passing a `Map<Weekday, TimeslotRangeInput>` as the `range`. Days not included in the map are skipped. Set a weekday to `null` to explicitly exclude it.

```ts
import { generateDailyTimeslots, Weekday } from 'timeslottr';
import type { WeekdayTimeslotRangeInput } from 'timeslottr';

const weekdayRanges: WeekdayTimeslotRangeInput = new Map([
  [Weekday.MON, { start: '09:00', end: '17:00' }],
  [Weekday.TUE, { start: '09:00', end: '17:00' }],
  [Weekday.WED, { start: '09:00', end: '12:00' }], // half day
  [Weekday.THU, { start: '09:00', end: '17:00' }],
  [Weekday.FRI, { start: '10:00', end: '16:00' }], // late start, early finish
  // SAT and SUN omitted — no slots generated on weekends
]);

const slots = generateDailyTimeslots(
  { start: '2024-01-01', end: '2024-01-14' },
  {
    range: weekdayRanges,
    slotDurationMinutes: 60,
    timezone: 'America/New_York',
  }
);
```

## Configuration

| Option | Type | Description |
| --- | --- | --- |
| `range` | `{ start, end }` or `Map<Weekday, { start, end } \| null>` | Required boundaries for the generation window. Each boundary accepts a `Date`, an ISO-like string, a time-only string (`"09:00"`), or `{ date, time }`. Time-only inputs need a `day` default or an inline `date`. For `generateDailyTimeslots`, you can pass a `Map` keyed by `Weekday` to define per-weekday schedules; omitted days produce no slots. |
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

`generateDailyTimeslots` applies your configuration to each day within a date range. The `range` can be a single `TimeslotRangeInput` (same schedule every day) or a `Map<Weekday, TimeslotRangeInput | null>` for per-weekday schedules:

```ts
import { generateDailyTimeslots, Weekday } from 'timeslottr';

// Same schedule every day
const slots = generateDailyTimeslots(
  { start: '2024-01-01', end: '2024-01-08' },
  {
    range: { start: '09:00', end: '17:00' },
    slotDurationMinutes: 60,
    timezone: 'America/New_York',
    maxDays: 365, // optional safety limit (default: 10,000)
  }
);

// Different schedule per weekday
const weekdaySlots = generateDailyTimeslots(
  { start: '2024-01-01', end: '2024-01-08' },
  {
    range: new Map([
      [Weekday.MON, { start: '09:00', end: '17:00' }],
      [Weekday.WED, { start: '09:00', end: '12:00' }],
      [Weekday.FRI, { start: '10:00', end: '16:00' }],
    ]),
    slotDurationMinutes: 60,
    timezone: 'America/New_York',
  }
);
```

The `Weekday` enum values are: `SUN` (0), `MON` (1), `TUE` (2), `WED` (3), `THU` (4), `FRI` (5), `SAT` (6).

## Multi-party availability

Turn a base schedule into real bookable slots by subtracting booked time and intersecting across people — the layer scheduling products (Calendly / cal.com style) actually need. Everything uses half-open `[start, end)` intervals, so a slot that ends exactly when another begins never counts as a conflict.

`generateAvailableTimeslots` takes the **same config as `generateTimeslots`** plus two optional fields:

- `busy` — booked events to remove from availability (shared bookings that block everyone).
- `participantsBusy` — per-person busy sets; the result is narrowed to windows where **everyone** is free.

Busy times accept the same flexible formats as `range` / `excludedWindows` (`string | Date | { date, time }`).

```ts
import { generateAvailableTimeslots } from 'timeslottr';

const slots = generateAvailableTimeslots({
  day: '2024-01-01',
  timezone: 'America/New_York',
  range: { start: '09:00', end: '17:00' },
  slotDurationMinutes: 30,

  // already-booked events on the host's calendar
  busy: [
    { start: '12:00', end: '13:00' },                                   // lunch
    { start: new Date('2024-01-01T15:00:00-05:00'), end: new Date('2024-01-01T15:30:00-05:00') }
  ],

  // each invitee's busy times — only times where ALL are free survive
  participantsBusy: [
    [{ start: '09:00', end: '10:00' }],                                  // Alice
    [{ start: { date: '2024-01-01', time: '16:00' }, end: { date: '2024-01-01', time: '17:00' } }] // Bob
  ]
});
// → 30-min slots between 10:00 and 16:00, excluding lunch and the 15:00 booking
```

Under the hood it composes two pure interval primitives you can also use directly. Both operate on resolved `Interval` objects (`{ start: Date; end: Date }`):

```ts
import { subtract, intersect } from 'timeslottr';

// availability − bookings = free time. A busy window in the middle splits the
// source in two; busy may be unsorted, overlapping, or boundary-touching.
const free = subtract(
  [{ start: new Date('2024-01-01T09:00Z'), end: new Date('2024-01-01T17:00Z') }],
  [{ start: new Date('2024-01-01T12:00Z'), end: new Date('2024-01-01T13:00Z') }]
);
// → [09:00–12:00, 13:00–17:00]

// find a time that works for the whole team: windows where every set overlaps.
// 0 sets → []; 1 set → merged copy; any empty set → [] (no availability blocks all).
const team = intersect([
  [{ start: new Date('2024-01-01T09:00Z'), end: new Date('2024-01-01T15:00Z') }],
  [{ start: new Date('2024-01-01T11:00Z'), end: new Date('2024-01-01T17:00Z') }]
]);
// → [11:00–15:00]
```

`subtract` runs in `O((n + m) log m)` and `intersect` in `O(total intervals · log)` — both via sort + sweep, never a nested `n × m` scan. Slotting (duration, interval, alignment, buffers, labels, `maxSlots`, timezone/DST handling) is identical to `generateTimeslots`.

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
