import { MILLIS_PER_MINUTE } from './constants';
import { NormalizedConfig } from './config';
import { Timeslot, TimeslotMetadata } from '../types';

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * MILLIS_PER_MINUTE);
}

function pushSlot(
  slots: Timeslot[],
  startMs: number,
  endMs: number,
  config: NormalizedConfig
): void {
  if (config.maxSlots !== undefined && slots.length >= config.maxSlots) {
    return;
  }

  if (endMs <= startMs) {
    return;
  }

  const start = new Date(startMs);
  const end = new Date(endMs);
  const durationMinutes = (endMs - startMs) / MILLIS_PER_MINUTE;
  const index = slots.length;

  const slot: Timeslot = { start, end };
  const metadata: TimeslotMetadata = {
    index,
    durationMinutes
  };

  if (config.labelFormatter) {
    const label = config.labelFormatter({ start, end }, index, durationMinutes);
    if (label !== undefined) {
      metadata.label = label;
    }
  }

  slot.metadata = metadata;
  slots.push(slot);
}

export function generateSlotsForSegment(
  slots: Timeslot[],
  segment: { start: Date; end: Date },
  config: NormalizedConfig
): void {
  const segmentStartMs = segment.start.getTime();
  const segmentEndMs = segment.end.getTime();
  const spanMs = segmentEndMs - segmentStartMs;

  if (spanMs <= 0) {
    return;
  }

  if (config.maxSlots !== undefined && slots.length >= config.maxSlots) {
    return;
  }

  const { durationMs, intervalMs, minDurationMs, includeEdge, alignment } = config;

  if (alignment === 'center') {
    if (spanMs < durationMs) {
      if (includeEdge && spanMs >= minDurationMs) {
        pushSlot(slots, segmentStartMs, segmentEndMs, config);
      }
      return;
    }

    const slotCount = Math.floor((spanMs - durationMs) / intervalMs) + 1;
    if (slotCount <= 0) {
      if (includeEdge && spanMs >= minDurationMs) {
        pushSlot(slots, segmentStartMs, segmentEndMs, config);
      }
      return;
    }

    const usedSpan = durationMs + (slotCount - 1) * intervalMs;
    const leftover = spanMs - usedSpan;
    const offset = Math.round(leftover / 2);

    for (let i = 0; i < slotCount; i += 1) {
      if (config.maxSlots !== undefined && slots.length >= config.maxSlots) {
        break;
      }
      const start = segmentStartMs + offset + i * intervalMs;
      const end = start + durationMs;
      pushSlot(slots, start, end, config);
    }
    return;
  }

  if (alignment === 'start') {
    for (
      let slotStart = segmentStartMs;
      slotStart < segmentEndMs && (config.maxSlots === undefined || slots.length < config.maxSlots);
      slotStart += intervalMs
    ) {
      const slotEnd = slotStart + durationMs;
      if (slotEnd <= segmentEndMs) {
        pushSlot(slots, slotStart, slotEnd, config);
      } else if (includeEdge) {
        const remaining = segmentEndMs - slotStart;
        if (remaining >= minDurationMs) {
          pushSlot(slots, slotStart, segmentEndMs, config);
        }
      }
    }
    return;
  }

  // alignment === 'end'
  if (spanMs < durationMs) {
    if (includeEdge && spanMs >= minDurationMs) {
      pushSlot(slots, segmentStartMs, segmentEndMs, config);
    }
    return;
  }

  const countFull = Math.floor((spanMs - durationMs) / intervalMs) + 1;
  const firstStart = segmentEndMs - durationMs - (countFull - 1) * intervalMs;
  const leftover = firstStart - segmentStartMs;

  if (includeEdge && leftover >= minDurationMs) {
    pushSlot(slots, segmentStartMs, segmentStartMs + leftover, config);
  }

  for (let i = 0; i < countFull; i += 1) {
    if (config.maxSlots !== undefined && slots.length >= config.maxSlots) {
      break;
    }
    const slotStart = firstStart + i * intervalMs;
    const slotEnd = slotStart + durationMs;
    pushSlot(slots, slotStart, slotEnd, config);
  }
}
