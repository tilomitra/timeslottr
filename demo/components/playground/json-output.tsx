"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface JsonOutputProps {
  data: any;
}

export function JsonOutput({ data }: JsonOutputProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const jsonString = React.useMemo(() => {
      return JSON.stringify(data, (key, value) => {
          return value;
      }, 2);
  }, [data]);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8 z-10 bg-background/80 backdrop-blur"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      </Button>
      <pre className="h-[300px] w-full overflow-auto border-none bg-muted/30 p-4 text-xs font-mono rounded-b-xl">
        {jsonString}
      </pre>>
    </div>
  );
}
