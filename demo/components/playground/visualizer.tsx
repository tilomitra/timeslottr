"use client";

import * as React from "react";

interface VisualizerProps {
  slots: any[];
  timezone?: string;
}

export function Visualizer({ slots, timezone }: VisualizerProps) {
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone || undefined,
  });

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: timezone || undefined,
  });

  if (slots.length === 0) {
      return <div className="text-sm text-muted-foreground">No slots to display.</div>
  }

  // Check if slots span multiple days
  const firstDate = slots[0]?.start ? dateFormatter.format(slots[0].start) : "";
  const lastDate = slots[slots.length - 1]?.start ? dateFormatter.format(slots[slots.length - 1].start) : "";
  const isMultiDay = firstDate !== lastDate;

  // Group slots by date for multi-day display
  if (isMultiDay) {
    const grouped: Record<string, any[]> = {};
    for (const slot of slots) {
      const dateKey = dateFormatter.format(slot.start);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(slot);
    }

    return (
      <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4">
        {Object.entries(grouped).map(([date, daySlots]) => (
          <div key={date}>
            <div className="text-xs font-medium text-muted-foreground mb-2 sticky top-0 bg-card py-1">
              {date}
            </div>
            <div className="space-y-1.5">
              {daySlots.map((slot: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border bg-background px-4 py-2 text-sm transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-xs text-muted-foreground opacity-50 w-6">
                      #{slot.metadata?.index != null ? slot.metadata.index + 1 : i + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {timeFormatter.format(slot.start)} – {timeFormatter.format(slot.end)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {slot.metadata?.durationMinutes} min
                      </span>
                    </div>
                  </div>
                  {slot.metadata?.label && (
                    <div className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                      {slot.metadata.label}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative space-y-2">
        <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2">
        {slots.map((slot, i) => (
            <div
            key={i}
            className="flex items-center justify-between rounded-md border bg-background px-4 py-3 text-sm transition-colors hover:bg-accent/50"
            >
            <div className="flex items-center gap-4">
                <div className="font-mono text-xs text-muted-foreground opacity-50 w-6">
                #{i + 1}
                </div>
                <div className="flex flex-col">
                    <span className="font-medium">
                        {timeFormatter.format(slot.start)} – {timeFormatter.format(slot.end)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {slot.metadata?.durationMinutes} min
                    </span>
                </div>
            </div>
            {slot.metadata?.label && (
                <div className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                    {slot.metadata.label}
                </div>
            )}
            </div>
        ))}
        </div>
    </div>
  );
}
