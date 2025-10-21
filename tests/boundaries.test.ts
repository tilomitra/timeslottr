import { describe, expect, it } from 'vitest';
import { resolveBoundary, resolveRange } from '../src/internal/boundaries.js';

describe('resolveBoundary', () => {
  it('resolves Date objects', () => {
    const date = new Date('2024-01-15T10:00:00Z');
    const result = resolveBoundary(date, { timeZone: 'UTC' });
    expect(result.instant.toISOString()).toBe('2024-01-15T10:00:00.000Z');
    expect(result.calendar).toEqual({ year: 2024, month: 1, day: 15 });
  });

  it('resolves time-only strings with default calendar date', () => {
    const context = {
      timeZone: 'UTC',
      defaultCalendarDate: { year: 2024, month: 1, day: 15 }
    };
    const result = resolveBoundary('09:00', context);
    expect(result.instant.toISOString()).toBe('2024-01-15T09:00:00.000Z');
    expect(result.calendar).toEqual({ year: 2024, month: 1, day: 15 });
  });

  it('throws when time-only string has no default calendar date', () => {
    expect(() => resolveBoundary('09:00', { timeZone: 'UTC' })).toThrow(RangeError);
    expect(() => resolveBoundary('09:00', { timeZone: 'UTC' })).toThrow(/requires a default day/);
  });

  it('resolves date-only strings', () => {
    const result = resolveBoundary('2024-01-15', { timeZone: 'UTC' });
    // The calendar should match the input date
    expect(result.calendar).toEqual({ year: 2024, month: 1, day: 15 });
    // The instant should be at midnight in UTC
    const utcHours = result.instant.getUTCHours();
    const utcMinutes = result.instant.getUTCMinutes();
    expect(utcHours).toBe(0);
    expect(utcMinutes).toBe(0);
  });

  it('resolves ISO datetime strings', () => {
    const result = resolveBoundary('2024-01-15T10:30:00Z', { timeZone: 'UTC' });
    expect(result.instant.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    expect(result.calendar).toEqual({ year: 2024, month: 1, day: 15 });
  });

  it('resolves boundary objects with time and date', () => {
    const boundary = { time: '09:00', date: '2024-01-15' };
    const result = resolveBoundary(boundary, { timeZone: 'UTC' });
    expect(result.instant.toISOString()).toBe('2024-01-15T09:00:00.000Z');
  });

  it('resolves boundary objects with time and default calendar date', () => {
    const boundary = { time: '09:00' };
    const context = {
      timeZone: 'UTC',
      defaultCalendarDate: { year: 2024, month: 1, day: 15 }
    };
    const result = resolveBoundary(boundary, context);
    expect(result.instant.toISOString()).toBe('2024-01-15T09:00:00.000Z');
  });

  it('throws when boundary object has time but no date or default', () => {
    const boundary = { time: '09:00' };
    expect(() => resolveBoundary(boundary, { timeZone: 'UTC' })).toThrow(RangeError);
  });

  it('handles timezone offsets correctly', () => {
    const context = {
      timeZone: 'America/New_York',
      defaultCalendarDate: { year: 2024, month: 1, day: 15 }
    };
    const result = resolveBoundary('09:00', context);
    expect(result.instant.toISOString()).toBe('2024-01-15T14:00:00.000Z'); // EST is UTC-5
  });

  it('throws for invalid boundary strings', () => {
    expect(() => resolveBoundary('invalid', { timeZone: 'UTC' })).toThrow(TypeError);
  });
});

describe('resolveRange', () => {
  it('resolves a simple time range with default calendar', () => {
    const range = { start: '09:00', end: '17:00' };
    const context = {
      timeZone: 'UTC',
      defaultCalendarDate: { year: 2024, month: 1, day: 15 }
    };
    const result = resolveRange(range, context);
    expect(result.start.toISOString()).toBe('2024-01-15T09:00:00.000Z');
    expect(result.end.toISOString()).toBe('2024-01-15T17:00:00.000Z');
  });

  it('resolves a range with Date objects', () => {
    const start = new Date('2024-01-15T09:00:00Z');
    const end = new Date('2024-01-15T17:00:00Z');
    const range = { start, end };
    const result = resolveRange(range, { timeZone: 'UTC' });
    expect(result.start.toISOString()).toBe('2024-01-15T09:00:00.000Z');
    expect(result.end.toISOString()).toBe('2024-01-15T17:00:00.000Z');
  });

  it('resolves a range with ISO datetime strings', () => {
    const range = {
      start: '2024-01-15T09:00:00Z',
      end: '2024-01-15T17:00:00Z'
    };
    const result = resolveRange(range, { timeZone: 'UTC' });
    expect(result.start.toISOString()).toBe('2024-01-15T09:00:00.000Z');
    expect(result.end.toISOString()).toBe('2024-01-15T17:00:00.000Z');
  });

  it('uses start calendar as default for end boundary', () => {
    const range = {
      start: '2024-01-15T09:00:00Z',
      end: '17:00'
    };
    const result = resolveRange(range, { timeZone: 'UTC' });
    expect(result.start.toISOString()).toBe('2024-01-15T09:00:00.000Z');
    expect(result.end.toISOString()).toBe('2024-01-15T17:00:00.000Z');
  });

  it('throws when end is not after start', () => {
    const range = { start: '17:00', end: '09:00' };
    const context = {
      timeZone: 'UTC',
      defaultCalendarDate: { year: 2024, month: 1, day: 15 }
    };
    expect(() => resolveRange(range, context)).toThrow(RangeError);
    expect(() => resolveRange(range, context)).toThrow(/end must be after its start/);
  });

  it('throws when end equals start', () => {
    const range = { start: '09:00', end: '09:00' };
    const context = {
      timeZone: 'UTC',
      defaultCalendarDate: { year: 2024, month: 1, day: 15 }
    };
    expect(() => resolveRange(range, context)).toThrow(RangeError);
  });

  it('handles cross-day ranges', () => {
    const range = {
      start: '2024-01-15T22:00:00Z',
      end: '2024-01-16T02:00:00Z'
    };
    const result = resolveRange(range, { timeZone: 'UTC' });
    expect(result.start.toISOString()).toBe('2024-01-15T22:00:00.000Z');
    expect(result.end.toISOString()).toBe('2024-01-16T02:00:00.000Z');
  });

  it('respects timezone for time ranges', () => {
    const range = { start: '09:00', end: '17:00' };
    const context = {
      timeZone: 'America/New_York',
      defaultCalendarDate: { year: 2024, month: 1, day: 15 }
    };
    const result = resolveRange(range, context);
    // 9 AM EST is 2 PM UTC
    expect(result.start.toISOString()).toBe('2024-01-15T14:00:00.000Z');
    expect(result.end.toISOString()).toBe('2024-01-15T22:00:00.000Z');
  });
});
