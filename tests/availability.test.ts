import { describe, it, expect } from 'vitest';
import {
  subtract,
  intersect,
  generateAvailableTimeslots,
  type Interval
} from '../src/index.js';

// Helper: build an interval from two ISO-ish UTC times on 2024-01-01.
const iv = (start: string, end: string): Interval => ({
  start: new Date(`2024-01-01T${start}:00Z`),
  end: new Date(`2024-01-01T${end}:00Z`)
});

const iso = (intervals: Interval[]): [string, string][] =>
  intervals.map((i) => [
    i.start.toISOString().slice(11, 16),
    i.end.toISOString().slice(11, 16)
  ]);

describe('subtract', () => {
  const source = [iv('09:00', '17:00')];

  it('returns a copy of source when busy is empty', () => {
    const result = subtract(source, []);
    expect(iso(result)).toEqual([['09:00', '17:00']]);
    // copy, not the same Date references
    expect(result[0]!.start).not.toBe(source[0]!.start);
  });

  it('returns empty when source is empty', () => {
    expect(subtract([], [iv('10:00', '11:00')])).toEqual([]);
  });

  it('leaves source untouched when busy does not overlap', () => {
    const result = subtract(source, [iv('07:00', '08:00'), iv('18:00', '19:00')]);
    expect(iso(result)).toEqual([['09:00', '17:00']]);
  });

  it('trims busy overlapping the left edge', () => {
    const result = subtract(source, [iv('08:00', '10:00')]);
    expect(iso(result)).toEqual([['10:00', '17:00']]);
  });

  it('trims busy overlapping the right edge', () => {
    const result = subtract(source, [iv('16:00', '18:00')]);
    expect(iso(result)).toEqual([['09:00', '16:00']]);
  });

  it('splits source in two when busy lands in the middle', () => {
    const result = subtract(source, [iv('12:00', '13:00')]);
    expect(iso(result)).toEqual([
      ['09:00', '12:00'],
      ['13:00', '17:00']
    ]);
  });

  it('returns empty when busy fully covers source', () => {
    expect(subtract(source, [iv('08:00', '18:00')])).toEqual([]);
  });

  it('treats touching boundaries as non-overlapping (half-open)', () => {
    // busy ends exactly at source start, and another starts exactly at source end
    const result = subtract(source, [iv('08:00', '09:00'), iv('17:00', '18:00')]);
    expect(iso(result)).toEqual([['09:00', '17:00']]);
  });

  it('handles unsorted, overlapping busy intervals', () => {
    const busy = [
      iv('15:00', '16:00'),
      iv('10:00', '11:00'),
      iv('10:30', '12:00') // overlaps the previous one
    ];
    const result = subtract(source, busy);
    expect(iso(result)).toEqual([
      ['09:00', '10:00'],
      ['12:00', '15:00'],
      ['16:00', '17:00']
    ]);
  });

  it('subtracts across multiple source intervals with a single busy span', () => {
    const multi = [iv('09:00', '11:00'), iv('13:00', '15:00')];
    // one busy window straddles the gap and clips both sources
    const result = subtract(multi, [iv('10:00', '14:00')]);
    expect(iso(result)).toEqual([
      ['09:00', '10:00'],
      ['14:00', '15:00']
    ]);
  });

  it('skips zero-length / invalid source intervals', () => {
    const result = subtract([iv('10:00', '10:00'), iv('11:00', '12:00')], []);
    expect(iso(result)).toEqual([['11:00', '12:00']]);
  });

  it('skips zero-length source intervals when busy is present', () => {
    const result = subtract([iv('10:00', '10:00'), iv('11:00', '13:00')], [iv('11:30', '12:00')]);
    expect(iso(result)).toEqual([
      ['11:00', '11:30'],
      ['12:00', '13:00']
    ]);
  });

  it('sorts unsorted source intervals', () => {
    const multi = [iv('13:00', '15:00'), iv('09:00', '11:00')];
    const result = subtract(multi, []);
    expect(iso(result)).toEqual([
      ['09:00', '11:00'],
      ['13:00', '15:00']
    ]);
  });
});

