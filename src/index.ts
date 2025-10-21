const MILLIS_PER_MINUTE = 60_000;

type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

type TimeOfDay = {
  hour: number;
  minute: number;
  second: number;
};

type TimeOfDayInput =
  | string
  | {
      hour: number;
      minute?: number;
      second?: number;
    };

export type DateValue = Date | string;

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

export type Timeslot = {
  /** Start of the range (inclusive). */
  start: Date;
  /** End of the range (exclusive). */
  end: Date;
  /** Optional metadata describing the slot. */
  metadata?: TimeslotMetadata;
};

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
  labelFormatter?: (
    slot: { start: Date; end: Date },
    index: number,
    durationMinutes: number
  ) => string | undefined;
}

type BoundaryContext = {
  timeZone?: string;
  defaultCalendarDate?: CalendarDate;
};

type ResolvedBoundary = {
  instant: Date;
  calendar: CalendarDate;
};

type NormalizedConfig = {
  durationMs: number;
  intervalMs: number;
  minDurationMs: number;
  includeEdge: boolean;
  alignment: AlignmentStrategy;
  maxSlots?: number;
  labelFormatter?: (
    slot: { start: Date; end: Date },
    index: number,
    durationMinutes: number
  ) => string | undefined;
};

const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();

function isDate(value: unknown): value is Date {
  return value instanceof Date;
}

function isTimeOfDayObject(value: unknown): value is { hour: number; minute?: number; second?: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'hour' in value &&
    typeof (value as { hour: unknown }).hour === 'number'
  );
}

function isDateOnlyString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function isTimeOnlyString(value: string): boolean {
  return /^\d{1,2}:\d{2}(?::\d{2})?$/.test(value.trim());
}

function getDateTimeFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = dateTimeFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    dateTimeFormatters.set(timeZone, formatter);
  }

  return formatter;
}

function getCalendarFromParts(parts: Intl.DateTimeFormatPart[]): CalendarDate & TimeOfDay {
  const map = new Map<string, string>();
  for (const part of parts) {
    if (part.type !== 'literal') {
      map.set(part.type, part.value);
    }
  }

  const year = Number(map.get('year'));
  const month = Number(map.get('month'));
  const day = Number(map.get('day'));
  const hour = Number(map.get('hour'));
  const minute = Number(map.get('minute'));
  const second = Number(map.get('second'));

  if ([year, month, day, hour, minute, second].some((num) => Number.isNaN(num))) {
    throw new Error('Unable to derive date parts from Intl.DateTimeFormat');
  }

  return { year, month, day, hour, minute, second };
}

function getTimeZoneOffset(date: Date, timeZone: string): number {
  const formatter = getDateTimeFormatter(timeZone);
  const { year, month, day, hour, minute, second } = getCalendarFromParts(formatter.formatToParts(date));
  const asUTC = Date.UTC(year, month - 1, day, hour, minute, second);
  return (asUTC - date.getTime()) / MILLIS_PER_MINUTE;
}

function zonedTimeToUtc(calendar: CalendarDate, time: TimeOfDay, timeZone: string): Date {
  const utcDate = new Date(Date.UTC(calendar.year, calendar.month - 1, calendar.day, time.hour, time.minute, time.second));
  const offset = getTimeZoneOffset(utcDate, timeZone);
  const adjusted = new Date(utcDate.getTime() - offset * MILLIS_PER_MINUTE);
  const offsetAfter = getTimeZoneOffset(adjusted, timeZone);
  if (offset !== offsetAfter) {
    return new Date(utcDate.getTime() - offsetAfter * MILLIS_PER_MINUTE);
  }
  return adjusted;
}

function toCalendarDateFromInstant(date: Date, timeZone?: string): CalendarDate {
  if (timeZone) {
    const formatter = getDateTimeFormatter(timeZone);
    const parts = formatter.formatToParts(date);
    const { year, month, day } = getCalendarFromParts(parts);
    return { year, month, day };
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate()
  };
}

