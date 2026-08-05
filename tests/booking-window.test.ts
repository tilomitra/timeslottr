import { describe, expect, it } from 'vitest';
import {
  generateAvailableTimeslots,
  generateDailyTimeslots,
  generateTimeslots
} from '../src/index.js';
import type { TimeslotGenerationConfig } from '../src/types.js';

/** ISO strings for the generated starts, for readable assertions. */
function starts(slots: { start: Date }[]): string[] {
  return slots.map((slot) => slot.start.toISOString());
}

/** A 09:00–12:00 UTC window producing three hourly slots. */
function makeConfig(overrides: Partial<TimeslotGenerationConfig> = {}): TimeslotGenerationConfig {
  return {
    range: { start: '2024-01-01T09:00:00Z', end: '2024-01-01T12:00:00Z' },
    slotDurationMinutes: 60,
    ...overrides
  };
}

describe('minimumNoticeMinutes', () => {
  it('drops slots that start before the notice period elapses', () => {
    const slots = generateTimeslots(
      makeConfig({ now: '2024-01-01T08:00:00Z', minimumNoticeMinutes: 120 })
    );

    expect(starts(slots)).toEqual(['2024-01-01T10:00:00.000Z', '2024-01-01T11:00:00.000Z']);
  });

  it('keeps a slot starting exactly at the notice boundary (inclusive)', () => {
    const slots = generateTimeslots(
      makeConfig({ now: '2024-01-01T09:00:00Z', minimumNoticeMinutes: 60 })
    );

    expect(starts(slots)[0]).toBe('2024-01-01T10:00:00.000Z');
  });

  it('filters on the slot start, not its end — an in-progress slot is not bookable', () => {
    // now is 09:30, mid-way through the 09:00 slot. Zero notice still drops it.
    const slots = generateTimeslots(
      makeConfig({ now: '2024-01-01T09:30:00Z', minimumNoticeMinutes: 0 })
    );

    expect(starts(slots)).toEqual(['2024-01-01T10:00:00.000Z', '2024-01-01T11:00:00.000Z']);
  });

  it('drops partial edge slots by their start too', () => {
    const slots = generateTimeslots(
      makeConfig({
        range: { start: '2024-01-01T09:00:00Z', end: '2024-01-01T10:30:00Z' },
        minimumSlotDurationMinutes: 15,
        now: '2024-01-01T09:30:00Z',
        minimumNoticeMinutes: 0
      })
    );

    // The 10:00–10:30 edge slot survives; the full 09:00 slot does not.
    expect(starts(slots)).toEqual(['2024-01-01T10:00:00.000Z']);
  });

  it('returns an empty array when the whole window is inside the notice period', () => {
    expect(
      generateTimeslots(makeConfig({ now: '2024-01-01T08:00:00Z', minimumNoticeMinutes: 24 * 60 }))
    ).toEqual([]);
  });

  it('accepts a Date for now', () => {
    const slots = generateTimeslots(
      makeConfig({ now: new Date('2024-01-01T09:30:00Z'), minimumNoticeMinutes: 30 })
    );

    expect(starts(slots)).toEqual(['2024-01-01T10:00:00.000Z', '2024-01-01T11:00:00.000Z']);
  });

  it('defaults now to the current clock', () => {
    const base = Date.now();
    const slots = generateTimeslots({
      range: { start: new Date(base), end: new Date(base + 3 * 60 * 60_000) },
      slotDurationMinutes: 60,
      minimumNoticeMinutes: 90
    });

    // Only the slot starting 2h out clears a 90-minute notice.
    expect(slots).toHaveLength(1);
    expect(slots[0]!.start.getTime()).toBe(base + 2 * 60 * 60_000);
  });
});

describe('maximumAdvanceDays', () => {
  it('drops slots at or after the cutoff (exclusive)', () => {
    const slots = generateTimeslots({
      range: { start: '09:00', end: '12:00' },
      day: '2024-01-03',
      timezone: 'UTC',
      slotDurationMinutes: 60,
      now: '2024-01-01T10:00:00Z',
      maximumAdvanceDays: 2
    });

    // Cutoff is 2024-01-03T10:00Z, so the 10:00 slot is already out of range.
    expect(starts(slots)).toEqual(['2024-01-03T09:00:00.000Z']);
  });

  it('keeps the same wall-clock cutoff across a DST transition', () => {
    // 2024-03-10 is spring-forward in New York. now is 10:00 EST; four calendar
    // days later is 10:00 EDT (14:00Z), not 15:00Z as naive 24h arithmetic gives.
    const slots = generateTimeslots({
      range: { start: '09:00', end: '12:00' },
      day: '2024-03-12',
      timezone: 'America/New_York',
      slotDurationMinutes: 60,
      now: '2024-03-08T15:00:00Z',
      maximumAdvanceDays: 4
    });

    expect(starts(slots)).toEqual(['2024-03-12T13:00:00.000Z']);
  });
});

