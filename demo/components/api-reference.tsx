"use client";

import * as React from "react";
import { Highlight, themes } from "prism-react-renderer";

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-[13px] font-mono">
      {children}
    </code>
  );
}

function CodeSnippet({ code, className = "" }: { code: string; className?: string }) {
  return (
    <div className={`rounded-lg border bg-muted/30 overflow-auto ${className}`}>
      <Highlight theme={themes.vsLight} code={code.trim()} language="typescript">
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre
            style={{ ...style, background: "transparent" }}
            className="p-4 text-[13px] font-mono leading-relaxed"
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h3 id={id} className="text-xl font-semibold tracking-tight scroll-mt-24">
      {children}
    </h3>
  );
}

function ParamRow({
  name,
  type,
  required,
  defaultVal,
  children,
}: {
  name: string;
  type: string;
  required?: boolean;
  defaultVal?: string;
  children: React.ReactNode;
}) {
  return (
    <tr className="border-b last:border-b-0">
      <td className="py-3 pr-4 align-top">
        <InlineCode>{name}</InlineCode>
      </td>
      <td className="py-3 pr-4 align-top text-sm font-mono text-muted-foreground whitespace-nowrap">
        {type}
      </td>
      <td className="py-3 pr-4 align-top text-sm text-center">
        {required ? (
          <span className="text-red-500 font-medium">required</span>
        ) : defaultVal ? (
          <InlineCode>{defaultVal}</InlineCode>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="py-3 align-top text-sm text-muted-foreground">
        {children}
      </td>
    </tr>
  );
}

function FunctionCard({
  id,
  signature,
  description,
  children,
}: {
  id: string;
  signature: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      id={id}
      className="rounded-xl border bg-card text-card-foreground shadow-sm scroll-mt-24"
    >
      <div className="p-6 border-b bg-muted/10">
        <code className="text-sm font-mono font-semibold break-all">
          {signature}
        </code>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      {children && <div className="p-6">{children}</div>}
    </div>
  );
}

export function ApiReference() {
  return (
    <div className="space-y-16">
      {/* Quick nav */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: "#generateTimeslots", label: "generateTimeslots()" },
          { href: "#generateDailyTimeslots", label: "generateDailyTimeslots()" },
          { href: "#createTimeslot", label: "createTimeslot()" },
          { href: "#overlaps", label: "overlaps()" },
          { href: "#contains", label: "contains()" },
          { href: "#mergeSlots", label: "mergeSlots()" },
          { href: "#findGaps", label: "findGaps()" },
          { href: "#timeslotToJSON", label: "timeslotToJSON()" },
          { href: "#timeslotFromJSON", label: "timeslotFromJSON()" },
          { href: "#config", label: "Configuration" },
          { href: "#types", label: "Types" },
          { href: "#weekday", label: "Weekday Enum" },
        ].map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="rounded-lg border bg-card px-4 py-3 text-sm font-mono hover:bg-muted/50 transition-colors"
          >
            {label}
          </a>
        ))}
      </div>

      {/* --- Core Generation Functions --- */}
      <div className="space-y-6">
        <SectionHeading id="core-functions">
          Core Generation Functions
        </SectionHeading>

        <FunctionCard
          id="generateTimeslots"
          signature="generateTimeslots(config: TimeslotGenerationConfig): Timeslot[]"
          description="Generates time slots for a single day (or custom date range). This is the primary function for most use cases."
        >
          <div className="space-y-4">
            <CodeSnippet
              code={`import { generateTimeslots } from 'timeslottr';

const slots = generateTimeslots({
  day: '2024-03-15',
  timezone: 'America/New_York',
  range: { start: '09:00', end: '17:00' },
  slotDurationMinutes: 30,
  slotIntervalMinutes: 15,       // overlapping 30-min slots every 15 min
  bufferBeforeMinutes: 10,        // 10 min buffer at start
  bufferAfterMinutes: 10,         // 10 min buffer at end
  excludedWindows: [
    { start: '12:00', end: '13:00' }  // lunch break
  ],
  alignment: 'start',
  includeEdge: true,
  maxSlots: 50,
  labelFormatter: (slot, index) => \`Slot #\${index + 1}\`,
});`}
            />
            <p className="text-sm text-muted-foreground">
              See the <a href="#config" className="underline underline-offset-4 font-medium">Configuration</a> section for full details on each option.
            </p>
          </div>
        </FunctionCard>

        <FunctionCard
          id="generateDailyTimeslots"
          signature="generateDailyTimeslots(period: TimeslotRangeInput, config: DailyTimeslotConfig): Timeslot[]"
          description="Generates time slots across multiple days. Supports per-weekday schedules using a Map of Weekday to time ranges, or a single range applied to every day."
        >
          <div className="space-y-4">
            <CodeSnippet
              code={`import { generateDailyTimeslots, Weekday } from 'timeslottr';

// Per-weekday schedule over a 2-week span
const slots = generateDailyTimeslots(
  { start: '2024-03-01', end: '2024-03-14' },
  {
    range: new Map([
      [Weekday.MON, { start: '09:00', end: '17:00' }],
      [Weekday.TUE, { start: '09:00', end: '17:00' }],
      [Weekday.WED, { start: '09:00', end: '12:00' }],
      [Weekday.THU, { start: '09:00', end: '17:00' }],
      [Weekday.FRI, { start: '10:00', end: '16:00' }],
      // SAT and SUN omitted = no slots generated
    ]),
    slotDurationMinutes: 60,
    timezone: 'America/New_York',
    excludedWindows: [
      { start: '12:00', end: '13:00' }
    ],
  }
);`}
            />
            <p className="text-sm text-muted-foreground">
              The first argument defines the overall date range. Days whose weekday
              is not in the Map (or mapped to <InlineCode>null</InlineCode>) are
              skipped. You can also pass a single{" "}
              <InlineCode>TimeslotRangeInput</InlineCode> instead of a Map to
              apply the same hours to every day.
            </p>
          </div>
        </FunctionCard>
      </div>

      {/* --- Utility Functions --- */}
      <div className="space-y-6">
        <SectionHeading id="utility-functions">
          Utility Functions
        </SectionHeading>

        <FunctionCard
          id="createTimeslot"
          signature="createTimeslot(start: Date, end: Date): Timeslot"
          description="Creates a validated Timeslot. Throws TypeError if either date is invalid, or RangeError if end is not after start."
        >
          <CodeSnippet
            code={`import { createTimeslot } from 'timeslottr';

const slot = createTimeslot(
  new Date('2024-03-15T09:00:00Z'),
  new Date('2024-03-15T09:30:00Z')
);
// { start: Date, end: Date }`}
          />
        </FunctionCard>

        <FunctionCard
          id="overlaps"
          signature="overlaps(a: Timeslot, b: Timeslot): boolean"
          description="Returns true if two timeslots overlap in time. Uses half-open interval comparison (start inclusive, end exclusive)."
        >
          <CodeSnippet
            code={`import { overlaps, createTimeslot } from 'timeslottr';

const a = createTimeslot(new Date('2024-03-15T09:00:00Z'), new Date('2024-03-15T10:00:00Z'));
const b = createTimeslot(new Date('2024-03-15T09:30:00Z'), new Date('2024-03-15T10:30:00Z'));

overlaps(a, b); // true`}
          />
        </FunctionCard>

        <FunctionCard
          id="contains"
          signature="contains(slot: Timeslot, date: Date): boolean"
          description="Returns true if a date falls within the timeslot. The start is inclusive and the end is exclusive."
        >
          <CodeSnippet
            code={`import { contains, createTimeslot } from 'timeslottr';

const slot = createTimeslot(
  new Date('2024-03-15T09:00:00Z'),
  new Date('2024-03-15T10:00:00Z')
);

contains(slot, new Date('2024-03-15T09:30:00Z')); // true
contains(slot, new Date('2024-03-15T10:00:00Z')); // false (end is exclusive)`}
          />
        </FunctionCard>

        <FunctionCard
          id="mergeSlots"
          signature="mergeSlots(slots: Timeslot[]): Timeslot[]"
          description="Sorts slots by start time and merges any overlapping or adjacent slots into continuous blocks. Merged slots do not carry metadata from the originals."
        >
          <CodeSnippet
            code={`import { mergeSlots, createTimeslot } from 'timeslottr';

const slots = [
  createTimeslot(new Date('2024-03-15T09:00:00Z'), new Date('2024-03-15T10:00:00Z')),
  createTimeslot(new Date('2024-03-15T09:30:00Z'), new Date('2024-03-15T11:00:00Z')),
  createTimeslot(new Date('2024-03-15T13:00:00Z'), new Date('2024-03-15T14:00:00Z')),
];

const merged = mergeSlots(slots);
// [
//   { start: 09:00, end: 11:00 },  // first two merged
//   { start: 13:00, end: 14:00 },  // standalone
// ]`}
          />
        </FunctionCard>

        <FunctionCard
          id="findGaps"
          signature="findGaps(slots: Timeslot[], range: { start: Date; end: Date }): Timeslot[]"
          description="Finds free/unbooked time periods within a range, given a list of booked slots. Useful for discovering available scheduling windows."
        >
          <CodeSnippet
            code={`import { findGaps, createTimeslot } from 'timeslottr';

const booked = [
  createTimeslot(new Date('2024-03-15T09:00:00Z'), new Date('2024-03-15T10:00:00Z')),
  createTimeslot(new Date('2024-03-15T11:00:00Z'), new Date('2024-03-15T12:00:00Z')),
];

const gaps = findGaps(booked, {
  start: new Date('2024-03-15T08:00:00Z'),
  end:   new Date('2024-03-15T13:00:00Z'),
});
// [
//   { start: 08:00, end: 09:00 },
//   { start: 10:00, end: 11:00 },
//   { start: 12:00, end: 13:00 },
// ]`}
          />
        </FunctionCard>

        <FunctionCard
          id="timeslotToJSON"
          signature="timeslotToJSON(slot: Timeslot): TimeslotJSON"
          description="Converts a Timeslot to a JSON-safe object with ISO 8601 string dates. Preserves metadata if present."
        >
          <CodeSnippet
            code={`import { timeslotToJSON } from 'timeslottr';

const json = timeslotToJSON(slot);
// { start: "2024-03-15T09:00:00.000Z", end: "2024-03-15T09:30:00.000Z", metadata: { ... } }`}
          />
        </FunctionCard>

        <FunctionCard
          id="timeslotFromJSON"
          signature="timeslotFromJSON(json: TimeslotJSON): Timeslot"
          description="Parses a TimeslotJSON object back into a Timeslot with proper Date instances. Validates dates and the start < end constraint."
        >
          <CodeSnippet
            code={`import { timeslotFromJSON } from 'timeslottr';

const slot = timeslotFromJSON({
  start: "2024-03-15T09:00:00.000Z",
  end: "2024-03-15T09:30:00.000Z",
  metadata: { index: 0, durationMinutes: 30 }
});
// { start: Date, end: Date, metadata: { index: 0, durationMinutes: 30 } }`}
          />
        </FunctionCard>
      </div>

      {/* --- Configuration --- */}
      <div className="space-y-6">
        <SectionHeading id="config">Configuration</SectionHeading>
        <p className="text-muted-foreground text-sm">
          Options for <InlineCode>generateTimeslots()</InlineCode>. All options
          except <InlineCode>range</InlineCode> and{" "}
          <InlineCode>slotDurationMinutes</InlineCode> are optional.
        </p>

        <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-muted/10">
                <th className="p-4 text-sm font-semibold">Option</th>
                <th className="p-4 text-sm font-semibold">Type</th>
                <th className="p-4 text-sm font-semibold text-center">
                  Default
                </th>
                <th className="p-4 text-sm font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <ParamRow name="range" type="TimeslotRangeInput" required>
                Start and end boundaries for slot generation. Accepts Date
                objects, ISO strings, or time-only strings like{" "}
                <InlineCode>&quot;09:00&quot;</InlineCode>.
              </ParamRow>
              <ParamRow
                name="slotDurationMinutes"
                type="number"
                required
              >
                Length of each slot in minutes. Must be a positive number.
              </ParamRow>
              <ParamRow name="day" type="Date | string">
                Calendar date to anchor time-only boundaries. For example,{" "}
                <InlineCode>day: &apos;2024-03-15&apos;</InlineCode> with{" "}
                <InlineCode>range: &#123; start: &apos;09:00&apos;, end: &apos;17:00&apos; &#125;</InlineCode>.
              </ParamRow>
              <ParamRow
                name="slotIntervalMinutes"
                type="number"
                defaultVal="slotDurationMinutes"
              >
                Step size (in minutes) between the start of consecutive slots.
                Set lower than <InlineCode>slotDurationMinutes</InlineCode> to
                create overlapping slots.
              </ParamRow>
              <ParamRow
                name="bufferBeforeMinutes"
                type="number"
                defaultVal="0"
              >
                Minutes trimmed from the start of the usable window before
                generating slots.
              </ParamRow>
              <ParamRow
                name="bufferAfterMinutes"
                type="number"
                defaultVal="0"
              >
                Minutes trimmed from the end of the usable window before
                generating slots.
              </ParamRow>
              <ParamRow
                name="excludedWindows"
                type="TimeslotRangeInput[]"
              >
                Sub-ranges to exclude from slot generation (e.g., lunch breaks,
                blackout periods). Overlapping exclusions are automatically
                merged.
              </ParamRow>
              <ParamRow name="timezone" type="string">
                IANA timezone identifier (e.g.,{" "}
                <InlineCode>&quot;America/New_York&quot;</InlineCode>,{" "}
                <InlineCode>&quot;Europe/London&quot;</InlineCode>,{" "}
                <InlineCode>&quot;UTC&quot;</InlineCode>). Controls how
                time-only strings are interpreted.
              </ParamRow>
              <ParamRow
                name="alignment"
                type="'start' | 'end' | 'center'"
                defaultVal="'start'"
              >
                How to handle leftover time that doesn&apos;t fill a complete slot.{" "}
                <InlineCode>&apos;start&apos;</InlineCode> discards at the end,{" "}
                <InlineCode>&apos;end&apos;</InlineCode> aligns slots backward from
                the range end, <InlineCode>&apos;center&apos;</InlineCode> distributes
                leftover evenly on both sides.
              </ParamRow>
              <ParamRow
                name="minimumSlotDurationMinutes"
                type="number"
                defaultVal="slotDurationMinutes"
              >
                Minimum duration (in minutes) for partial/edge slots. Only
                relevant when <InlineCode>includeEdge</InlineCode> is{" "}
                <InlineCode>true</InlineCode>.
              </ParamRow>
              <ParamRow
                name="includeEdge"
                type="boolean"
                defaultVal="true"
              >
                Whether to include truncated edge slots (those cut short by the
                range boundary or exclusions) if they meet the minimum duration.
              </ParamRow>
              <ParamRow name="maxSlots" type="number">
                Hard limit on the number of slots generated. Generation stops
                once this count is reached.
              </ParamRow>
              <ParamRow name="labelFormatter" type="(slot, index, durationMinutes) => string">
                Callback to attach a custom label string to each slot&apos;s
                metadata. Return <InlineCode>undefined</InlineCode> to skip.
              </ParamRow>
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          <h4 className="text-base font-semibold">
            Additional <InlineCode>DailyTimeslotConfig</InlineCode> options
          </h4>
          <p className="text-sm text-muted-foreground">
            <InlineCode>generateDailyTimeslots()</InlineCode> accepts all of
            the above options (except <InlineCode>day</InlineCode>, which is
            set automatically per day), plus:
          </p>
          <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-muted/10">
                  <th className="p-4 text-sm font-semibold">Option</th>
                  <th className="p-4 text-sm font-semibold">Type</th>
                  <th className="p-4 text-sm font-semibold text-center">
                    Default
                  </th>
                  <th className="p-4 text-sm font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                <ParamRow
                  name="range"
                  type="TimeslotRangeInput | Map<Weekday, ...>"
                  required
                >
                  Either a single time range applied to every day, or a{" "}
                  <InlineCode>Map&lt;Weekday, TimeslotRangeInput | null&gt;</InlineCode>{" "}
                  for per-weekday schedules. Weekdays not in the Map are skipped.
                </ParamRow>
                <ParamRow
                  name="maxDays"
                  type="number"
                  defaultVal="10000"
                >
                  Safety limit on the number of calendar days to iterate.
                  Prevents runaway loops for large date ranges.
                </ParamRow>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- Types --- */}
      <div className="space-y-6">
        <SectionHeading id="types">Types</SectionHeading>

        <div className="space-y-6">
          <div>
            <h4 className="text-base font-semibold mb-2">Timeslot</h4>
            <p className="text-sm text-muted-foreground mb-3">
              The core output type. Start is inclusive, end is exclusive (half-open interval).
            </p>
            <CodeSnippet
              code={`interface Timeslot {
  start: Date;              // inclusive
  end: Date;                // exclusive
  metadata?: {
    index: number;          // 0-based slot index
    durationMinutes: number;
    label?: string;         // from labelFormatter
  };
}`}
            />
          </div>

          <div>
            <h4 className="text-base font-semibold mb-2">TimeslotJSON</h4>
            <p className="text-sm text-muted-foreground mb-3">
              JSON-safe version with ISO string dates. Used with{" "}
              <InlineCode>timeslotToJSON()</InlineCode> and{" "}
              <InlineCode>timeslotFromJSON()</InlineCode>.
            </p>
            <CodeSnippet
              code={`interface TimeslotJSON {
  start: string;            // ISO 8601
  end: string;              // ISO 8601
  metadata?: {
    index: number;
    durationMinutes: number;
    label?: string;
  };
}`}
            />
          </div>

          <div>
            <h4 className="text-base font-semibold mb-2">
              TimeslotBoundaryInput
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Flexible input type for time boundaries. Supports multiple formats:
            </p>
            <CodeSnippet
              code={`type TimeslotBoundaryInput =
  | Date                           // JavaScript Date object
  | string                         // ISO string or time-only ("09:00", "17:30")
  | { date?: Date | string;        // optional date anchor
      time: string | {             // time component
        hour: number;
        minute?: number;
        second?: number;
      };
    };`}
            />
          </div>

          <div>
            <h4 className="text-base font-semibold mb-2">
              TimeslotRangeInput
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              A start/end pair of boundaries:
            </p>
            <CodeSnippet
              code={`interface TimeslotRangeInput {
  start: TimeslotBoundaryInput;
  end: TimeslotBoundaryInput;
}`}
            />
          </div>

          <div>
            <h4 className="text-base font-semibold mb-2">
              AlignmentStrategy
            </h4>
            <CodeSnippet
              code={`type AlignmentStrategy = 'start' | 'end' | 'center';`}
            />
          </div>
        </div>
      </div>

      {/* --- Weekday Enum --- */}
      <div className="space-y-6">
        <SectionHeading id="weekday">Weekday Enum</SectionHeading>
        <p className="text-sm text-muted-foreground">
          Maps to JavaScript&apos;s <InlineCode>Date.getDay()</InlineCode> values
          (Sunday = 0).
        </p>
        <CodeSnippet
          code={`import { Weekday } from 'timeslottr';

Weekday.SUN  // 0
Weekday.MON  // 1
Weekday.TUE  // 2
Weekday.WED  // 3
Weekday.THU  // 4
Weekday.FRI  // 5
Weekday.SAT  // 6`}
        />
      </div>
    </div>
  );
}
