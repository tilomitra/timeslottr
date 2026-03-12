# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/tilomitra/timeslottr/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/tilomitra/timeslottr/compare/v0.2.0...v0.4.0
[0.2.0]: https://github.com/tilomitra/timeslottr/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tilomitra/timeslottr/releases/tag/v0.1.0
