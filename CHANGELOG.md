# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.1] - 2026-08-05

### Fixed
- Date inputs that resolved to the wrong day without reporting anything. Both cases hit `excludedWindows` hardest: an exclusion dated to a day that never matched silently didn't apply, leaving the slot it was meant to block bookable.
  - Days past the end of their month (`2025-02-30`, `2025-04-31`) were accepted and rolled over into the following month. They now throw a `RangeError`. 29 February is checked against the full leap-year rule, so `2024-02-29` and `2000-02-29` are valid while `2025-02-29` and `1900-02-29` are not.
  - Date-only strings outside the strict `YYYY-MM-DD` form (`2025-3-5`, `2025/03/05`) were handed to the engine, which resolved them against the *system* zone rather than the configured `timezone` — landing a day off whenever the two disagreed, and giving different results on different machines. They now throw a `TypeError` naming the strict form. Strings carrying an explicit time are unchanged.
- Applies to every date input — `range`, `day`, `now`, `excludedWindows`, `busy`, and the `generateDailyTimeslots` period — since all of them share the same resolution helpers.

## [1.2.0] - 2026-08-05

### Added
- Booking window options, so generators only return slots that are actually bookable. Available on `generateTimeslots`, `generateDailyTimeslots`, and `generateAvailableTimeslots`:
  - `minimumNoticeMinutes` — required lead time; drops slots starting before `now + minimumNoticeMinutes`.
  - `maximumAdvanceDays` — how far ahead bookings are allowed, as whole calendar days. The cutoff keeps the same wall-clock time across a DST transition rather than adding 24-hour blocks. Must be a positive integer.
  - `now` — reference time for both, defaulting to `new Date()`. Pass it for deterministic output or to gate against a server clock. Never read when neither option is set, so generation stays pure otherwise.
- Filtering is on each slot's start, using the same half-open semantics as the rest of the library: a slot starting exactly at the notice boundary is kept, one starting exactly at the advance cutoff is not.
- Unbookable slots are dropped before `maxSlots` is applied, so the cap counts bookable slots only, and surviving slots are renumbered contiguously from `0`.

## [1.1.0] - 2026-06-14

### Added
- Multi-party availability layer for turning a base schedule into bookable slots:
  - `subtract(source, busy)` — remove busy intervals from available intervals (availability − bookings = free time). Handles unsorted/overlapping/boundary-touching busy and mid-interval splits. `O((n + m) log m)` via sort + sweep.
  - `intersect(intervalSets)` — find the windows where every participant's free-interval set overlaps (a time that works for the whole team). `O(total intervals · log)` via sweep, no pairwise nested loops.
  - `generateAvailableTimeslots(config)` — `generateTimeslots` config plus optional `busy` and `participantsBusy`; composes base-availability → subtract → intersect → the existing slot generator.
  - Exported `Interval` and `AvailableTimeslotConfig` types.
- All new primitives use half-open `[start, end)` semantics consistent with the rest of the library, and `busy` accepts the same flexible formats as `range` / `excludedWindows`.

## [1.0.0] - 2026-03-30

### Added
- CI workflow: tests run on Node 18/20/22 for every push and PR.
- Publish workflow: auto-publishes to npm with provenance on GitHub release.

### Changed
- Promoted to v1.0.0 — public API is now stable.

## [0.4.0] - 2026-03-09

### Added
- Per-weekday schedule support for `generateDailyTimeslots` — pass a `Map<Weekday, TimeslotRangeInput>` as the `range` to define different time windows per day of the week.
- `Weekday` enum and `WeekdayTimeslotRangeInput` type exported from the package.
- Interactive demo playground now supports multi-day mode with per-weekday schedule configuration.

### Fixed
- Restored period boundary validation (`end > start`) in `generateDailyTimeslots` that was lost during the `resolveBoundary` refactor.

## [0.2.0] - 2025-11-22

### Added
- `generateDailyTimeslots` utility for generating slots across a date range (e.g., multiple days).

### Fixed
- Internal time formatter now uses `hourCycle: 'h23'` for consistent 24-hour parsing across all environments.

## [0.1.0] - 2025-10-01

### Added
- `generateTimeslots` function for generating time slots within a configurable range.
- Timezone support via IANA time zone identifiers.
- Configurable slot duration, interval, and alignment (`start`, `end`, `center`).
- Buffer support (`bufferBeforeMinutes`, `bufferAfterMinutes`) to trim usable windows.
- Excluded windows for omitting breaks or blackout periods.
- `minimumSlotDurationMinutes` and `includeEdge` options for partial edge slot handling.
- `maxSlots` option to cap the number of generated slots.
- `labelFormatter` callback for attaching custom labels to slot metadata.
- Overlap detection and timeslot utility functions (`mergeOverlapping`, `findGaps`, `contains`, `toJSON`, `fromJSON`).
- ESM and CommonJS dual-package support.
- TypeScript type definitions included in the package.

[Unreleased]: https://github.com/tilomitra/timeslottr/compare/v1.2.1...HEAD
[1.2.1]: https://github.com/tilomitra/timeslottr/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/tilomitra/timeslottr/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/tilomitra/timeslottr/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/tilomitra/timeslottr/compare/v0.4.0...v1.0.0
[0.4.0]: https://github.com/tilomitra/timeslottr/compare/v0.2.0...v0.4.0
[0.2.0]: https://github.com/tilomitra/timeslottr/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tilomitra/timeslottr/releases/tag/v0.1.0
