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

/**
 * A resolved half-open time interval `[start, end)`.
 *
 * The start is inclusive and the end is exclusive — consistent with the rest of
 * the library (see {@link Timeslot}, {@link contains}). This is the shape the
 * multi-party availability primitives ({@link subtract}, {@link intersect})
 * operate on.
 */
export interface Interval {
  /** Start of the interval (inclusive). */
  start: Date;
  /** End of the interval (exclusive). */
  end: Date;
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
  /**
   * Reference "current time" for the booking window options below. Defaults to
   * `new Date()`. Pass an explicit value to make generation deterministic in
   * tests, or to gate against a server clock rather than the caller's.
   *
   * Ignored unless `minimumNoticeMinutes` or `maximumAdvanceDays` is set.
   */
  now?: DateValue;
  /**
   * Minimum lead time before a slot can be booked. Slots starting earlier than
   * `now + minimumNoticeMinutes` are dropped — e.g. `120` for "no bookings
   * within two hours".
   *
   * Filtering is on the slot's **start**; a slot that has already begun is
   * never bookable regardless of when it ends.
   */
  minimumNoticeMinutes?: number;
  /**
   * How far into the future bookings are allowed, as a whole number of calendar
   * days. Slots starting at or after the same wall-clock time
   * `maximumAdvanceDays` days from `now` (in `timezone`) are dropped — e.g.
   * `60` for "you can book up to two months out".
   */
  maximumAdvanceDays?: number;
  includeEdge?: boolean;
  alignment?: AlignmentStrategy;
  labelFormatter?: LabelFormatter;
}