describe('intersect', () => {
  it('returns [] for zero sets', () => {
    expect(intersect([])).toEqual([]);
  });

  it('returns a merged copy for a single set', () => {
    const set = [iv('10:00', '11:00'), iv('10:30', '12:00'), iv('14:00', '15:00')];
    const result = intersect([set]);
    expect(iso(result)).toEqual([
      ['10:00', '12:00'],
      ['14:00', '15:00']
    ]);
    expect(result[0]!.start).not.toBe(set[0]!.start);
  });

  it('intersects two overlapping sets', () => {
    const a = [iv('09:00', '12:00')];
    const b = [iv('10:00', '14:00')];
    expect(iso(intersect([a, b]))).toEqual([['10:00', '12:00']]);
  });

  it('intersects three or more sets', () => {
    const a = [iv('09:00', '17:00')];
    const b = [iv('10:00', '15:00')];
    const c = [iv('11:00', '13:00'), iv('14:00', '16:00')];
    expect(iso(intersect([a, b, c]))).toEqual([
      ['11:00', '13:00'],
      ['14:00', '15:00']
    ]);
  });

  it('returns [] when one set is empty', () => {
    expect(intersect([[iv('09:00', '17:00')], []])).toEqual([]);
  });

  it('returns the same windows for identical sets', () => {
    const set = [iv('09:00', '11:00'), iv('13:00', '15:00')];
    expect(iso(intersect([set, set]))).toEqual([
      ['09:00', '11:00'],
      ['13:00', '15:00']
    ]);
  });

  it('returns [] for fully disjoint sets', () => {
    const a = [iv('09:00', '11:00')];
    const b = [iv('13:00', '15:00')];
    expect(intersect([a, b])).toEqual([]);
  });

  it('treats touching-but-not-overlapping as no overlap (half-open)', () => {
    const a = [iv('09:00', '12:00')];
    const b = [iv('12:00', '15:00')];
    expect(intersect([a, b])).toEqual([]);
  });

  it('returns [] when a later set eliminates all common availability', () => {
    // After a ∩ b is empty, the third set should short-circuit to [].
    const a = [iv('09:00', '11:00')];
    const b = [iv('13:00', '15:00')];
    const c = [iv('09:00', '15:00')];
    expect(intersect([a, b, c])).toEqual([]);
  });

  it('handles unsorted inputs', () => {
    const a = [iv('14:00', '16:00'), iv('09:00', '12:00')];
    const b = [iv('10:00', '15:00')];
    expect(iso(intersect([a, b]))).toEqual([
      ['10:00', '12:00'],
      ['14:00', '15:00']
    ]);
  });
});