describe('booking window composition', () => {
  it('applies both bounds together', () => {
    const slots = generateDailyTimeslots(
      { start: '2024-01-01T00:00:00Z', end: '2024-01-05T00:00:00Z' },
      {
        range: { start: '09:00', end: '11:00' },
        timezone: 'UTC',
        slotDurationMinutes: 60,
        now: '2024-01-01T12:00:00Z',
        minimumNoticeMinutes: 24 * 60,
        maximumAdvanceDays: 3
      }
    );

    // Bookable starts fall in [2024-01-02T12:00Z, 2024-01-04T12:00Z).
    expect(starts(slots)).toEqual([
      '2024-01-03T09:00:00.000Z',
      '2024-01-03T10:00:00.000Z',
      '2024-01-04T09:00:00.000Z',
      '2024-01-04T10:00:00.000Z'
    ]);
  });

  it('applies to generateAvailableTimeslots alongside busy subtraction', () => {
    const slots = generateAvailableTimeslots({
      range: { start: '2024-01-01T09:00:00Z', end: '2024-01-01T13:00:00Z' },
      slotDurationMinutes: 60,
      busy: [{ start: '2024-01-01T11:00:00Z', end: '2024-01-01T12:00:00Z' }],
      now: '2024-01-01T08:30:00Z',
      minimumNoticeMinutes: 60
    });

    expect(starts(slots)).toEqual(['2024-01-01T10:00:00.000Z', '2024-01-01T12:00:00.000Z']);
  });

  it('counts only bookable slots against maxSlots', () => {
    const slots = generateTimeslots(
      makeConfig({
        range: { start: '2024-01-01T09:00:00Z', end: '2024-01-01T15:00:00Z' },
        maxSlots: 2,
        now: '2024-01-01T08:00:00Z',
        minimumNoticeMinutes: 180
      })
    );

    expect(starts(slots)).toEqual(['2024-01-01T11:00:00.000Z', '2024-01-01T12:00:00.000Z']);
  });

  it('numbers surviving slots contiguously from zero', () => {
    const slots = generateTimeslots(
      makeConfig({ now: '2024-01-01T08:00:00Z', minimumNoticeMinutes: 120 })
    );

    expect(slots.map((slot) => slot.metadata?.index)).toEqual([0, 1]);
  });

  it('ignores now entirely when neither option is set', () => {
    const slots = generateTimeslots(makeConfig({ now: '2030-01-01T00:00:00Z' }));

    expect(slots).toHaveLength(3);
  });
});

describe('booking window validation', () => {
  it('rejects a negative minimumNoticeMinutes', () => {
    expect(() => generateTimeslots(makeConfig({ minimumNoticeMinutes: -30 }))).toThrow(
      'minimumNoticeMinutes must be a non-negative number'
    );
  });

  it('rejects a non-finite minimumNoticeMinutes', () => {
    expect(() => generateTimeslots(makeConfig({ minimumNoticeMinutes: NaN }))).toThrow(RangeError);
    expect(() => generateTimeslots(makeConfig({ minimumNoticeMinutes: Infinity }))).toThrow(
      RangeError
    );
  });

  it('rejects a zero, negative, or fractional maximumAdvanceDays', () => {
    for (const maximumAdvanceDays of [0, -1, 1.5]) {
      expect(() => generateTimeslots(makeConfig({ maximumAdvanceDays }))).toThrow(
        'maximumAdvanceDays must be a positive whole number of days'
      );
    }
  });

  it('rejects bounds that leave no bookable window', () => {
    expect(() =>
      generateTimeslots(
        makeConfig({ now: '2024-01-01T00:00:00Z', minimumNoticeMinutes: 48 * 60, maximumAdvanceDays: 1 })
      )
    ).toThrow('leave no bookable window');
  });

  it('rejects an unparseable now', () => {
    expect(() => generateTimeslots(makeConfig({ now: 'not-a-date', minimumNoticeMinutes: 10 }))).toThrow(
      TypeError
    );
  });
});
