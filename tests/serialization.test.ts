import { describe, it, expect } from 'vitest';
import { timeslotToJSON, timeslotFromJSON } from '../src/timeslot.js';
import type { Timeslot } from '../src/types.js';

describe('timeslotToJSON / timeslotFromJSON', () => {
  const start = new Date('2024-06-15T09:00:00.000Z');
  const end = new Date('2024-06-15T09:30:00.000Z');

  it('round-trip produces equivalent slot', () => {
    const slot: Timeslot = { start, end };
    const result = timeslotFromJSON(timeslotToJSON(slot));
    expect(result.start.getTime()).toBe(start.getTime());
    expect(result.end.getTime()).toBe(end.getTime());
  });

  it('toJSON outputs ISO strings', () => {
    const json = timeslotToJSON({ start, end });
    expect(json.start).toBe('2024-06-15T09:00:00.000Z');
    expect(json.end).toBe('2024-06-15T09:30:00.000Z');
  });

  it('fromJSON with metadata preserves it', () => {
    const metadata = { index: 0, durationMinutes: 30, label: 'Morning' };
    const json = { start: start.toISOString(), end: end.toISOString(), metadata };
    const slot = timeslotFromJSON(json);
    expect(slot.metadata).toEqual(metadata);
  });

  it('fromJSON throws TypeError on invalid date strings', () => {
    expect(() => timeslotFromJSON({ start: 'not-a-date', end: end.toISOString() }))
      .toThrow(TypeError);
  });

  it('fromJSON throws RangeError when end <= start', () => {
    expect(() => timeslotFromJSON({ start: end.toISOString(), end: start.toISOString() }))
      .toThrow(RangeError);
    expect(() => timeslotFromJSON({ start: start.toISOString(), end: start.toISOString() }))
      .toThrow(RangeError);
  });
});
