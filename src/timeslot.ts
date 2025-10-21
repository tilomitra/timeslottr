import { Timeslot } from './types';

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
