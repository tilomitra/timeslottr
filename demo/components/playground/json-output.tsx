"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { Highlight, themes } from "prism-react-renderer";

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
    <div className="relative rounded-b-xl overflow-hidden">
      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8 z-10 bg-background/80 backdrop-blur"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      </Button>
      <div className="h-[300px] w-full overflow-auto bg-muted/30 p-4">
        <Highlight
            theme={themes.vsLight}
            code={jsonString}
            language="json"
        >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre style={{ ...style, background: 'transparent' }} className="text-[13px] font-mono leading-relaxed">
                {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })} className="table-row">
                    <span className="table-cell">
                    {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                    ))}
                    </span>
                </div>
                ))}
            </pre>
            )}
        </Highlight>
      </div>
    </div>
  );
}
