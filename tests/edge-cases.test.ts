import { describe, expect, it } from 'vitest';
import { generateTimeslots } from '../src/index.ts';
import { generateDailyTimeslots } from '../src/index.ts';

// ─── Helpers ────────────────────────────────────────────────────────────────

function noOverlaps(slots: { start: Date; end: Date }[]): boolean {
  for (let i = 1; i < slots.length; i++) {
    if (slots[i]!.start.getTime() < slots[i - 1]!.end.getTime()) {
      return false;
    }
  }
  return true;
}

// ─── a. DST boundary slots ─────────────────────────────────────────────────

describe('DST boundary slots', () => {
  // 2024 spring forward: March 10 at 2:00 AM EST -> 3:00 AM EDT
  // The hour from 2:00 to 3:00 does not exist in America/New_York

  it('spring forward — slots do not overlap and have correct total coverage', () => {
    const slots = generateTimeslots({
      day: '2024-03-10',
      timezone: 'America/New_York',
      range: { start: '00:00', end: '06:00' },
      slotDurationMinutes: 30,
    });

    // 6 hours of wall-clock time, but only 5 real hours due to spring forward
    // With 30-min slots across 5 real hours: 10 slots
    expect(slots.length).toBe(10);
    expect(noOverlaps(slots)).toBe(true);

    // Each slot should be exactly 30 minutes in real time
    for (const slot of slots) {
      const durationMs = slot.end.getTime() - slot.start.getTime();
      expect(durationMs).toBe(30 * 60 * 1000);
    }
  });

  it('spring forward — slot spanning the DST gap is valid', () => {
    // Generate a slot that would straddle the 2 AM boundary
    const slots = generateTimeslots({
      day: '2024-03-10',
      timezone: 'America/New_York',
      range: { start: '01:00', end: '04:00' },
      slotDurationMinutes: 60,
    });

    expect(noOverlaps(slots)).toBe(true);
    for (const slot of slots) {
      const durationMs = slot.end.getTime() - slot.start.getTime();
      expect(durationMs).toBe(60 * 60 * 1000);
    }
  });

  // 2024 fall back: November 3 at 2:00 AM EDT -> 1:00 AM EST
  // The hour from 1:00 to 2:00 occurs twice

  it('fall back — slots do not overlap and account for the extra hour', () => {
    const slots = generateTimeslots({
      day: '2024-11-03',
      timezone: 'America/New_York',
      range: { start: '00:00', end: '06:00' },
      slotDurationMinutes: 30,
    });

    // 6 hours of wall-clock time, but 7 real hours due to fall back
    // With 30-min slots across 7 real hours: 14 slots
    expect(slots.length).toBe(14);
    expect(noOverlaps(slots)).toBe(true);

    for (const slot of slots) {
      const durationMs = slot.end.getTime() - slot.start.getTime();
      expect(durationMs).toBe(30 * 60 * 1000);
    }
  });

  it('fall back — slot durations are consistent in real time', () => {
    const slots = generateTimeslots({
      day: '2024-11-03',
      timezone: 'America/New_York',
      range: { start: '00:00', end: '04:00' },
      slotDurationMinutes: 60,
    });

    expect(noOverlaps(slots)).toBe(true);
    for (const slot of slots) {
      const durationMs = slot.end.getTime() - slot.start.getTime();
      expect(durationMs).toBe(60 * 60 * 1000);
    }
  });
});

// ─── b. Midnight-crossing ranges ────────────────────────────────────────────

describe('midnight-crossing ranges', () => {
  it('generates slots across midnight using full datetime boundaries', () => {
    const slots = generateTimeslots({
      timezone: 'UTC',
      range: {
        start: '2024-01-01T22:00:00Z',
        end: '2024-01-02T02:00:00Z',
      },
      slotDurationMinutes: 60,
    });

    expect(slots.length).toBe(4);
    expect(slots[0]!.start.toISOString()).toBe('2024-01-01T22:00:00.000Z');
    expect(slots[3]!.end.toISOString()).toBe('2024-01-02T02:00:00.000Z');
    expect(noOverlaps(slots)).toBe(true);
  });

  it('errors meaningfully when time-only range implies end before start', () => {
    // Using time-only boundaries: 22:00 to 02:00 on the same day is invalid
    // because the library resolves both times on the same day
    expect(() =>
      generateTimeslots({
        day: '2024-01-01',
        timezone: 'UTC',
        range: { start: '22:00', end: '02:00' },
        slotDurationMinutes: 30,
      })
    ).toThrow(RangeError);
  });
});

// ─── c. Very large ranges ───────────────────────────────────────────────────

