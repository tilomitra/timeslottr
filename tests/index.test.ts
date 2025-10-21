import { describe, expect, it } from 'vitest';
import { createTimeslot, generateTimeslots, overlaps } from '../src/index.ts';

describe('createTimeslot', () => {
  it('creates a timeslot copy of the provided dates', () => {
    const start = new Date('2024-01-01T08:00:00Z');
    const end = new Date('2024-01-01T09:00:00Z');

    const slot = createTimeslot(start, end);

    expect(slot.start).not.toBe(start);
    expect(slot.end).not.toBe(end);
    expect(slot.start.toISOString()).toBe(start.toISOString());
    expect(slot.end.toISOString()).toBe(end.toISOString());
  });

  it('throws when end is not after start', () => {
    const start = new Date('2024-01-01T10:00:00Z');

    expect(() => createTimeslot(start, start)).toThrow(RangeError);
  });
});

describe('overlaps', () => {
  it('detects overlapping timeslots', () => {
    const a = createTimeslot(new Date('2024-01-01T08:00:00Z'), new Date('2024-01-01T10:00:00Z'));
    const b = createTimeslot(new Date('2024-01-01T09:00:00Z'), new Date('2024-01-01T11:00:00Z'));

    expect(overlaps(a, b)).toBe(true);
  });

  it('detects non overlapping timeslots', () => {
    const a = createTimeslot(new Date('2024-01-01T08:00:00Z'), new Date('2024-01-01T09:00:00Z'));
    const b = createTimeslot(new Date('2024-01-01T09:00:00Z'), new Date('2024-01-01T10:00:00Z'));

    expect(overlaps(a, b)).toBe(false);
  });
});

