"use client";

import * as React from "react";
import { Weekday, type TimeslotGenerationConfig, type TimeslotRangeInput } from "timeslottr";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { ScheduleMode, WeekdayRanges } from "./playground";

const WEEKDAY_LABELS: Record<number, string> = {
  [Weekday.SUN]: "Sun",
  [Weekday.MON]: "Mon",
  [Weekday.TUE]: "Tue",
  [Weekday.WED]: "Wed",
  [Weekday.THU]: "Thu",
  [Weekday.FRI]: "Fri",
  [Weekday.SAT]: "Sat",
};

interface ConfigFormProps {
  mode: ScheduleMode;
  onModeChange: (mode: ScheduleMode) => void;
  singleConfig: TimeslotGenerationConfig;
  onSingleConfigChange: (config: TimeslotGenerationConfig) => void;
  multiPeriod: { start: string; end: string };
  onMultiPeriodChange: (period: { start: string; end: string }) => void;
  weekdayRanges: WeekdayRanges;
  onWeekdayRangesChange: (ranges: WeekdayRanges) => void;
  multiConfig: {
    slotDurationMinutes: number;
    slotIntervalMinutes: number | undefined;
    bufferBeforeMinutes: number;
    bufferAfterMinutes: number;
    timezone: string | undefined;
    alignment: "start" | "center" | "end";
    includeEdge: boolean;
    excludedWindows: TimeslotRangeInput[];
  };
  onMultiConfigChange: (config: ConfigFormProps["multiConfig"]) => void;
}

