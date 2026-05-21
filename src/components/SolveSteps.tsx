import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { ChevronDown } from "lucide-react";
import type { SolveResponse } from "@/lib/solve-schema";

interface SolveStepsProps {
  steps: SolveResponse["steps"];
}

export function SolveSteps({ steps }: SolveStepsProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(
    steps.length > 0 ? 0 : null,
  );

  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const expanded = expandedIdx === i;
        return (
          <div
            key={i}
            className="bg-card border border-border rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setExpandedIdx(expanded ? null : i)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-surface-elevated transition-colors"
            >
              <span className="w-5 h-5 rounded-full bg-pink/15 text-pink text-[10px] font-semibold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 text-xs font-medium truncate">
                {step.title}
              </span>
              <ChevronDown
                className={[
                  "w-3.5 h-3.5 text-muted-foreground transition-transform",
                  expanded ? "rotate-180" : "",
                ].join(" ")}
              />
            </button>
            {expanded && (
              <div className="px-3 pb-3 border-t border-border pt-2">
                <div className="text-xs leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-code:text-[10px]">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {step.explanation}
                  </ReactMarkdown>
                </div>
                {step.formula && (
                  <div className="mt-2 inline-block bg-pink/5 border border-pink/20 rounded-md px-2 py-1 font-mono text-[11px] text-pink">
                    {step.formula}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
