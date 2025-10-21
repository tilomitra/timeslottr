export type DateValue = Date | string;

export type TimeOfDayInput =
  | string
  | {
      hour: number;
      minute?: number;
      second?: number;
    };

export type TimeslotBoundaryInput =
  | DateValue
  | {
      date?: DateValue;
      time: TimeOfDayInput;
    };

export interface TimeslotRangeInput {
  start: TimeslotBoundaryInput;
  end: TimeslotBoundaryInput;
}

export type AlignmentStrategy = 'start' | 'end' | 'center';

export interface TimeslotMetadata {
  index: number;
  durationMinutes: number;
  label?: string;
}

export interface Timeslot {
  /** Start of the range (inclusive). */
  start: Date;
  /** End of the range (exclusive). */
  end: Date;
  /** Optional metadata describing the slot. */
  metadata?: TimeslotMetadata;
}

export type LabelFormatter = (
  slot: { start: Date; end: Date },
  index: number,
  durationMinutes: number
) => string | undefined;

export interface TimeslotGenerationConfig {
  range: TimeslotRangeInput;
  slotDurationMinutes: number;
  slotIntervalMinutes?: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  excludedWindows?: TimeslotRangeInput[];
  timezone?: string;
  /**
   * Default calendar date used when the range uses time-only boundaries.
   * Example: `day: '2024-01-01'` combined with `range: { start: '09:00', end: '17:00' }`.
   */
  day?: DateValue;
  minimumSlotDurationMinutes?: number;
  maxSlots?: number;
  includeEdge?: boolean;
  alignment?: AlignmentStrategy;
  labelFormatter?: LabelFormatter;
}
