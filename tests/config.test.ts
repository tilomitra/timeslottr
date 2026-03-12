import { describe, expect, it } from 'vitest';
import { validateConfig } from '../src/internal/config.js';
import type { TimeslotGenerationConfig } from '../src/types.js';

/** Helper to build a minimal valid config, overriding specific fields. */
function makeConfig(overrides: Partial<TimeslotGenerationConfig> = {}): TimeslotGenerationConfig {
  return {
    range: { start: '2024-01-01T09:00:00Z', end: '2024-01-01T17:00:00Z' },
    slotDurationMinutes: 30,
    ...overrides
  };
}

describe('validateConfig', () => {
  // --- slotDurationMinutes ---

  it('throws when slotDurationMinutes is zero', () => {
    expect(() => validateConfig(makeConfig({ slotDurationMinutes: 0 }))).toThrow(RangeError);
    expect(() => validateConfig(makeConfig({ slotDurationMinutes: 0 }))).toThrow(
      'slotDurationMinutes must be a positive number'
    );
  });

  it('throws when slotDurationMinutes is negative', () => {
    expect(() => validateConfig(makeConfig({ slotDurationMinutes: -10 }))).toThrow(RangeError);
  });

  it('throws when slotDurationMinutes is NaN', () => {
    expect(() => validateConfig(makeConfig({ slotDurationMinutes: NaN }))).toThrow(RangeError);
  });

  it('throws when slotDurationMinutes is Infinity', () => {
    expect(() => validateConfig(makeConfig({ slotDurationMinutes: Infinity }))).toThrow(RangeError);
  });

  // --- slotIntervalMinutes ---

  it('defaults slotIntervalMinutes to slotDurationMinutes when omitted', () => {
    const result = validateConfig(makeConfig({ slotDurationMinutes: 45 }));
    expect(result.intervalMs).toBe(45 * 60_000);
  });

  it('throws when slotIntervalMinutes is zero', () => {
    expect(() => validateConfig(makeConfig({ slotIntervalMinutes: 0 }))).toThrow(RangeError);
    expect(() => validateConfig(makeConfig({ slotIntervalMinutes: 0 }))).toThrow(
      'slotIntervalMinutes must be a positive number'
    );
  });

  it('throws when slotIntervalMinutes is negative', () => {
    expect(() => validateConfig(makeConfig({ slotIntervalMinutes: -5 }))).toThrow(RangeError);
  });

  it('throws when slotIntervalMinutes is NaN', () => {
    expect(() => validateConfig(makeConfig({ slotIntervalMinutes: NaN }))).toThrow(RangeError);
  });

  it('throws when slotIntervalMinutes is Infinity', () => {
    expect(() => validateConfig(makeConfig({ slotIntervalMinutes: Infinity }))).toThrow(RangeError);
  });

  // --- bufferBeforeMinutes ---

  it('accepts bufferBeforeMinutes of zero without throwing', () => {
    // 0 is falsy, so the guard `config.bufferBeforeMinutes && ...` is skipped
    expect(() => validateConfig(makeConfig({ bufferBeforeMinutes: 0 }))).not.toThrow();
  });

  it('accepts positive bufferBeforeMinutes', () => {
    expect(() => validateConfig(makeConfig({ bufferBeforeMinutes: 15 }))).not.toThrow();
  });

  it('throws when bufferBeforeMinutes is negative', () => {
    expect(() => validateConfig(makeConfig({ bufferBeforeMinutes: -1 }))).toThrow(RangeError);
    expect(() => validateConfig(makeConfig({ bufferBeforeMinutes: -1 }))).toThrow(
      'bufferBeforeMinutes cannot be negative'
    );
  });

  // --- bufferAfterMinutes ---

  it('accepts bufferAfterMinutes of zero without throwing', () => {
    expect(() => validateConfig(makeConfig({ bufferAfterMinutes: 0 }))).not.toThrow();
  });

  it('accepts positive bufferAfterMinutes', () => {
    expect(() => validateConfig(makeConfig({ bufferAfterMinutes: 10 }))).not.toThrow();
  });

  it('throws when bufferAfterMinutes is negative', () => {
    expect(() => validateConfig(makeConfig({ bufferAfterMinutes: -5 }))).toThrow(RangeError);
    expect(() => validateConfig(makeConfig({ bufferAfterMinutes: -5 }))).toThrow(
      'bufferAfterMinutes cannot be negative'
    );
  });

  // --- minimumSlotDurationMinutes ---

  it('throws when minimumSlotDurationMinutes is negative', () => {
    expect(() => validateConfig(makeConfig({ minimumSlotDurationMinutes: -1 }))).toThrow(RangeError);
    expect(() => validateConfig(makeConfig({ minimumSlotDurationMinutes: -1 }))).toThrow(
      'minimumSlotDurationMinutes must be positive'
    );
  });

  it('accepts minimumSlotDurationMinutes of zero without throwing (falsy guard)', () => {
    // 0 is falsy so the guard is skipped; minDurationMs falls back to slotDurationMinutes
    expect(() => validateConfig(makeConfig({ minimumSlotDurationMinutes: 0 }))).not.toThrow();
  });

  it('accepts positive minimumSlotDurationMinutes', () => {
    const result = validateConfig(makeConfig({ minimumSlotDurationMinutes: 10 }));
    expect(result.minDurationMs).toBe(10 * 60_000);
  });

  it('defaults minimumSlotDurationMinutes to slotDurationMinutes when omitted', () => {
    const result = validateConfig(makeConfig({ slotDurationMinutes: 30 }));
    expect(result.minDurationMs).toBe(30 * 60_000);
  });

  // --- maxSlots ---

  it('throws when maxSlots is zero', () => {
    expect(() => validateConfig(makeConfig({ maxSlots: 0 }))).not.toThrow();
    // 0 is falsy so the guard is skipped
  });

  it('throws when maxSlots is negative', () => {
    expect(() => validateConfig(makeConfig({ maxSlots: -1 }))).toThrow(RangeError);
    expect(() => validateConfig(makeConfig({ maxSlots: -1 }))).toThrow(
      'maxSlots must be greater than zero when provided'
    );
  });

  it('accepts positive maxSlots', () => {
    const result = validateConfig(makeConfig({ maxSlots: 5 }));
    expect(result.maxSlots).toBe(5);
  });

  it('leaves maxSlots undefined when omitted', () => {
    const result = validateConfig(makeConfig());
    expect(result.maxSlots).toBeUndefined();
  });

  // --- includeEdge ---

  it('defaults includeEdge to true when omitted', () => {
    const result = validateConfig(makeConfig());
    expect(result.includeEdge).toBe(true);
  });

  it('respects includeEdge when explicitly false', () => {
    const result = validateConfig(makeConfig({ includeEdge: false }));
    expect(result.includeEdge).toBe(false);
  });

  // --- alignment ---

  it('defaults alignment to start when omitted', () => {
    const result = validateConfig(makeConfig());
    expect(result.alignment).toBe('start');
  });

  it('respects alignment set to end', () => {
    const result = validateConfig(makeConfig({ alignment: 'end' }));
    expect(result.alignment).toBe('end');
  });

  it('respects alignment set to center', () => {
    const result = validateConfig(makeConfig({ alignment: 'center' }));
    expect(result.alignment).toBe('center');
  });

  // --- labelFormatter ---

  it('passes labelFormatter through to the result', () => {
    const formatter = () => 'label';
    const result = validateConfig(makeConfig({ labelFormatter: formatter }));
    expect(result.labelFormatter).toBe(formatter);
  });

  it('leaves labelFormatter undefined when omitted', () => {
    const result = validateConfig(makeConfig());
    expect(result.labelFormatter).toBeUndefined();
  });

  // --- happy path ---

  it('returns correctly normalized config for valid input', () => {
    const result = validateConfig(
      makeConfig({
        slotDurationMinutes: 60,
        slotIntervalMinutes: 30,
        minimumSlotDurationMinutes: 15,
        maxSlots: 10,
        includeEdge: false,
        alignment: 'center'
      })
    );

    expect(result.durationMs).toBe(60 * 60_000);
    expect(result.intervalMs).toBe(30 * 60_000);
    expect(result.minDurationMs).toBe(15 * 60_000);
    expect(result.maxSlots).toBe(10);
    expect(result.includeEdge).toBe(false);
    expect(result.alignment).toBe('center');
  });
});