describe('generateAvailableTimeslots', () => {
  const base = {
    day: '2024-01-01',
    timezone: 'UTC',
    range: { start: '09:00', end: '17:00' },
    slotDurationMinutes: 60
  };

  it('matches generateTimeslots when no busy is given', () => {
    const slots = generateAvailableTimeslots(base);
    expect(slots).toHaveLength(8); // 09–17, hourly
    expect(slots[0]!.start.toISOString()).toBe('2024-01-01T09:00:00.000Z');
  });

  it('removes a booking from the middle of the day', () => {
    const slots = generateAvailableTimeslots({
      ...base,
      busy: [{ start: '12:00', end: '13:00' }]
    });
    const starts = slots.map((s) => s.start.toISOString().slice(11, 16));
    expect(starts).toEqual(['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']);
  });

  it('returns [] for a fully-booked day', () => {
    const slots = generateAvailableTimeslots({
      ...base,
      busy: [{ start: '08:00', end: '18:00' }]
    });
    expect(slots).toEqual([]);
  });

  it('accepts busy times in Date and {date,time} formats', () => {
    const slots = generateAvailableTimeslots({
      ...base,
      busy: [
        { start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
        { start: { date: '2024-01-01', time: '15:00' }, end: { date: '2024-01-01', time: '16:00' } }
      ]
    });
    const starts = slots.map((s) => s.start.toISOString().slice(11, 16));
    expect(starts).toEqual(['09:00', '11:00', '12:00', '13:00', '14:00', '16:00']);
  });

  it('narrows slots to the intersection of all participants', () => {
    // Host free 09–17. Alice busy 09–11, Bob busy 15–17.
    // Team-free window is 11–15 → four hourly slots.
    const slots = generateAvailableTimeslots({
      ...base,
      participantsBusy: [
        [{ start: '09:00', end: '11:00' }],
        [{ start: '15:00', end: '17:00' }]
      ]
    });
    const starts = slots.map((s) => s.start.toISOString().slice(11, 16));
    expect(starts).toEqual(['11:00', '12:00', '13:00', '14:00']);
  });

  it('combines shared busy with per-participant busy', () => {
    const slots = generateAvailableTimeslots({
      ...base,
      busy: [{ start: '13:00', end: '14:00' }], // blocks everyone (lunch)
      participantsBusy: [
        [{ start: '09:00', end: '11:00' }], // Alice
        [{ start: '16:00', end: '17:00' }] // Bob
      ]
    });
    // base 09–17, minus shared 13–14 → [09–13, 14–17]
    // ∩ Alice-free [11–13,14–17] ∩ Bob-free [09–13,14–16] = [11–13, 14–16]
    const starts = slots.map((s) => s.start.toISOString().slice(11, 16));
    expect(starts).toEqual(['11:00', '12:00', '14:00', '15:00']);
  });

  it('returns [] when a participant has no overlapping availability', () => {
    const slots = generateAvailableTimeslots({
      ...base,
      participantsBusy: [
        [{ start: '09:00', end: '13:00' }],
        [{ start: '13:00', end: '17:00' }]
      ]
    });
    expect(slots).toEqual([]);
  });

  it('treats an empty participant busy set as fully available', () => {
    const slots = generateAvailableTimeslots({
      ...base,
      participantsBusy: [
        [], // free all day
        [{ start: '09:00', end: '15:00' }]
      ]
    });
    const starts = slots.map((s) => s.start.toISOString().slice(11, 16));
    expect(starts).toEqual(['15:00', '16:00']);
  });

  it('stays correct across a DST spring-forward day', () => {
    // 2024-03-10 in America/New_York: 02:00–03:00 does not exist.
    // 00:00–06:00 wall clock is 5 real hours → 10 thirty-minute slots.
    // Subtract a busy block 04:00–05:00 (wall) → removes 2 slots → 8 remain.
    const slots = generateAvailableTimeslots({
      day: '2024-03-10',
      timezone: 'America/New_York',
      range: { start: '00:00', end: '06:00' },
      slotDurationMinutes: 30,
      busy: [{ start: '04:00', end: '05:00' }]
    });
    expect(slots).toHaveLength(8);
    for (const slot of slots) {
      expect(slot.end.getTime() - slot.start.getTime()).toBe(30 * 60 * 1000);
    }
    // no slot should fall inside the booked 04:00–05:00 wall-clock window
    const booked = generateAvailableTimeslots({
      day: '2024-03-10',
      timezone: 'America/New_York',
      range: { start: '04:00', end: '05:00' },
      slotDurationMinutes: 30
    })[0]!;
    for (const slot of slots) {
      expect(slot.start >= booked.start && slot.start < booked.end).toBe(false);
    }
  });

  it('respects excludedWindows together with busy', () => {
    const slots = generateAvailableTimeslots({
      ...base,
      excludedWindows: [{ start: '12:00', end: '13:00' }], // standing lunch break
      busy: [{ start: '09:00', end: '10:00' }] // a booked meeting
    });
    const starts = slots.map((s) => s.start.toISOString().slice(11, 16));
    expect(starts).toEqual(['10:00', '11:00', '13:00', '14:00', '15:00', '16:00']);
  });
});
