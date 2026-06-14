export { generateTimeslots } from './generate-timeslots.js';
export { generateDailyTimeslots, Weekday } from './generate-daily-timeslots.js';
export type { DailyTimeslotConfig, WeekdayTimeslotRangeInput } from './generate-daily-timeslots.js';
export { createTimeslot, overlaps, contains, mergeSlots, findGaps, timeslotToJSON, timeslotFromJSON } from './timeslot.js';
export type { TimeslotJSON } from './timeslot.js';

export { subtract, intersect, generateAvailableTimeslots } from './availability.js';
export type { AvailableTimeslotConfig } from './availability.js';

export type {
  AlignmentStrategy,
  DateValue,
  Interval,
  LabelFormatter,
  TimeOfDayInput,
  Timeslot,
  TimeslotBoundaryInput,
  TimeslotGenerationConfig,
  TimeslotMetadata,
  TimeslotRangeInput
} from './types.js';
