"use client";

import * as React from "react";

interface VisualizerProps {
  slots: any[];
  timezone?: string;
}

export function Visualizer({ slots, timezone }: VisualizerProps) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone || undefined,
  });

  if (slots.length === 0) {
      return <div className="text-sm text-muted-foreground">No slots to display.</div>
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
                        {formatter.format(slot.start)} – {formatter.format(slot.end)}
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