describe('very large ranges', () => {
  it('generates exactly 96 slots for a full 24-hour day with 15-min slots', () => {
    const slots = generateTimeslots({
      timezone: 'UTC',
      range: {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-02T00:00:00Z',
      },
      slotDurationMinutes: 15,
    });

    expect(slots.length).toBe(96);
    expect(noOverlaps(slots)).toBe(true);
    expect(slots[0]!.start.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    expect(slots[95]!.end.toISOString()).toBe('2024-01-02T00:00:00.000Z');
  });

  it('generates a full week of 15-min slots (672 slots) efficiently', () => {
    const startTime = performance.now();

    const slots = generateTimeslots({
      timezone: 'UTC',
      range: {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-08T00:00:00Z',
      },
      slotDurationMinutes: 15,
    });

    const elapsed = performance.now() - startTime;

    expect(slots.length).toBe(672);
    expect(noOverlaps(slots)).toBe(true);
    // Performance should be reasonable — well under 1 second
    expect(elapsed).toBeLessThan(1000);
  });

  it('generates a full week of daily 15-min slots efficiently', () => {
    const startTime = performance.now();

    const slots = generateDailyTimeslots(
      {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-08T00:00:00Z',
      },
      {
        timezone: 'UTC',
        range: { start: '09:00', end: '17:00' },
        slotDurationMinutes: 15,
      }
    );

    const elapsed = performance.now() - startTime;

    // 7 days * 32 slots per day (8 hours / 15 min) = 224
    expect(slots.length).toBe(224);
    expect(noOverlaps(slots)).toBe(true);
    expect(elapsed).toBeLessThan(1000);
  });
});

// ─── d. Single-slot ranges ──────────────────────────────────────────────────

describe('single-slot ranges', () => {
  it('returns exactly one slot when range equals slot duration', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '09:30' },
      slotDurationMinutes: 30,
    });

    expect(slots.length).toBe(1);
    expect(slots[0]!.start.toISOString()).toBe('2024-01-01T09:00:00.000Z');
    expect(slots[0]!.end.toISOString()).toBe('2024-01-01T09:30:00.000Z');
    expect(slots[0]!.metadata?.durationMinutes).toBe(30);
  });

  it('returns exactly one slot when range equals slot duration (60 min)', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '12:00', end: '13:00' },
      slotDurationMinutes: 60,
    });

    expect(slots.length).toBe(1);
    expect(slots[0]!.metadata?.durationMinutes).toBe(60);
  });
});

// ─── e. Range smaller than slot duration ────────────────────────────────────

describe('range smaller than slot duration', () => {
  it('returns an edge slot when includeEdge is true and range meets minimum', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '09:20' },
      slotDurationMinutes: 30,
      minimumSlotDurationMinutes: 15,
      includeEdge: true,
    });

    expect(slots.length).toBe(1);
    expect(slots[0]!.metadata?.durationMinutes).toBe(20);
  });

  it('returns empty when includeEdge is false and range is smaller than duration', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '09:20' },
      slotDurationMinutes: 30,
      includeEdge: false,
    });

    expect(slots.length).toBe(0);
  });

  it('returns empty when includeEdge is true but range is below minimum duration', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '09:10' },
      slotDurationMinutes: 30,
      minimumSlotDurationMinutes: 15,
      includeEdge: true,
    });

    expect(slots.length).toBe(0);
  });

  it('returns edge slot with default includeEdge (true)', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '09:15' },
      slotDurationMinutes: 30,
    });

    // Default includeEdge is true, default minDuration equals slotDuration (30)
    // 15 min < 30 min minimum, so no slot
    expect(slots.length).toBe(0);
  });
});

// ─── f. All time excluded ───────────────────────────────────────────────────

describe('all time excluded', () => {
  it('returns empty when a single exclusion covers the entire range', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '17:00' },
      slotDurationMinutes: 60,
      excludedWindows: [{ start: '09:00', end: '17:00' }],
    });

    expect(slots.length).toBe(0);
  });

  it('returns empty when exclusion is larger than the range', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '17:00' },
      slotDurationMinutes: 60,
      excludedWindows: [{ start: '08:00', end: '18:00' }],
    });

    expect(slots.length).toBe(0);
  });

  it('returns empty when multiple adjacent exclusions cover entire range', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '17:00' },
      slotDurationMinutes: 60,
      excludedWindows: [
        { start: '09:00', end: '13:00' },
        { start: '13:00', end: '17:00' },
      ],
    });

    expect(slots.length).toBe(0);
  });

  it('returns empty when exclusions leave only sub-minimum fragments', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '12:00' },
      slotDurationMinutes: 60,
      includeEdge: false,
      excludedWindows: [
        { start: '09:00', end: '09:50' },
        { start: '10:10', end: '11:50' },
      ],
    });

    // Remaining segments: 09:50-10:10 (20 min), 11:50-12:00 (10 min)
    // Neither fits a 60-min slot
    expect(slots.length).toBe(0);
  });
});

