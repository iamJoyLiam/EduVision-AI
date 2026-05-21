import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import type { SolveResponse } from "@/lib/solve-schema";

interface SolveStepsProps {
  steps: SolveResponse["steps"];
}

export function SolveSteps({ steps }: SolveStepsProps) {
  return (
    <div className="space-y-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
        分步解析
      </div>
      {steps.map((step, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-xl p-4 space-y-2"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-pink/15 text-pink text-xs font-semibold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <h3 className="text-sm font-semibold">{step.title}</h3>
          </div>
          <div className="pl-8 text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-code:text-[11px]">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {step.explanation}
            </ReactMarkdown>
          </div>
          {step.formula && (
            <div className="pl-8 mt-2">
              <div className="inline-block bg-pink/5 border border-pink/20 rounded-lg px-3 py-1.5 font-mono text-sm text-pink">
                {step.formula}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