function calendarFromDateOnlyString(value: string): CalendarDate {
  const trimmed = value.trim();
  if (!isDateOnlyString(trimmed)) {
    throw new TypeError(`Invalid date string: ${value}`);
  }

  const [yearStr, monthStr, dayStr] = trimmed.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12) {
    throw new RangeError(`Month out of range in date string: ${value}`);
  }
  if (day < 1 || day > 31) {
    throw new RangeError(`Day out of range in date string: ${value}`);
  }

  return { year, month, day };
}

function calendarFromDateValue(value: DateValue, timeZone?: string): CalendarDate {
  if (isDate(value)) {
    return toCalendarDateFromInstant(new Date(value.getTime()), timeZone);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (isDateOnlyString(trimmed)) {
      return calendarFromDateOnlyString(trimmed);
    }

    const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      throw new TypeError(`Invalid date string: ${value}`);
    }
    return toCalendarDateFromInstant(parsed, timeZone);
  }

  throw new TypeError('Unsupported date value');
}

function parseDateValue(value: DateValue, timeZone?: string, treatDateOnlyAsLocalMidnight = false): Date {
  if (isDate(value)) {
    const time = value.getTime();
    if (Number.isNaN(time)) {
      throw new TypeError('Invalid date provided');
    }
    return new Date(time);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (isDateOnlyString(trimmed) || treatDateOnlyAsLocalMidnight) {
      const calendar = calendarFromDateOnlyString(trimmed);
      return makeDateFromCalendarAndTime(calendar, { hour: 0, minute: 0, second: 0 }, timeZone);
    }

    const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      throw new TypeError(`Invalid date string: ${value}`);
    }
    return parsed;
  }

  throw new TypeError('Unsupported date value');
}

function parseTimeOfDay(input: TimeOfDayInput): TimeOfDay {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    const match = /^([0-9]{1,2}):([0-9]{2})(?::([0-9]{2}))?$/.exec(trimmed);
    if (!match) {
      throw new TypeError(`Invalid time string: ${input}`);
    }
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = match[3] ? Number(match[3]) : 0;

    if (hour < 0 || hour > 23) {
      throw new RangeError(`Hour out of range in time string: ${input}`);
    }
    if (minute < 0 || minute > 59) {
      throw new RangeError(`Minute out of range in time string: ${input}`);
    }
    if (second < 0 || second > 59) {
      throw new RangeError(`Second out of range in time string: ${input}`);
    }

    return { hour, minute, second };
  }

  if (isTimeOfDayObject(input)) {
    const { hour, minute = 0, second = 0 } = input;
    if (hour < 0 || hour > 23) {
      throw new RangeError(`Hour out of range: ${hour}`);
    }
    if (minute < 0 || minute > 59) {
      throw new RangeError(`Minute out of range: ${minute}`);
    }
    if (second < 0 || second > 59) {
      throw new RangeError(`Second out of range: ${second}`);
    }

    return { hour, minute, second };
  }

  throw new TypeError('Unsupported time input');
}

function makeDateFromCalendarAndTime(calendar: CalendarDate, time: TimeOfDay, timeZone?: string): Date {
  if (timeZone) {
    return zonedTimeToUtc(calendar, time, timeZone);
  }
  return new Date(calendar.year, calendar.month - 1, calendar.day, time.hour, time.minute, time.second, 0);
}

