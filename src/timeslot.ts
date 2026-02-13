import type { Timeslot, TimeslotMetadata } from './types.js';

export interface TimeslotJSON {
  start: string;
  end: string;
  metadata?: TimeslotMetadata;
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

/**
 * Convert a Timeslot to a JSON-safe object with ISO string dates.
 */
export function timeslotToJSON(slot: Timeslot): TimeslotJSON {
  const json: TimeslotJSON = {
    start: slot.start.toISOString(),
    end: slot.end.toISOString(),
  };
  if (slot.metadata !== undefined) {
    json.metadata = slot.metadata;
  }
  return json;
}

/**
 * Parse a JSON object back into a Timeslot with proper Date instances.
 */
export function timeslotFromJSON(json: TimeslotJSON): Timeslot {
  const start = new Date(json.start);
  const end = new Date(json.end);

  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
    throw new TypeError('Invalid date string');
  }

  if (end.getTime() <= start.getTime()) {
    throw new RangeError('Timeslot end must be after its start');
  }

  const slot: Timeslot = { start, end };
  if (json.metadata !== undefined) {
    slot.metadata = json.metadata;
  }
  return slot;
}

/**
 * Returns true if the date falls within the slot (inclusive start, exclusive end).
 */
export function contains(slot: Timeslot, date: Date): boolean {
  return date >= slot.start && date < slot.end;
}

/**
 * Sorts slots by start time, merges any overlapping or adjacent slots.
 * Merged slots do not carry metadata.
 */
export function mergeSlots(slots: Timeslot[]): Timeslot[] {
  if (slots.length === 0) return [];

  const sorted = [...slots].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: Timeslot[] = [{ start: new Date(sorted[0].start), end: new Date(sorted[0].end) }];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const cur = sorted[i];
    if (cur.start <= last.end) {
      if (cur.end > last.end) last.end = new Date(cur.end);
    } else {
      merged.push({ start: new Date(cur.start), end: new Date(cur.end) });
    }
  }

  return merged;
}

/**
 * Given booked slots and a range, returns the free/unbooked time slots within that range.
 */
export function findGaps(slots: Timeslot[], range: { start: Date; end: Date }): Timeslot[] {
  const merged = mergeSlots(
    slots.filter(s => s.start < range.end && s.end > range.start)
  );

  const gaps: Timeslot[] = [];
  let cursor = range.start;

  for (const slot of merged) {
    const slotStart = slot.start < range.start ? range.start : slot.start;
    if (cursor < slotStart) {
      gaps.push({ start: new Date(cursor), end: new Date(slotStart) });
    }
    const slotEnd = slot.end > range.end ? range.end : slot.end;
    if (slotEnd > cursor) cursor = slotEnd;
  }

  if (cursor < range.end) {
    gaps.push({ start: new Date(cursor), end: new Date(range.end) });
  }

  return gaps;
}
