import type { TimeslotRangeInput } from '../types.js';
import { resolveRange, type BoundaryContext } from './boundaries.js';

export type Interval = { start: Date; end: Date };

export function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) {
    return [];
  }

  const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: Interval[] = [sorted[0]!];

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i]!;
    const last = merged[merged.length - 1]!;

    if (current.start.getTime() <= last.end.getTime()) {
      if (current.end.getTime() > last.end.getTime()) {
        last.end = current.end;
      }
    } else {
      merged.push({ start: current.start, end: current.end });
    }
  }

  return merged;
}

export function subtractExclusions(source: Interval, exclusions: Interval[]): Interval[] {
  let segments: Interval[] = [source];

  for (const exclusion of exclusions) {
    const nextSegments: Interval[] = [];

    for (const segment of segments) {
      const segmentStart = segment.start.getTime();
      const segmentEnd = segment.end.getTime();
      const exclusionStart = Math.max(exclusion.start.getTime(), segmentStart);
      const exclusionEnd = Math.min(exclusion.end.getTime(), segmentEnd);

      if (exclusionEnd <= exclusionStart) {
        nextSegments.push(segment);
        continue;
      }

      if (exclusionStart > segmentStart) {
        nextSegments.push({ start: segment.start, end: new Date(exclusionStart) });
      }

      if (exclusionEnd < segmentEnd) {
        nextSegments.push({ start: new Date(exclusionEnd), end: segment.end });
      }
    }

    segments = nextSegments;
    if (segments.length === 0) {
      break;
    }
  }

  return segments;
}

export function normalizeExclusions(
  exclusions: TimeslotRangeInput[] | undefined,
  context: BoundaryContext,
  window: Interval
): Interval[] {
  if (!exclusions || exclusions.length === 0) {
    return [];
  }

  const normalized: Interval[] = [];

  for (const exclusion of exclusions) {
    const resolved = resolveRange(exclusion, context);
    const start = resolved.start.getTime();
    const end = resolved.end.getTime();

    const windowStart = window.start.getTime();
    const windowEnd = window.end.getTime();

    if (end <= windowStart || start >= windowEnd) {
      continue;
    }

    const clampedStart = new Date(Math.max(start, windowStart));
    const clampedEnd = new Date(Math.min(end, windowEnd));
    if (clampedEnd.getTime() > clampedStart.getTime()) {
      normalized.push({ start: clampedStart, end: clampedEnd });
    }
  }

  return mergeIntervals(normalized);
}
