import { describe, expect, it } from 'vitest';
import { parseDateValue, parseTimeOfDay } from '../src/internal/time.js';

describe('parseDateValue – unsupported type error path', () => {
  it('throws TypeError when given a number', () => {
    expect(() => parseDateValue(42 as unknown as string)).toThrow(TypeError);
    expect(() => parseDateValue(42 as unknown as string)).toThrow('Unsupported date value');
  });

  it('throws TypeError when given a boolean', () => {
    expect(() => parseDateValue(true as unknown as string)).toThrow(TypeError);
    expect(() => parseDateValue(true as unknown as string)).toThrow('Unsupported date value');
  });

  it('throws TypeError when given null', () => {
    expect(() => parseDateValue(null as unknown as string)).toThrow(TypeError);
    expect(() => parseDateValue(null as unknown as string)).toThrow('Unsupported date value');
  });

  it('throws TypeError when given undefined', () => {
    expect(() => parseDateValue(undefined as unknown as string)).toThrow(TypeError);
    expect(() => parseDateValue(undefined as unknown as string)).toThrow('Unsupported date value');
  });
});

describe('parseTimeOfDay – unsupported type error path', () => {
  it('throws TypeError when given a number', () => {
    expect(() => parseTimeOfDay(42 as unknown as string)).toThrow(TypeError);
    expect(() => parseTimeOfDay(42 as unknown as string)).toThrow('Unsupported time input');
  });

  it('throws TypeError when given a boolean', () => {
    expect(() => parseTimeOfDay(true as unknown as string)).toThrow(TypeError);
    expect(() => parseTimeOfDay(true as unknown as string)).toThrow('Unsupported time input');
  });

  it('throws TypeError when given null', () => {
    expect(() => parseTimeOfDay(null as unknown as string)).toThrow(TypeError);
    expect(() => parseTimeOfDay(null as unknown as string)).toThrow('Unsupported time input');
  });

  it('throws TypeError when given an object without hour property', () => {
    expect(() => parseTimeOfDay({ minute: 30 } as unknown as string)).toThrow(TypeError);
    expect(() => parseTimeOfDay({ minute: 30 } as unknown as string)).toThrow('Unsupported time input');
  });
});
