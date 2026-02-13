import { describe, it, expect } from 'vitest';
import { contains, mergeSlots, findGaps, createTimeslot } from '../src/timeslot.js';

const d = (h: number, m = 0) => new Date(2026, 0, 1, h, m);

describe('contains', () => {
  const slot = createTimeslot(d(9), d(10));

  it('returns true for date inside', () => {
    expect(contains(slot, d(9, 30))).toBe(true);
  });

  it('returns true at start boundary (inclusive)', () => {
    expect(contains(slot, d(9))).toBe(true);
  });

  it('returns false at end boundary (exclusive)', () => {
    expect(contains(slot, d(10))).toBe(false);
  });

  it('returns false for date outside', () => {
    expect(contains(slot, d(8))).toBe(false);
    expect(contains(slot, d(11))).toBe(false);
  });
});

describe('mergeSlots', () => {
  it('keeps non-overlapping slots separate', () => {
    const result = mergeSlots([createTimeslot(d(9), d(10)), createTimeslot(d(11), d(12))]);
    expect(result).toHaveLength(2);
  });

  it('merges overlapping slots', () => {
    const result = mergeSlots([createTimeslot(d(9), d(11)), createTimeslot(d(10), d(12))]);
    expect(result).toHaveLength(1);
    expect(result[0].start).toEqual(d(9));
    expect(result[0].end).toEqual(d(12));
  });

  it('merges adjacent slots', () => {
    const result = mergeSlots([createTimeslot(d(9), d(10)), createTimeslot(d(10), d(11))]);
    expect(result).toHaveLength(1);
    expect(result[0].start).toEqual(d(9));
    expect(result[0].end).toEqual(d(11));
  });

  it('returns empty for empty input', () => {
    expect(mergeSlots([])).toEqual([]);
  });

  it('sorts unsorted input', () => {
    const result = mergeSlots([createTimeslot(d(11), d(12)), createTimeslot(d(9), d(10))]);
    expect(result[0].start).toEqual(d(9));
    expect(result[1].start).toEqual(d(11));
  });

  it('does not include metadata on merged slots', () => {
    const slot = { start: d(9), end: d(11), metadata: { index: 0, durationMinutes: 120 } };
    const result = mergeSlots([slot]);
    expect(result[0].metadata).toBeUndefined();
  });
});

describe('findGaps', () => {
  const range = { start: d(8), end: d(17) };

  it('returns full range when no booked slots', () => {
    const gaps = findGaps([], range);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].start).toEqual(d(8));
    expect(gaps[0].end).toEqual(d(17));
  });

  it('returns empty when fully booked', () => {
    expect(findGaps([createTimeslot(d(8), d(17))], range)).toHaveLength(0);
  });

  it('returns correct gaps for partial bookings', () => {
    const gaps = findGaps([createTimeslot(d(10), d(12))], range);
    expect(gaps).toHaveLength(2);
    expect(gaps[0]).toEqual({ start: d(8), end: d(10) });
    expect(gaps[1]).toEqual({ start: d(12), end: d(17) });
  });

  it('ignores slots outside range', () => {
    const gaps = findGaps([createTimeslot(d(5), d(7)), createTimeslot(d(18), d(20))], range);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].start).toEqual(d(8));
    expect(gaps[0].end).toEqual(d(17));
  });
});