function resolveBoundary(input: TimeslotBoundaryInput, context: BoundaryContext): ResolvedBoundary {
  const { timeZone, defaultCalendarDate } = context;

  if (isDate(input)) {
    const instant = parseDateValue(input, timeZone);
    return { instant, calendar: toCalendarDateFromInstant(instant, timeZone) };
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (isTimeOnlyString(trimmed)) {
      if (!defaultCalendarDate) {
        throw new RangeError(`Time-only boundary "${input}" requires a default day (use config.day or provide a date).`);
      }
      const time = parseTimeOfDay(trimmed);
      const instant = makeDateFromCalendarAndTime(defaultCalendarDate, time, timeZone);
      return { instant, calendar: defaultCalendarDate };
    }

    if (isDateOnlyString(trimmed)) {
      const calendar = calendarFromDateOnlyString(trimmed);
      const instant = makeDateFromCalendarAndTime(calendar, { hour: 0, minute: 0, second: 0 }, timeZone);
      return { instant, calendar };
    }

    const normalized = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
    const instant = new Date(normalized);
    if (Number.isNaN(instant.getTime())) {
      throw new TypeError(`Invalid boundary string: ${input}`);
    }
    return { instant, calendar: toCalendarDateFromInstant(instant, timeZone) };
  }

  if (typeof input === 'object' && input !== null && 'time' in input) {
    const time = parseTimeOfDay(input.time);
    const calendar = input.date
      ? calendarFromDateValue(input.date, timeZone)
      : defaultCalendarDate;

    if (!calendar) {
      throw new RangeError('Time boundary requires a date when no default day is provided.');
    }

    const instant = makeDateFromCalendarAndTime(calendar, time, timeZone);
    return { instant, calendar };
  }

  throw new TypeError('Unsupported boundary input');
}

function resolveRange(range: TimeslotRangeInput, context: BoundaryContext): { start: Date; end: Date } {
  const startResolved = resolveBoundary(range.start, context);
  const endResolved = resolveBoundary(range.end, {
    ...context,
    defaultCalendarDate: startResolved.calendar ?? context.defaultCalendarDate
  });

  if (endResolved.instant.getTime() <= startResolved.instant.getTime()) {
    throw new RangeError('Timeslot range end must be after its start');
  }

  return { start: startResolved.instant, end: endResolved.instant };
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * MILLIS_PER_MINUTE);
}

function mergeIntervals(intervals: Array<{ start: Date; end: Date }>): Array<{ start: Date; end: Date }> {
  if (intervals.length === 0) {
    return [];
  }

  const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: Array<{ start: Date; end: Date }> = [sorted[0]];

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start.getTime() <= last.end.getTime()) {
      if (current.end.getTime() > last.end.getTime()) {
        last.end = current.end;
      }
    } else {
      merged.push({ start: current.start, end: current.end });
    }
  }

  return merged;
}

function subtractExclusions(
  source: { start: Date; end: Date },
  exclusions: Array<{ start: Date; end: Date }>
): Array<{ start: Date; end: Date }> {
  let segments: Array<{ start: Date; end: Date }> = [source];

  for (const exclusion of exclusions) {
    const nextSegments: Array<{ start: Date; end: Date }> = [];

    for (const segment of segments) {
      const segmentStart = segment.start.getTime();
      const segmentEnd = segment.end.getTime();
      const exclusionStart = Math.max(exclusion.start.getTime(), segmentStart);
      const exclusionEnd = Math.min(exclusion.end.getTime(), segmentEnd);

      if (exclusionEnd <= exclusionStart) {
        nextSegments.push(segment);
        continue;
      }

      if (exclusionStart > segmentStart) {
        nextSegments.push({ start: segment.start, end: new Date(exclusionStart) });
      }

      if (exclusionEnd < segmentEnd) {
        nextSegments.push({ start: new Date(exclusionEnd), end: segment.end });
      }
    }

    segments = nextSegments;
    if (segments.length === 0) {
      break;
    }
  }

  return segments;
}

function normalizeExclusions(
  exclusions: TimeslotRangeInput[] | undefined,
  context: BoundaryContext,
  window: { start: Date; end: Date }
): Array<{ start: Date; end: Date }> {
  if (!exclusions || exclusions.length === 0) {
    return [];
  }

  const normalized: Array<{ start: Date; end: Date }> = [];

  for (const exclusion of exclusions) {
    const resolved = resolveRange(exclusion, context);
    const start = resolved.start.getTime();
    const end = resolved.end.getTime();

    const windowStart = window.start.getTime();
    const windowEnd = window.end.getTime();

    if (end <= windowStart || start >= windowEnd) {
      continue;
    }

    const clampedStart = new Date(Math.max(start, windowStart));
    const clampedEnd = new Date(Math.min(end, windowEnd));
    if (clampedEnd.getTime() > clampedStart.getTime()) {
      normalized.push({ start: clampedStart, end: clampedEnd });
    }
  }

  return mergeIntervals(normalized);
}