describe('generateTimeslots', () => {
  it('generates slots for a simple day range', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '18:00' },
      slotDurationMinutes: 30
    });

    expect(slots.length).toBe(18);
    expect(slots[0]!.start.toISOString()).toBe('2024-01-01T09:00:00.000Z');
    const last = slots[slots.length - 1]!;
    expect(last.end.toISOString()).toBe('2024-01-01T18:00:00.000Z');
    expect(slots.every((slot) => slot.metadata?.durationMinutes === 30)).toBe(true);
  });

  it('applies buffers before and after', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '18:00' },
      slotDurationMinutes: 60,
      bufferBeforeMinutes: 30,
      bufferAfterMinutes: 30
    });

    expect(slots[0]!.start.toISOString()).toBe('2024-01-01T09:30:00.000Z');
    expect(slots[slots.length - 1]!.end.toISOString()).toBe('2024-01-01T17:30:00.000Z');
    expect(slots.length).toBe(8);
  });

  it('skips excluded windows within the range', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '17:00' },
      slotDurationMinutes: 60,
      excludedWindows: [{ start: '12:00', end: '13:00' }]
    });

    expect(slots.length).toBe(7);
    expect(slots.some((slot) => slot.start.toISOString() === '2024-01-01T12:00:00.000Z')).toBe(false);
  });

  it('supports custom slot intervals (overlapping slots)', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '10:00' },
      slotDurationMinutes: 30,
      slotIntervalMinutes: 15
    });

    const starts = slots.map((slot) => slot.start.toISOString());
    expect(starts).toEqual([
      '2024-01-01T09:00:00.000Z',
      '2024-01-01T09:15:00.000Z',
      '2024-01-01T09:30:00.000Z'
    ]);
  });

  it('allows trailing partial slots when includeEdge is true', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '10:10' },
      slotDurationMinutes: 30,
      minimumSlotDurationMinutes: 10,
      includeEdge: true
    });

    expect(slots.length).toBe(3);
    const trailing = slots[slots.length - 1]!;
    expect(trailing.start.toISOString()).toBe('2024-01-01T10:00:00.000Z');
    expect(trailing.end.toISOString()).toBe('2024-01-01T10:10:00.000Z');
    expect(trailing.metadata?.durationMinutes).toBe(10);
  });

  it('drops trailing partial slots when includeEdge is false', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '10:10' },
      slotDurationMinutes: 30,
      includeEdge: false
    });

    expect(slots.length).toBe(2);
    expect(slots[slots.length - 1]!.end.toISOString()).toBe('2024-01-01T10:00:00.000Z');
  });

  it('aligns slots from the end of the range', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '10:10' },
      slotDurationMinutes: 30,
      minimumSlotDurationMinutes: 10,
      includeEdge: true,
      alignment: 'end'
    });

    expect(slots.map((slot) => [slot.start.toISOString(), slot.end.toISOString()])).toEqual([
      ['2024-01-01T09:00:00.000Z', '2024-01-01T09:10:00.000Z'],
      ['2024-01-01T09:10:00.000Z', '2024-01-01T09:40:00.000Z'],
      ['2024-01-01T09:40:00.000Z', '2024-01-01T10:10:00.000Z']
    ]);
  });

  it('centers leftover time when alignment is center', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '11:00' },
      slotDurationMinutes: 45,
      slotIntervalMinutes: 45,
      alignment: 'center'
    });

    expect(slots.length).toBe(2);
    expect(slots[0]!.start.toISOString()).toBe('2024-01-01T09:15:00.000Z');
    expect(slots[0]!.end.toISOString()).toBe('2024-01-01T10:00:00.000Z');
    expect(slots[1]!.start.toISOString()).toBe('2024-01-01T10:00:00.000Z');
    expect(slots[1]!.end.toISOString()).toBe('2024-01-01T10:45:00.000Z');
  });

  it('respects maxSlots limit', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '18:00' },
      slotDurationMinutes: 60,
      maxSlots: 3
    });

    expect(slots.length).toBe(3);
    expect(slots[slots.length - 1]!.end.toISOString()).toBe('2024-01-01T12:00:00.000Z');
  });

  it('throws for invalid configuration', () => {
    expect(() =>
      generateTimeslots({
        range: { start: '09:00', end: '10:00' },
        slotDurationMinutes: -30
      })
    ).toThrow(RangeError);

    expect(() =>
      generateTimeslots({
        range: { start: '09:00', end: '10:00' },
        slotDurationMinutes: 30
      })
    ).toThrow(RangeError);

    expect(() =>
      generateTimeslots({
        range: { start: '2024-01-01T10:00:00Z', end: '2024-01-01T09:00:00Z' },
        slotDurationMinutes: 30
      })
    ).toThrow(RangeError);
  });

  it('interprets times with a specific timezone', () => {
    const winterSlots = generateTimeslots({
      day: '2024-01-15',
      timezone: 'America/New_York',
      range: { start: '09:00', end: '10:00' },
      slotDurationMinutes: 30
    });

    expect(winterSlots[0]!.start.toISOString()).toBe('2024-01-15T14:00:00.000Z');

    const summerSlots = generateTimeslots({
      day: '2024-06-15',
      timezone: 'America/New_York',
      range: { start: '09:00', end: '10:00' },
      slotDurationMinutes: 30
    });

    expect(summerSlots[0]!.start.toISOString()).toBe('2024-06-15T13:00:00.000Z');
  });

  it('allows custom labels via formatter', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '11:00' },
      slotDurationMinutes: 60,
      labelFormatter: ({ start }, index) => `${index + 1}. ${start.toISOString().slice(11, 16)}`
    });

    expect(slots[0]!.metadata?.label).toBe('1. 09:00');
    expect(slots[1]!.metadata?.label).toBe('2. 10:00');
  });

  it('avoids slots shorter than the minimum', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '09:20' },
      slotDurationMinutes: 30,
      minimumSlotDurationMinutes: 25,
      includeEdge: true
    });

    expect(slots.length).toBe(0);
  });

  it('merges overlapping exclusion windows before slicing', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '18:00' },
      slotDurationMinutes: 60,
      excludedWindows: [
        { start: '12:00', end: '12:30' },
        { start: '12:15', end: '13:15' }
      ]
    });

    expect(slots.some((slot) => slot.start.toISOString() === '2024-01-01T12:00:00.000Z')).toBe(false);
    expect(slots.some((slot) => slot.start.toISOString() === '2024-01-01T13:00:00.000Z')).toBe(false);
  });
});
