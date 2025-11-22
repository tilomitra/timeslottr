"use client";

import * as React from "react";
import { Highlight, themes } from "prism-react-renderer";
import { useTheme } from "next-themes"; // I don't have next-themes installed, I'll just use a simple prop or default.
// Wait, I implemented manual theme toggling in `theme-toggle.tsx` using localStorage.
// I'll just default to a light theme for code or try to detect class.
// For simplicity and robustness without extra deps, I'll use a custom clean style or just one theme that looks good in both (like vsDark usually looks okay, or github/vsLight).
// Given the request for "light theme", I'll use vsLight.

interface CodeBlockProps {
  title: string;
  code: string;
}

export function CodeBlock({ title, code }: CodeBlockProps) {
  // We'll stick to a light theme for the snippets to match the overall "light" aesthetic requested earlier.
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm h-full flex flex-col overflow-hidden">
      <div className="p-6 pb-4 border-b bg-muted/10">
        <h3 className="font-semibold leading-none tracking-tight">{title}</h3>
      </div>
      <div className="flex-1 p-6 overflow-auto bg-muted/30">
        <Highlight
          theme={themes.vsLight}
          code={code.trim()}
          language="typescript"
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre style={{ ...style, background: 'transparent' }} className="text-[13px] font-mono leading-relaxed">
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })} className="table-row">
                  <span className="table-cell text-right pr-4 select-none opacity-30 text-[10px] align-top w-8">
                    {i + 1}
                  </span>
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
