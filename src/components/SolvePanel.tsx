import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Send, Square, Loader2, AlertTriangle, ChevronRight, ChevronDown } from "lucide-react";
import { useSolveStore } from "@/lib/solve-store";
import { useAIStore } from "@/lib/ai-store";
import { streamChat } from "@/lib/ai-api";
import { SolveResponseSchema, type SolveResponse } from "@/lib/solve-schema";
import { SolveSteps } from "./SolveSteps";
import { DynamicCanvas } from "./DynamicCanvas";

export function SolvePanel() {
  const {
    sessions,
    activeSessionId,
    addSession,
    updateSession,
    isStreaming,
    setStreaming,
    streamingContent,
    setStreamingContent,
    currentSteps,
    currentVisualization,
    currentVariables,
    setCurrentVariables,
  } = useSolveStore();

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const { providers, activeProviderId } = useAIStore();

  const [input, setInput] = useState("");
  const [fallbackContent, setFallbackContent] = useState<string | null>(null);
  const [stepsOpen, setStepsOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isConfigured = providers.some((p) => p.hasApiKey);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;

    const sessionId = Date.now().toString();
    const newSession = {
      id: sessionId,
      title: text.slice(0, 30),
      originalPrompt: text,
      response: null as SolveResponse | null,
      createdAt: Date.now(),
      hasVisualization: false,
    };
    addSession(newSession);
    setInput("");
    setStreaming(true);
    setStreamingContent("");
    setFallbackContent(null);

    const systemMessage = {
      role: "system" as const,
      content: SOLVE_SYSTEM_PROMPT,
    };

    const allMessages = [
      systemMessage,
      { role: "user" as const, content: text },
    ];

    const controller = new AbortController();
    abortRef.current = controller;

    let fullContent = "";

    try {
      for await (const token of streamChat(
        activeProviderId,
        allMessages,
        controller.signal,
      )) {
        fullContent += token;
        setStreamingContent(fullContent);
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }

      // Try to extract and parse JSON from the response
      const parsed = extractAndParseJson(fullContent);
      if (parsed) {
        updateSession(sessionId, {
          response: parsed,
          hasVisualization: parsed.visualization !== null,
        });
        // Hydrate the store with the parsed response
        const viz = parsed.visualization;
        const vars: Record<string, number> = {};
        if (viz?.variables) {
          for (const v of viz.variables) {
            vars[v.name] = v.default;
          }
        }
        useSolveStore.setState({
          currentSteps: parsed.steps,
          currentVisualization: viz,
          currentVariables: vars,
        });
        setFallbackContent(null);
      } else {
        // JSON parsing failed — show raw content as fallback
        setFallbackContent(fullContent);
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        console.error("Solve error:", err);
      }
    } finally {
      setStreaming(false);
      setStreamingContent("");
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  if (!isConfigured) {
    return (
      <main className="flex-1 flex flex-col min-w-0 bg-background items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="text-sm mb-2">请先在设置中配置 AI 提供商</div>
        </div>
      </main>
    );
  }

  const displayContent = streamingContent;
  const hasResult = currentSteps.length > 0 && !isStreaming;
  const hasFallback = fallbackContent !== null && !isStreaming && !hasResult;

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-background">
      {/* Input area */}
      <div className="px-6 pt-4 pb-3 border-b border-border bg-surface">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            rows={2}
            placeholder="输入题目，例如：求二次函数 y = 2x² - 4x + 1 的顶点坐标和对称轴..."
            className="flex-1 resize-none text-sm rounded-lg bg-surface-elevated border border-border outline-none focus:ring-2 focus:ring-ring/40 px-3 py-2"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStop}
              className="h-10 w-10 shrink-0 rounded-lg bg-pink text-white flex items-center justify-center"
              aria-label="停止"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="h-10 w-10 shrink-0 rounded-lg bg-foreground text-background flex items-center justify-center disabled:opacity-40"
              aria-label="解题"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* Content area */}
      {isStreaming && displayContent && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
          <div className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            AI 正在解题...
          </div>
          <div className="prose prose-sm max-w-none text-sm leading-relaxed">
            <pre className="whitespace-pre-wrap text-xs text-muted-foreground bg-surface-elevated rounded-lg p-4 border border-border">
              {displayContent}
            </pre>
          </div>
        </div>
      )}

      {hasResult && (
        <div className="flex-1 flex min-h-0">
          {/* Left: canvas + summary */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Canvas */}
            <div className="flex-1 min-h-0 p-4">
              {currentVisualization ? (
                <DynamicCanvas
                  visualization={currentVisualization}
                  variables={currentVariables}
                  onVariablesChange={setCurrentVariables}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  本题无可视化内容
                </div>
              )}
            </div>

            {/* Summary panel — visible when steps sidebar is open */}
            {stepsOpen && activeSession && (
              <div className="shrink-0 border-t border-border bg-surface px-5 py-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                  题目
                </div>
                <div className="text-xs text-foreground leading-relaxed line-clamp-2">
                  {activeSession.originalPrompt}
                </div>
              </div>
            )}
          </div>

          {/* Right: collapsible steps sidebar */}
          <div
            className={[
              "shrink-0 border-l border-border bg-sidebar flex flex-col overflow-hidden transition-[width] duration-200 ease-out",
              stepsOpen ? "w-[360px]" : "w-10",
            ].join(" ")}
          >
            <button
              onClick={() => setStepsOpen((v) => !v)}
              className="shrink-0 h-10 px-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:bg-surface-elevated transition-colors border-b border-border"
            >
              {stepsOpen ? (
                <ChevronDown className="w-3.5 h-3.5 rotate-90" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              {stepsOpen && (
                <span className="font-semibold tracking-wide">分步解析</span>
              )}
            </button>
            {stepsOpen && (
              <div className="flex-1 overflow-y-auto p-4">
                <SolveSteps steps={currentSteps} />
              </div>
            )}
          </div>
        </div>
      )}

      {hasFallback && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.72_0.18_80)]" />
            AI 返回的内容无法解析为结构化数据，以下为原始回复
          </div>
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-pre:my-1 prose-pre:overflow-x-auto prose-headings:my-2 prose-code:text-[11px] bg-card border border-border rounded-xl p-5">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {fallbackContent}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {!isStreaming && !hasResult && !hasFallback && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          <div className="text-center">
            <div className="text-4xl mb-3 opacity-30">?</div>
            <div>输入题目开始 AI 解题</div>
            <div className="text-xs mt-1 opacity-60">
              支持数学、物理、化学题目
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/**
 * Try to extract a JSON object from AI response.
 * The JSON may be wrapped in ```json ... ``` code blocks.
 */
function extractAndParseJson(content: string): SolveResponse | null {
  // Try direct parse first
  const directTry = tryParse(content);
  if (directTry) return directTry;

  // Try extracting from code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    const blockTry = tryParse(codeBlockMatch[1]);
    if (blockTry) return blockTry;
  }

  // Try finding JSON object boundaries
  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const jsonStr = content.slice(firstBrace, lastBrace + 1);
    const braceTry = tryParse(jsonStr);
    if (braceTry) return braceTry;
  }

  return null;
}

