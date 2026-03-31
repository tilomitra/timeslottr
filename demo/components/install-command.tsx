"use client";

import * as React from "react";
import { Terminal, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstallCommandProps {
  command?: string;
  className?: string;
}

export function InstallCommand({ command = "npm install timeslottr", className }: InstallCommandProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "group flex items-center space-x-2 rounded-lg bg-foreground px-6 py-3 font-mono text-sm text-background transition-all hover:opacity-90 active:opacity-80 shadow-md",
        className
      )}
      title="Click to copy"
    >
      <Terminal className="h-4 w-4 opacity-60" />
      <span>{command}</span>
      <div className="ml-2 flex h-4 w-4 items-center justify-center">
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-400" />
        ) : (
          <Copy className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
        )}
      </div>
    </button>
  );
}
