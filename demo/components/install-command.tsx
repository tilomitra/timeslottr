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
        "group flex items-center space-x-2 rounded-full border bg-muted/50 px-6 py-2 font-mono text-base text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted/80",
        className
      )}
      title="Click to copy"
    >
      <Terminal className="h-5 w-5" />
      <span>{command}</span>
      <div className="ml-2 flex h-5 w-5 items-center justify-center">
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-50" />
        )}
      </div>
    </button>
  );
}