function validateConfig(config: TimeslotGenerationConfig): NormalizedConfig {
  if (!Number.isFinite(config.slotDurationMinutes) || config.slotDurationMinutes <= 0) {
    throw new RangeError('slotDurationMinutes must be a positive number');
  }

  const durationMs = config.slotDurationMinutes * MILLIS_PER_MINUTE;
  const intervalMinutes = config.slotIntervalMinutes ?? config.slotDurationMinutes;

  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
    throw new RangeError('slotIntervalMinutes must be a positive number');
  }

  const intervalMs = intervalMinutes * MILLIS_PER_MINUTE;

  if (config.bufferBeforeMinutes && config.bufferBeforeMinutes < 0) {
    throw new RangeError('bufferBeforeMinutes cannot be negative');
  }

  if (config.bufferAfterMinutes && config.bufferAfterMinutes < 0) {
    throw new RangeError('bufferAfterMinutes cannot be negative');
  }

  if (config.minimumSlotDurationMinutes && config.minimumSlotDurationMinutes <= 0) {
    throw new RangeError('minimumSlotDurationMinutes must be positive');
  }

  if (config.maxSlots && config.maxSlots <= 0) {
    throw new RangeError('maxSlots must be greater than zero when provided');
  }

  const minDurationMs = (config.minimumSlotDurationMinutes ?? config.slotDurationMinutes) * MILLIS_PER_MINUTE;
  const includeEdge = config.includeEdge ?? true;
  const alignment: AlignmentStrategy = config.alignment ?? 'start';

  return {
    durationMs,
    intervalMs,
    minDurationMs,
    includeEdge,
    alignment,
    maxSlots: config.maxSlots,
    labelFormatter: config.labelFormatter
  };
}

function pushSlot(
  slots: Timeslot[],
  startMs: number,
  endMs: number,
  config: NormalizedConfig
): void {
  if (config.maxSlots !== undefined && slots.length >= config.maxSlots) {
    return;
  }

  if (endMs <= startMs) {
    return;
  }

  const start = new Date(startMs);
  const end = new Date(endMs);
  const durationMinutes = (endMs - startMs) / MILLIS_PER_MINUTE;
  const index = slots.length;

  const slot: Timeslot = { start, end };
  const metadata: TimeslotMetadata = {
    index,
    durationMinutes
  };

  if (config.labelFormatter) {
    const label = config.labelFormatter({ start, end }, index, durationMinutes);
    if (label !== undefined) {
      metadata.label = label;
    }
  }

  slot.metadata = metadata;
  slots.push(slot);
}

