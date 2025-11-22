"use client";

import * as React from "react";
import { type TimeslotGenerationConfig } from "timeslottr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface ConfigFormProps {
  config: TimeslotGenerationConfig;
  onChange: (config: TimeslotGenerationConfig) => void;
}

export function ConfigForm({ config, onChange }: ConfigFormProps) {
  const handleChange = (key: keyof TimeslotGenerationConfig, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const handleRangeChange = (key: "start" | "end", value: string) => {
    onChange({
      ...config,
      range: { ...config.range, [key]: value } as any,
    });
  };

  const addExclusion = () => {
    onChange({
      ...config,
      excludedWindows: [...(config.excludedWindows || []), { start: "12:00", end: "13:00" }],
    });
  };

  const removeExclusion = (index: number) => {
    const newExclusions = [...(config.excludedWindows || [])];
    newExclusions.splice(index, 1);
    onChange({ ...config, excludedWindows: newExclusions });
  };

  const updateExclusion = (index: number, key: "start" | "end", value: string) => {
    const newExclusions = [...(config.excludedWindows || [])];
    newExclusions[index] = { ...newExclusions[index], [key]: value };
    onChange({ ...config, excludedWindows: newExclusions });
  };

  return (
    <div className="space-y-6">
       <div>
          <h3 className="font-semibold leading-none tracking-tight mb-2">Configuration</h3>
          <p className="text-sm text-muted-foreground">Adjust the settings to customize slot generation.</p>
       </div>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="day">Day</Label>
          <Input
            id="day"
            type="date"
            value={config.day as string}
            onChange={(e) => handleChange("day", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            placeholder="e.g. America/New_York"
            value={config.timezone || ""}
            onChange={(e) => handleChange("timezone", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="start">Start Time</Label>
            <Input
              id="start"
              type="time"
              value={config.range?.start as string}
              onChange={(e) => handleRangeChange("start", e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="end">End Time</Label>
            <Input
              id="end"
              type="time"
              value={config.range?.end as string}
              onChange={(e) => handleRangeChange("end", e.target.value)}
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
              value={config.slotDurationMinutes}
              onChange={(e) => handleChange("slotDurationMinutes", parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="interval">Interval (min)</Label>
            <Input
              id="interval"
              type="number"
              min="1"
              placeholder="Optional"
              value={config.slotIntervalMinutes || ""}
              onChange={(e) => handleChange("slotIntervalMinutes", e.target.value ? parseInt(e.target.value) : undefined)}
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
              value={config.bufferBeforeMinutes || 0}
              onChange={(e) => handleChange("bufferBeforeMinutes", parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bufferAfter">Buffer After (min)</Label>
            <Input
              id="bufferAfter"
              type="number"
              min="0"
              value={config.bufferAfterMinutes || 0}
              onChange={(e) => handleChange("bufferAfterMinutes", parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="grid gap-2">
            <Label htmlFor="alignment">Alignment</Label>
            <Select
                id="alignment"
                value={config.alignment || "start"}
                onChange={(e) => handleChange("alignment", e.target.value)}
            >
                <option value="start">Start</option>
                <option value="center">Center</option>
                <option value="end">End</option>
            </Select>
        </div>

        <div className="flex items-center gap-2">
            <Checkbox
                id="includeEdge"
                checked={config.includeEdge}
                onChange={(e) => handleChange("includeEdge", e.target.checked)}
            />
            <Label htmlFor="includeEdge" className="font-normal">Include edge slots</Label>
        </div>

        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label>Exclusions</Label>
                <Button variant="outline" size="sm" onClick={addExclusion} type="button">
                    <Plus className="mr-2 h-3 w-3" />
                    Add
                </Button>
            </div>
            <div className="space-y-2">
                {config.excludedWindows?.map((ex, i) => (
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
                {(!config.excludedWindows || config.excludedWindows.length === 0) && (
                    <p className="text-xs text-muted-foreground">No excluded windows defined.</p>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}
