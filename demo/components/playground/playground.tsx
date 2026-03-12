"use client";

import * as React from "react";
import {
  generateTimeslots,
  generateDailyTimeslots,
  Weekday,
  type TimeslotGenerationConfig,
  type DailyTimeslotConfig,
  type WeekdayTimeslotRangeInput,
  type TimeslotRangeInput,
} from "timeslottr";
import { ConfigForm } from "./config-form";
import { Visualizer } from "./visualizer";
import { JsonOutput } from "./json-output";

export type ScheduleMode = "single" | "multi";

export interface WeekdayRange {
  enabled: boolean;
  start: string;
  end: string;
}

export type WeekdayRanges = Record<number, WeekdayRange>;

const DEFAULT_WEEKDAY_RANGES: WeekdayRanges = {
  [Weekday.SUN]: { enabled: false, start: "09:00", end: "17:00" },
  [Weekday.MON]: { enabled: true, start: "09:00", end: "17:00" },
  [Weekday.TUE]: { enabled: true, start: "09:00", end: "17:00" },
  [Weekday.WED]: { enabled: true, start: "09:00", end: "17:00" },
  [Weekday.THU]: { enabled: true, start: "09:00", end: "17:00" },
  [Weekday.FRI]: { enabled: true, start: "09:00", end: "17:00" },
  [Weekday.SAT]: { enabled: false, start: "09:00", end: "17:00" },
};

function getNextWeekday(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function Playground() {
  const today = new Date();
  const [mode, setMode] = React.useState<ScheduleMode>("single");

  const [singleConfig, setSingleConfig] = React.useState<TimeslotGenerationConfig>({
    day: today.toISOString().split("T")[0],
    range: { start: "09:00", end: "17:00" },
    slotDurationMinutes: 30,
    slotIntervalMinutes: undefined,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 0,
    minimumSlotDurationMinutes: undefined,
    maxSlots: undefined,
    alignment: "start",
    includeEdge: true,
    excludedWindows: [],
  });

  const [multiPeriod, setMultiPeriod] = React.useState({
    start: today.toISOString().split("T")[0],
    end: getNextWeekday(today, 7),
  });

  const [weekdayRanges, setWeekdayRanges] = React.useState<WeekdayRanges>(DEFAULT_WEEKDAY_RANGES);

  const [multiConfig, setMultiConfig] = React.useState({
    slotDurationMinutes: 60,
    slotIntervalMinutes: undefined as number | undefined,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 0,
    timezone: "" as string | undefined,
    alignment: "start" as "start" | "center" | "end",
    includeEdge: true,
    excludedWindows: [] as TimeslotRangeInput[],
  });

  const [slots, setSlots] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      if (mode === "single") {
        if (!singleConfig.day || !singleConfig.range?.start || !singleConfig.range?.end || !singleConfig.slotDurationMinutes) {
          return;
        }
        const safeConfig = { ...singleConfig };
        if (!safeConfig.timezone) delete safeConfig.timezone;
        const generated = generateTimeslots(safeConfig);
        setSlots(generated);
      } else {
        if (!multiPeriod.start || !multiPeriod.end || !multiConfig.slotDurationMinutes) {
          return;
        }

        const rangeMap: WeekdayTimeslotRangeInput = new Map();
        for (const [day, range] of Object.entries(weekdayRanges)) {
          if (range.enabled) {
            rangeMap.set(Number(day) as Weekday, { start: range.start, end: range.end });
          }
        }

        if (rangeMap.size === 0) {
          setSlots([]);
          setError(null);
          return;
        }

        const config: DailyTimeslotConfig = {
          range: rangeMap,
          slotDurationMinutes: multiConfig.slotDurationMinutes,
          slotIntervalMinutes: multiConfig.slotIntervalMinutes,
          bufferBeforeMinutes: multiConfig.bufferBeforeMinutes,
          bufferAfterMinutes: multiConfig.bufferAfterMinutes,
          alignment: multiConfig.alignment,
          includeEdge: multiConfig.includeEdge,
          excludedWindows: multiConfig.excludedWindows,
        };
        if (multiConfig.timezone) config.timezone = multiConfig.timezone;

        const generated = generateDailyTimeslots(
          { start: multiPeriod.start, end: multiPeriod.end },
          config
        );
        setSlots(generated);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setSlots([]);
      setError(err instanceof Error ? err.message : "An error occurred generating timeslots");
    }
  }, [mode, singleConfig, multiPeriod, weekdayRanges, multiConfig]);

  const timezone = mode === "single" ? singleConfig.timezone : multiConfig.timezone;

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr,1.5fr] items-start">
      <div className="space-y-6">
        <ConfigForm
          mode={mode}
          onModeChange={setMode}
          singleConfig={singleConfig}
          onSingleConfigChange={setSingleConfig}
          multiPeriod={multiPeriod}
          onMultiPeriodChange={setMultiPeriod}
          weekdayRanges={weekdayRanges}
          onWeekdayRangesChange={setWeekdayRanges}
          multiConfig={multiConfig}
          onMultiConfigChange={setMultiConfig}
        />
      </div>
      <div className="space-y-8">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
             <div className="flex flex-col space-y-1.5 p-6 pb-4 border-b">
                <h3 className="font-semibold leading-none tracking-tight">Generated Slots</h3>
                <p className="text-sm text-muted-foreground">
                  {slots.length > 0
                    ? `${slots.length} slot${slots.length !== 1 ? "s" : ""} generated.`
                    : "Preview of the time slots based on your configuration."}
                </p>
             </div>
             <div className="p-6 pt-4">
                 {error ? (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : (
                  <Visualizer slots={slots} timezone={timezone} />
                )}
             </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6 pb-4 border-b">
                <h3 className="font-semibold leading-none tracking-tight">JSON Output</h3>
                <p className="text-sm text-muted-foreground">The raw data generated by the library.</p>
            </div>
             <div className="p-0">
                <JsonOutput data={slots} />
             </div>
        </div>
      </div>
    </div>
  );
}