function tryParse(str: string): SolveResponse | null {
  try {
    const data = JSON.parse(str.trim());
    const result = SolveResponseSchema.safeParse(data);
    if (result.success) return result.data;
  } catch {
    // ignore
  }
  return null;
}

const SOLVE_SYSTEM_PROMPT = `你是一个专业的数学、物理、化学解题AI助手。学生会给你一道题目，你需要：

1. 详细分步解答这道题
2. 如果题目涉及函数、几何坐标、不等式等可被几何具象化的题型，同时给出可视化配置

你必须严格按照以下JSON格式输出（不要输出任何其他内容）：

\`\`\`json
{
  "steps": [
    {
      "title": "步骤标题",
      "explanation": "详细讲解，支持Markdown和LaTeX公式（用$包裹行内公式，$$包裹行间公式）",
      "formula": "本步核心公式（可选）"
    }
  ],
  "visualization": {
    "type": "function",
    "expressions": [
      {
        "expr": "a * x^2 + b * x + c",
        "label": "f(x)",
        "color": "chart-1"
      }
    ],
    "variables": [
      {
        "name": "a",
        "min": -5,
        "max": 5,
        "default": 1,
        "step": 0.1
      }
    ],
    "xRange": [-10, 10],
    "yRange": [-10, 10]
  }
}
\`\`\`

规则：
- steps数组必须包含至少1个步骤
- explanation中公式使用LaTeX格式：行内用$...$，行间用$$...$$
- expressions.expr必须是可求值的代数表达式，乘法必须写*（如a*x^2而非ax^2），指数用^
- color只能是chart-1到chart-5
- 如果题目无法可视化（如纯文字推导、概率计算），将visualization设为null
- 如果题目有参数可以调节（如函数中的系数），在variables中声明
- 如果题目没有可调参数，variables可以为空数组
- xRange和yRange根据题目合理设定`;