export function ConfigForm({
  mode,
  onModeChange,
  singleConfig,
  onSingleConfigChange,
  multiPeriod,
  onMultiPeriodChange,
  weekdayRanges,
  onWeekdayRangesChange,
  multiConfig,
  onMultiConfigChange,
}: ConfigFormProps) {
  // Single-day handlers
  const handleSingleChange = (key: keyof TimeslotGenerationConfig, value: any) => {
    onSingleConfigChange({ ...singleConfig, [key]: value });
  };

  const handleSingleRangeChange = (key: "start" | "end", value: string) => {
    onSingleConfigChange({
      ...singleConfig,
      range: { ...singleConfig.range, [key]: value } as any,
    });
  };

  // Multi-day handlers
  const handleMultiChange = (key: string, value: any) => {
    onMultiConfigChange({ ...multiConfig, [key]: value });
  };

  const handleWeekdayToggle = (day: number) => {
    onWeekdayRangesChange({
      ...weekdayRanges,
      [day]: { ...weekdayRanges[day], enabled: !weekdayRanges[day].enabled },
    });
  };

  const handleWeekdayTimeChange = (day: number, key: "start" | "end", value: string) => {
    onWeekdayRangesChange({
      ...weekdayRanges,
      [day]: { ...weekdayRanges[day], [key]: value },
    });
  };

  // Shared exclusion handlers
  const getExclusions = () =>
    mode === "single" ? singleConfig.excludedWindows || [] : multiConfig.excludedWindows || [];

  const setExclusions = (exclusions: TimeslotRangeInput[]) => {
    if (mode === "single") {
      onSingleConfigChange({ ...singleConfig, excludedWindows: exclusions });
    } else {
      onMultiConfigChange({ ...multiConfig, excludedWindows: exclusions });
    }
  };

  const addExclusion = () => {
    setExclusions([...getExclusions(), { start: "12:00", end: "13:00" }]);
  };

  const removeExclusion = (index: number) => {
    const updated = [...getExclusions()];
    updated.splice(index, 1);
    setExclusions(updated);
  };

  const updateExclusion = (index: number, key: "start" | "end", value: string) => {
    const updated = [...getExclusions()];
    updated[index] = { ...updated[index], [key]: value };
    setExclusions(updated);
  };

  const exclusions = getExclusions();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold leading-none tracking-tight mb-2">Configuration</h3>
        <p className="text-sm text-muted-foreground">Adjust the settings to customize slot generation.</p>
      </div>

      {/* Mode toggle */}
      <div className="grid gap-2">
        <Label>Schedule Mode</Label>
        <div className="flex rounded-md border border-input overflow-hidden">
          <button
            type="button"
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              mode === "single"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-accent"
            }`}
            onClick={() => onModeChange("single")}
          >
            Single Day
          </button>
          <button
            type="button"
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-l border-input ${
              mode === "multi"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-accent"
            }`}
            onClick={() => onModeChange("multi")}
          >
            Multi-Day
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {mode === "single" ? (
          <>
            {/* Single day fields */}
            <div className="grid gap-2">
              <Label htmlFor="day">Day</Label>
              <Input
                id="day"
                type="date"
                value={singleConfig.day as string}
                onChange={(e) => handleSingleChange("day", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                placeholder="e.g. America/New_York"
                value={singleConfig.timezone || ""}
                onChange={(e) => handleSingleChange("timezone", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start">Start Time</Label>
                <Input
                  id="start"
                  type="time"
                  value={singleConfig.range?.start as string}
                  onChange={(e) => handleSingleRangeChange("start", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end">End Time</Label>
                <Input
                  id="end"
                  type="time"
                  value={singleConfig.range?.end as string}
                  onChange={(e) => handleSingleRangeChange("end", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Slot Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={singleConfig.slotDurationMinutes}
                  onChange={(e) => handleSingleChange("slotDurationMinutes", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="interval">Interval (min)</Label>
                <Input
                  id="interval"
                  type="number"
                  min="1"
                  placeholder="Optional"
                  value={singleConfig.slotIntervalMinutes || ""}
                  onChange={(e) => handleSingleChange("slotIntervalMinutes", e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bufferBefore">Buffer Before (min)</Label>
                <Input
                  id="bufferBefore"
                  type="number"
                  min="0"
                  value={singleConfig.bufferBeforeMinutes || 0}
                  onChange={(e) => handleSingleChange("bufferBeforeMinutes", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bufferAfter">Buffer After (min)</Label>
                <Input
                  id="bufferAfter"
                  type="number"
                  min="0"
                  value={singleConfig.bufferAfterMinutes || 0}
                  onChange={(e) => handleSingleChange("bufferAfterMinutes", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="alignment">Alignment</Label>
              <Select
                id="alignment"
                value={singleConfig.alignment || "start"}
                onChange={(e) => handleSingleChange("alignment", e.target.value)}
              >
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="includeEdge"
                checked={singleConfig.includeEdge}
                onChange={(e) => handleSingleChange("includeEdge", e.target.checked)}
              />
              <Label htmlFor="includeEdge" className="font-normal">Include edge slots</Label>
            </div>
          </>
        ) : (
          <>
            {/* Multi-day fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="periodStart">Start Date</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={multiPeriod.start}
                  onChange={(e) => onMultiPeriodChange({ ...multiPeriod, start: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="periodEnd">End Date</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={multiPeriod.end}
                  onChange={(e) => onMultiPeriodChange({ ...multiPeriod, end: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="multiTimezone">Timezone</Label>
              <Input
                id="multiTimezone"
                placeholder="e.g. America/New_York"
                value={multiConfig.timezone || ""}
                onChange={(e) => handleMultiChange("timezone", e.target.value)}
              />
            </div>

            {/* Weekday schedule */}
            <div className="space-y-3">
              <Label>Weekday Schedules</Label>
              <p className="text-xs text-muted-foreground">
                Enable days and set time ranges. Disabled days produce no slots.
              </p>
              <div className="space-y-2">
                {[Weekday.MON, Weekday.TUE, Weekday.WED, Weekday.THU, Weekday.FRI, Weekday.SAT, Weekday.SUN].map(
                  (day) => (
                    <div key={day} className="flex items-center gap-3">
                      <Checkbox
                        id={`weekday-${day}`}
                        checked={weekdayRanges[day].enabled}
                        onChange={() => handleWeekdayToggle(day)}
                      />
                      <Label
                        htmlFor={`weekday-${day}`}
                        className="font-normal w-8 text-sm"
                      >
                        {WEEKDAY_LABELS[day]}
                      </Label>
                      <Input
                        type="time"
                        value={weekdayRanges[day].start}
                        onChange={(e) => handleWeekdayTimeChange(day, "start", e.target.value)}
                        disabled={!weekdayRanges[day].enabled}
                        className="h-8 text-xs flex-1"
                      />
                      <span className="text-muted-foreground text-xs">to</span>
                      <Input
                        type="time"
                        value={weekdayRanges[day].end}
                        onChange={(e) => handleWeekdayTimeChange(day, "end", e.target.value)}
                        disabled={!weekdayRanges[day].enabled}
                        className="h-8 text-xs flex-1"
                      />
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="multiDuration">Slot Duration (min)</Label>
                <Input
                  id="multiDuration"
                  type="number"
                  min="1"
                  value={multiConfig.slotDurationMinutes}
                  onChange={(e) => handleMultiChange("slotDurationMinutes", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="multiInterval">Interval (min)</Label>
                <Input
                  id="multiInterval"
                  type="number"
                  min="1"
                  placeholder="Optional"
                  value={multiConfig.slotIntervalMinutes || ""}
                  onChange={(e) => handleMultiChange("slotIntervalMinutes", e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="multiBufferBefore">Buffer Before (min)</Label>
                <Input
                  id="multiBufferBefore"
                  type="number"
                  min="0"
                  value={multiConfig.bufferBeforeMinutes || 0}
                  onChange={(e) => handleMultiChange("bufferBeforeMinutes", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="multiBufferAfter">Buffer After (min)</Label>
                <Input
                  id="multiBufferAfter"
                  type="number"
                  min="0"
                  value={multiConfig.bufferAfterMinutes || 0}
                  onChange={(e) => handleMultiChange("bufferAfterMinutes", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="multiAlignment">Alignment</Label>
              <Select
                id="multiAlignment"
                value={multiConfig.alignment || "start"}
                onChange={(e) => handleMultiChange("alignment", e.target.value)}
              >
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="multiIncludeEdge"
                checked={multiConfig.includeEdge}
                onChange={(e) => handleMultiChange("includeEdge", e.target.checked)}
              />
              <Label htmlFor="multiIncludeEdge" className="font-normal">Include edge slots</Label>
            </div>
          </>
        )}

        {/* Shared exclusions section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Exclusions</Label>
            <Button variant="outline" size="sm" onClick={addExclusion} type="button">
              <Plus className="mr-2 h-3 w-3" />
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {exclusions.map((ex, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="time"
                  value={ex.start as string}
                  onChange={(e) => updateExclusion(i, "start", e.target.value)}
                  className="h-8 text-xs"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="time"
                  value={ex.end as string}
                  onChange={(e) => updateExclusion(i, "end", e.target.value)}
                  className="h-8 text-xs"
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeExclusion(i)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {exclusions.length === 0 && (
              <p className="text-xs text-muted-foreground">No excluded windows defined.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
