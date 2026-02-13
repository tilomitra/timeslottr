export { generateTimeslots } from './generate-timeslots.js';
export { generateDailyTimeslots } from './generate-daily-timeslots.js';
export type { DailyTimeslotConfig } from './generate-daily-timeslots.js';
export { createTimeslot, overlaps, contains, mergeSlots, findGaps, timeslotToJSON, timeslotFromJSON } from './timeslot.js';
export type { TimeslotJSON } from './timeslot.js';

export type {
  AlignmentStrategy,
  DateValue,
  LabelFormatter,
  TimeOfDayInput,
  Timeslot,
  TimeslotBoundaryInput,
  TimeslotGenerationConfig,
  TimeslotMetadata,
  TimeslotRangeInput
} from './types.js';
