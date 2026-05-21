import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { ChevronRight } from "lucide-react";
import type { SolveResponse } from "@/lib/solve-schema";

interface SolveStepsProps {
  steps: SolveResponse["steps"];
}

export function SolveSteps({ steps }: SolveStepsProps) {
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([0]));

  const toggle = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      return next;
    });
  };

  return (
    <div className="space-y-1.5">
      {steps.map((step, i) => {
        const isOpen = expanded.has(i);
        return (
          <div
            key={i}
            className="bg-card border border-border rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggle(i)}
              className={[
                "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
                isOpen
                  ? "bg-surface-elevated"
                  : "hover:bg-surface-elevated/60",
              ].join(" ")}
            >
              <span
                className={[
                  "w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center shrink-0",
                  isOpen ? "bg-pink text-white" : "bg-pink/15 text-pink",
                ].join(" ")}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-xs font-medium truncate">
                {step.title}
              </span>
              <ChevronRight
                className={[
                  "w-3.5 h-3.5 text-muted-foreground transition-transform duration-150",
                  isOpen ? "rotate-90" : "",
                ].join(" ")}
              />
            </button>
            <div
              className={[
                "overflow-hidden transition-[max-height] duration-200 ease-out",
                isOpen ? "max-h-[600px]" : "max-h-0",
              ].join(" ")}
            >
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