function generateSlotsForSegment(
  slots: Timeslot[],
  segment: { start: Date; end: Date },
  config: NormalizedConfig
): void {
  const segmentStartMs = segment.start.getTime();
  const segmentEndMs = segment.end.getTime();
  const spanMs = segmentEndMs - segmentStartMs;

  if (spanMs <= 0) {
    return;
  }

  if (config.maxSlots !== undefined && slots.length >= config.maxSlots) {
    return;
  }

  const { durationMs, intervalMs, minDurationMs, includeEdge, alignment } = config;

  if (alignment === 'center') {
    if (spanMs < durationMs) {
      if (includeEdge && spanMs >= minDurationMs) {
        pushSlot(slots, segmentStartMs, segmentEndMs, config);
      }
      return;
    }

    const slotCount = Math.floor((spanMs - durationMs) / intervalMs) + 1;
    if (slotCount <= 0) {
      if (includeEdge && spanMs >= minDurationMs) {
        pushSlot(slots, segmentStartMs, segmentEndMs, config);
      }
      return;
    }

    const usedSpan = durationMs + (slotCount - 1) * intervalMs;
    const leftover = spanMs - usedSpan;
    const offset = Math.round(leftover / 2);

    for (let i = 0; i < slotCount; i += 1) {
      if (config.maxSlots !== undefined && slots.length >= config.maxSlots) {
        break;
      }
      const start = segmentStartMs + offset + i * intervalMs;
      const end = start + durationMs;
      pushSlot(slots, start, end, config);
    }
    return;
  }

  if (alignment === 'start') {
    for (
      let slotStart = segmentStartMs;
      slotStart < segmentEndMs && (config.maxSlots === undefined || slots.length < config.maxSlots);
      slotStart += intervalMs
    ) {
      let slotEnd = slotStart + durationMs;
      if (slotEnd <= segmentEndMs) {
        pushSlot(slots, slotStart, slotEnd, config);
      } else if (includeEdge) {
        const remaining = segmentEndMs - slotStart;
        if (remaining >= minDurationMs) {
          pushSlot(slots, slotStart, segmentEndMs, config);
        }
      }
    }
    return;
  }

  // alignment === 'end'
  if (spanMs < durationMs) {
    if (includeEdge && spanMs >= minDurationMs) {
      pushSlot(slots, segmentStartMs, segmentEndMs, config);
    }
    return;
  }

  const countFull = Math.floor((spanMs - durationMs) / intervalMs) + 1;
  const firstStart = segmentEndMs - durationMs - (countFull - 1) * intervalMs;
  const leftover = firstStart - segmentStartMs;

  if (includeEdge && leftover >= minDurationMs) {
    pushSlot(slots, segmentStartMs, segmentStartMs + leftover, config);
  }

  for (let i = 0; i < countFull; i += 1) {
    if (config.maxSlots !== undefined && slots.length >= config.maxSlots) {
      break;
    }
    const slotStart = firstStart + i * intervalMs;
    const slotEnd = slotStart + durationMs;
    pushSlot(slots, slotStart, slotEnd, config);
  }
}

export function generateTimeslots(config: TimeslotGenerationConfig): Timeslot[] {
  const normalized = validateConfig(config);

  const defaultCalendarDate = config.day ? calendarFromDateValue(config.day, config.timezone) : undefined;
  const rangeContext: BoundaryContext = {
    timeZone: config.timezone,
    defaultCalendarDate
  };

  const range = resolveRange(config.range, rangeContext);

  let windowStart = range.start;
  let windowEnd = range.end;

  if (config.bufferBeforeMinutes) {
    windowStart = addMinutes(windowStart, config.bufferBeforeMinutes);
  }
  if (config.bufferAfterMinutes) {
    windowEnd = addMinutes(windowEnd, -config.bufferAfterMinutes);
  }

  if (windowEnd.getTime() <= windowStart.getTime()) {
    throw new RangeError('Buffers eliminate the available window; adjust buffer values.');
  }

  const exclusions = normalizeExclusions(config.excludedWindows, rangeContext, { start: windowStart, end: windowEnd });
  const baseSegments = subtractExclusions({ start: windowStart, end: windowEnd }, exclusions);

  const slots: Timeslot[] = [];
  for (const segment of baseSegments) {
    if (normalized.maxSlots !== undefined && slots.length >= normalized.maxSlots) {
      break;
    }
    generateSlotsForSegment(slots, segment, normalized);
  }

  return slots;
}

/**
 * Create a validated timeslot ensuring the start is before the end.
 */
export function createTimeslot(start: Date, end: Date): Timeslot {
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
    throw new TypeError('Invalid date provided');
  }

  if (end.getTime() <= start.getTime()) {
    throw new RangeError('Timeslot end must be after its start');
  }

  return { start: new Date(start), end: new Date(end) };
}

/**
 * Determine if two timeslots overlap.
 */
export function overlaps(a: Timeslot, b: Timeslot): boolean {
  return a.start < b.end && b.start < a.end;
}
