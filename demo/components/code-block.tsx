"use client";

import * as React from "react";
import { Highlight, themes } from "prism-react-renderer";

interface CodeBlockProps {
  title: string;
  code: string;
}

export function CodeBlock({ title, code }: CodeBlockProps) {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const html = document.documentElement;
    const update = () => setIsDark(html.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="rounded-xl border bg-card text-card-foreground h-full flex flex-col overflow-hidden">
      <div className="px-5 py-3 border-b bg-muted/30">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      </div>
      <div className="flex-1 p-5 overflow-auto">
        <Highlight
          theme={isDark ? themes.vsDark : themes.vsLight}
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