// ─── g. Overlapping exclusions that merge ───────────────────────────────────

describe('overlapping exclusions that merge', () => {
  it('merges two overlapping exclusions and produces correct slots', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '17:00' },
      slotDurationMinutes: 60,
      excludedWindows: [
        { start: '12:00', end: '13:30' },
        { start: '13:00', end: '14:00' },
      ],
    });

    // Merged exclusion: 12:00-14:00
    // Available: 09:00-12:00 (3 slots) + 14:00-17:00 (3 slots) = 6
    expect(slots.length).toBe(6);
    expect(noOverlaps(slots)).toBe(true);

    // Verify no slot overlaps the excluded period
    for (const slot of slots) {
      const inExcluded =
        slot.start.getTime() < new Date('2024-01-01T14:00:00Z').getTime() &&
        slot.end.getTime() > new Date('2024-01-01T12:00:00Z').getTime();
      expect(inExcluded).toBe(false);
    }
  });

  it('merges three overlapping exclusions into one', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '17:00' },
      slotDurationMinutes: 30,
      excludedWindows: [
        { start: '11:00', end: '12:00' },
        { start: '11:30', end: '13:00' },
        { start: '12:30', end: '14:00' },
      ],
    });

    // Merged exclusion: 11:00-14:00
    // Available: 09:00-11:00 (4 slots) + 14:00-17:00 (6 slots) = 10
    expect(slots.length).toBe(10);
    expect(noOverlaps(slots)).toBe(true);
  });

  it('handles fully contained exclusion within another', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '17:00' },
      slotDurationMinutes: 60,
      excludedWindows: [
        { start: '12:00', end: '15:00' },
        { start: '13:00', end: '14:00' }, // fully inside the first
      ],
    });

    // Merged exclusion: 12:00-15:00
    // Available: 09:00-12:00 (3 slots) + 15:00-17:00 (2 slots) = 5
    expect(slots.length).toBe(5);
    expect(noOverlaps(slots)).toBe(true);
  });
});

// ─── h. Buffer larger than available window ─────────────────────────────────

describe('buffer larger than available window', () => {
  it('throws RangeError when bufferBefore eliminates the window', () => {
    expect(() =>
      generateTimeslots({
        day: '2024-01-01',
        timezone: 'UTC',
        range: { start: '09:00', end: '10:00' },
        slotDurationMinutes: 30,
        bufferBeforeMinutes: 120,
      })
    ).toThrow(RangeError);
  });

  it('throws RangeError when bufferAfter eliminates the window', () => {
    expect(() =>
      generateTimeslots({
        day: '2024-01-01',
        timezone: 'UTC',
        range: { start: '09:00', end: '10:00' },
        slotDurationMinutes: 30,
        bufferAfterMinutes: 120,
      })
    ).toThrow(RangeError);
  });

  it('throws RangeError when combined buffers eliminate the window', () => {
    expect(() =>
      generateTimeslots({
        day: '2024-01-01',
        timezone: 'UTC',
        range: { start: '09:00', end: '10:00' },
        slotDurationMinutes: 15,
        bufferBeforeMinutes: 30,
        bufferAfterMinutes: 30,
      })
    ).toThrow(RangeError);
  });

  it('throws RangeError when buffers exactly equal the range', () => {
    expect(() =>
      generateTimeslots({
        day: '2024-01-01',
        timezone: 'UTC',
        range: { start: '09:00', end: '10:00' },
        slotDurationMinutes: 15,
        bufferBeforeMinutes: 30,
        bufferAfterMinutes: 30,
      })
    ).toThrow(RangeError);
  });

  it('works when buffers leave just enough room for one slot', () => {
    const slots = generateTimeslots({
      day: '2024-01-01',
      timezone: 'UTC',
      range: { start: '09:00', end: '11:00' },
      slotDurationMinutes: 30,
      bufferBeforeMinutes: 30,
      bufferAfterMinutes: 30,
    });

    // Window shrinks to 09:30-10:30 = 60 minutes, fits 2 x 30-min slots
    expect(slots.length).toBe(2);
    expect(slots[0]!.start.toISOString()).toBe('2024-01-01T09:30:00.000Z');
    expect(slots[1]!.end.toISOString()).toBe('2024-01-01T10:30:00.000Z');
  });
});
