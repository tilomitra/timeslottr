# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-11-22

### Added
- `generateDailyTimeslots` utility for generating slots across a date range (e.g., multiple days).

### Fixed
- Internal time formatter now uses `hourCycle: 'h23'` for consistent 24-hour parsing across all environments.
