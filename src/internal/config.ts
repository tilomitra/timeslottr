import { MILLIS_PER_MINUTE } from './constants';
import {
  AlignmentStrategy,
  LabelFormatter,
  TimeslotGenerationConfig
} from '../types';

export interface NormalizedConfig {
  durationMs: number;
  intervalMs: number;
  minDurationMs: number;
  includeEdge: boolean;
  alignment: AlignmentStrategy;
  maxSlots?: number;
  labelFormatter?: LabelFormatter;
}

export function validateConfig(config: TimeslotGenerationConfig): NormalizedConfig {
  if (!Number.isFinite(config.slotDurationMinutes) || config.slotDurationMinutes <= 0) {
    throw new RangeError('slotDurationMinutes must be a positive number');
  }

  const durationMs = config.slotDurationMinutes * MILLIS_PER_MINUTE;
  const intervalMinutes = config.slotIntervalMinutes ?? config.slotDurationMinutes;

  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
    throw new RangeError('slotIntervalMinutes must be a positive number');
  }

  const intervalMs = intervalMinutes * MILLIS_PER_MINUTE;

  if (config.bufferBeforeMinutes && config.bufferBeforeMinutes < 0) {
    throw new RangeError('bufferBeforeMinutes cannot be negative');
  }

  if (config.bufferAfterMinutes && config.bufferAfterMinutes < 0) {
    throw new RangeError('bufferAfterMinutes cannot be negative');
  }

  if (config.minimumSlotDurationMinutes && config.minimumSlotDurationMinutes <= 0) {
    throw new RangeError('minimumSlotDurationMinutes must be positive');
  }

  if (config.maxSlots && config.maxSlots <= 0) {
    throw new RangeError('maxSlots must be greater than zero when provided');
  }

  const minDurationMs = (config.minimumSlotDurationMinutes ?? config.slotDurationMinutes) * MILLIS_PER_MINUTE;
  const includeEdge = config.includeEdge ?? true;
  const alignment: AlignmentStrategy = config.alignment ?? 'start';

  return {
    durationMs,
    intervalMs,
    minDurationMs,
    includeEdge,
    alignment,
    maxSlots: config.maxSlots,
    labelFormatter: config.labelFormatter
  };
}
