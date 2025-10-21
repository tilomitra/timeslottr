import { describe, expect, it } from 'vitest';
import { mergeIntervals, subtractExclusions, normalizeExclusions } from '../src/internal/exclusions.js';

describe('mergeIntervals', () => {
  it('returns empty array for empty input', () => {
    expect(mergeIntervals([])).toEqual([]);
  });

  it('returns single interval unchanged', () => {
    const intervals = [
      { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T10:00:00Z') }
    ];
    const result = mergeIntervals(intervals);
    expect(result).toHaveLength(1);
    expect(result[0]!.start.toISOString()).toBe('2024-01-01T09:00:00.000Z');
    expect(result[0]!.end.toISOString()).toBe('2024-01-01T10:00:00.000Z');
  });

  it('merges overlapping intervals', () => {
    const intervals = [
      { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
      { start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T12:00:00Z') }
    ];
    const result = mergeIntervals(intervals);
    expect(result).toHaveLength(1);
    expect(result[0]!.start.toISOString()).toBe('2024-01-01T09:00:00.000Z');
    expect(result[0]!.end.toISOString()).toBe('2024-01-01T12:00:00.000Z');
  });

  it('merges adjacent intervals', () => {
    const intervals = [
      { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T10:00:00Z') },
      { start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') }
    ];
    const result = mergeIntervals(intervals);
    expect(result).toHaveLength(1);
    expect(result[0]!.start.toISOString()).toBe('2024-01-01T09:00:00.000Z');
    expect(result[0]!.end.toISOString()).toBe('2024-01-01T11:00:00.000Z');
  });

  it('keeps separate non-overlapping intervals', () => {
    const intervals = [
      { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T10:00:00Z') },
      { start: new Date('2024-01-01T11:00:00Z'), end: new Date('2024-01-01T12:00:00Z') }
    ];
    const result = mergeIntervals(intervals);
    expect(result).toHaveLength(2);
    expect(result[0]!.start.toISOString()).toBe('2024-01-01T09:00:00.000Z');
    expect(result[0]!.end.toISOString()).toBe('2024-01-01T10:00:00.000Z');
    expect(result[1]!.start.toISOString()).toBe('2024-01-01T11:00:00.000Z');
    expect(result[1]!.end.toISOString()).toBe('2024-01-01T12:00:00.000Z');
  });

  it('merges multiple overlapping intervals', () => {
    const intervals = [
      { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
      { start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T12:00:00Z') },
      { start: new Date('2024-01-01T11:30:00Z'), end: new Date('2024-01-01T13:00:00Z') }
    ];
    const result = mergeIntervals(intervals);
    expect(result).toHaveLength(1);
    expect(result[0]!.start.toISOString()).toBe('2024-01-01T09:00:00.000Z');
    expect(result[0]!.end.toISOString()).toBe('2024-01-01T13:00:00.000Z');
  });

  it('handles unsorted intervals', () => {
    const intervals = [
      { start: new Date('2024-01-01T11:00:00Z'), end: new Date('2024-01-01T12:00:00Z') },
      { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T10:00:00Z') },
      { start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') }
    ];
    const result = mergeIntervals(intervals);
    expect(result).toHaveLength(1);
    expect(result[0]!.start.toISOString()).toBe('2024-01-01T09:00:00.000Z');
    expect(result[0]!.end.toISOString()).toBe('2024-01-01T12:00:00.000Z');
  });

  it('handles intervals where one contains another', () => {
    const intervals = [
      { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T12:00:00Z') },
      { start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') }
    ];
    const result = mergeIntervals(intervals);
    expect(result).toHaveLength(1);
    expect(result[0]!.start.toISOString()).toBe('2024-01-01T09:00:00.000Z');
    expect(result[0]!.end.toISOString()).toBe('2024-01-01T12:00:00.000Z');
  });
});

describe('subtractExclusions', () => {
  it('returns source interval when no exclusions', () => {
    const source = { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T17:00:00Z') };
    const result = subtractExclusions(source, []);
    expect(result).toHaveLength(1);
    expect(result[0]!.start.toISOString()).toBe('2024-01-01T09:00:00.000Z');
    expect(result[0]!.end.toISOString()).toBe('2024-01-01T17:00:00.000Z');
  });

  it('removes exclusion from middle of interval', () => {
    const source = { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T17:00:00Z') };
    const exclusions = [
      { start: new Date('2024-01-01T12:00:00Z'), end: new Date('2024-01-01T13:00:00Z') }
    ];
    const result = subtractExclusions(source, exclusions);
    expect(result).toHaveLength(2);
    expect(result[0]!.start.toISOString()).toBe('2024-01-01T09:00:00.000Z');
    expect(result[0]!.end.toISOString()).toBe('2024-01-01T12:00:00.000Z');
    expect(result[1]!.start.toISOString()).toBe('2024-01-01T13:00:00.000Z');
    expect(result[1]!.end.toISOString()).toBe('2024-01-01T17:00:00.000Z');
  });

  it('removes exclusion from start of interval', () => {
    const source = { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T17:00:00Z') };
    const exclusions = [
      { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T10:00:00Z') }
    ];
    const result = subtractExclusions(source, exclusions);
    expect(result).toHaveLength(1);
    expect(result[0]!.start.toISOString()).toBe('2024-01-01T10:00:00.000Z');
    expect(result[0]!.end.toISOString()).toBe('2024-01-01T17:00:00.000Z');
  });

  it('removes exclusion from end of interval', () => {
    const source = { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T17:00:00Z') };
    const exclusions = [
      { start: new Date('2024-01-01T16:00:00Z'), end: new Date('2024-01-01T17:00:00Z') }
    ];
    const result = subtractExclusions(source, exclusions);
    expect(result).toHaveLength(1);
    expect(result[0]!.start.toISOString()).toBe('2024-01-01T09:00:00.000Z');
    expect(result[0]!.end.toISOString()).toBe('2024-01-01T16:00:00.000Z');
  });

  it('returns empty array when exclusion covers entire interval', () => {
    const source = { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T17:00:00Z') };
    const exclusions = [
      { start: new Date('2024-01-01T08:00:00Z'), end: new Date('2024-01-01T18:00:00Z') }
    ];
    const result = subtractExclusions(source, exclusions);
    expect(result).toHaveLength(0);
  });

  it('ignores exclusions that do not overlap', () => {
    const source = { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T17:00:00Z') };
    const exclusions = [
      { start: new Date('2024-01-01T07:00:00Z'), end: new Date('2024-01-01T08:00:00Z') },
      { start: new Date('2024-01-01T18:00:00Z'), end: new Date('2024-01-01T19:00:00Z') }
    ];
    const result = subtractExclusions(source, exclusions);
    expect(result).toHaveLength(1);
    expect(result[0]!.start.toISOString()).toBe('2024-01-01T09:00:00.000Z');
    expect(result[0]!.end.toISOString()).toBe('2024-01-01T17:00:00.000Z');
  });

  it('handles multiple exclusions', () => {
    const source = { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T17:00:00Z') };
    const exclusions = [
      { start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
      { start: new Date('2024-01-01T12:00:00Z'), end: new Date('2024-01-01T13:00:00Z') },
      { start: new Date('2024-01-01T15:00:00Z'), end: new Date('2024-01-01T16:00:00Z') }
    ];
    const result = subtractExclusions(source, exclusions);
    expect(result).toHaveLength(4);
    expect(result[0]!.start.toISOString()).toBe('2024-01-01T09:00:00.000Z');
    expect(result[0]!.end.toISOString()).toBe('2024-01-01T10:00:00.000Z');
    expect(result[1]!.start.toISOString()).toBe('2024-01-01T11:00:00.000Z');
    expect(result[1]!.end.toISOString()).toBe('2024-01-01T12:00:00.000Z');
    expect(result[2]!.start.toISOString()).toBe('2024-01-01T13:00:00.000Z');
    expect(result[2]!.end.toISOString()).toBe('2024-01-01T15:00:00.000Z');
    expect(result[3]!.start.toISOString()).toBe('2024-01-01T16:00:00.000Z');
    expect(result[3]!.end.toISOString()).toBe('2024-01-01T17:00:00.000Z');
  });

  it('handles partial overlaps at boundaries', () => {
    const source = { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T17:00:00Z') };
    const exclusions = [
      { start: new Date('2024-01-01T08:00:00Z'), end: new Date('2024-01-01T10:00:00Z') },
      { start: new Date('2024-01-01T16:00:00Z'), end: new Date('2024-01-01T18:00:00Z') }
    ];
    const result = subtractExclusions(source, exclusions);
    expect(result).toHaveLength(1);
    expect(result[0]!.start.toISOString()).toBe('2024-01-01T10:00:00.000Z');
    expect(result[0]!.end.toISOString()).toBe('2024-01-01T16:00:00.000Z');
  });
});

describe('normalizeExclusions', () => {
  it('returns empty array when no exclusions provided', () => {
    const window = { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T17:00:00Z') };
    const result = normalizeExclusions(undefined, { timeZone: 'UTC' }, window);
    expect(result).toEqual([]);

    const result2 = normalizeExclusions([], { timeZone: 'UTC' }, window);
    expect(result2).toEqual([]);
  });

  it('resolves and clamps exclusions to window', () => {
    const window = { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T17:00:00Z') };
    const exclusions = [
      { start: '08:00', end: '10:00' },
      { start: '16:00', end: '18:00' }
    ];
    const context = {
      timeZone: 'UTC',
      defaultCalendarDate: { year: 2024, month: 1, day: 1 }
    };
    const result = normalizeExclusions(exclusions, context, window);
    expect(result).toHaveLength(2);
    expect(result[0]!.start.toISOString()).toBe('2024-01-01T09:00:00.000Z');
    expect(result[0]!.end.toISOString()).toBe('2024-01-01T10:00:00.000Z');
    expect(result[1]!.start.toISOString()).toBe('2024-01-01T16:00:00.000Z');
    expect(result[1]!.end.toISOString()).toBe('2024-01-01T17:00:00.000Z');
  });

  it('filters out exclusions completely outside window', () => {
    const window = { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T17:00:00Z') };
    const exclusions = [
      { start: '06:00', end: '07:00' },
      { start: '12:00', end: '13:00' },
      { start: '20:00', end: '21:00' }
    ];
    const context = {
      timeZone: 'UTC',
      defaultCalendarDate: { year: 2024, month: 1, day: 1 }
    };
    const result = normalizeExclusions(exclusions, context, window);
    expect(result).toHaveLength(1);
    expect(result[0]!.start.toISOString()).toBe('2024-01-01T12:00:00.000Z');
    expect(result[0]!.end.toISOString()).toBe('2024-01-01T13:00:00.000Z');
  });

  it('merges overlapping exclusions', () => {
    const window = { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T17:00:00Z') };
    const exclusions = [
      { start: '12:00', end: '13:00' },
      { start: '12:30', end: '14:00' }
    ];
    const context = {
      timeZone: 'UTC',
      defaultCalendarDate: { year: 2024, month: 1, day: 1 }
    };
    const result = normalizeExclusions(exclusions, context, window);
    expect(result).toHaveLength(1);
    expect(result[0]!.start.toISOString()).toBe('2024-01-01T12:00:00.000Z');
    expect(result[0]!.end.toISOString()).toBe('2024-01-01T14:00:00.000Z');
  });

  it('handles exclusions that span the entire window', () => {
    const window = { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T17:00:00Z') };
    const exclusions = [
      { start: '08:00', end: '18:00' }
    ];
    const context = {
      timeZone: 'UTC',
      defaultCalendarDate: { year: 2024, month: 1, day: 1 }
    };
    const result = normalizeExclusions(exclusions, context, window);
    expect(result).toHaveLength(1);
    expect(result[0]!.start.toISOString()).toBe('2024-01-01T09:00:00.000Z');
    expect(result[0]!.end.toISOString()).toBe('2024-01-01T17:00:00.000Z');
  });

  it('filters out zero-duration exclusions after clamping', () => {
    const window = { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T17:00:00Z') };
    const exclusions = [
      { start: '06:00', end: '09:00' }, // ends at window start
      { start: '17:00', end: '20:00' }  // starts at window end
    ];
    const context = {
      timeZone: 'UTC',
      defaultCalendarDate: { year: 2024, month: 1, day: 1 }
    };
    const result = normalizeExclusions(exclusions, context, window);
    expect(result).toHaveLength(0);
  });
});
