import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Send, Square, Loader2, AlertTriangle, ChevronRight, ChevronDown } from "lucide-react";
import { useSolveStore } from "@/lib/solve-store";
import { useAIStore } from "@/lib/ai-store";
import { SolveSteps } from "./SolveSteps";
import { DynamicCanvas } from "./DynamicCanvas";

export function SolvePanel() {
  const {
    sessions,
    activeSessionId,
    addSession,
    isStreaming,
    streamingContent,
    streamingSessionId,
    currentSteps,
    currentVisualization,
    currentVariables,
    setCurrentVariables,
    startStream,
    stopStream,
    hydrateFromSnapshot,
  } = useSolveStore();

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const { providers, activeProviderId } = useAIStore();

  const [input, setInput] = useState("");
  const [fallbackContent, setFallbackContent] = useState<string | null>(null);
  const [stepsOpen, setStepsOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const skipHydrateRef = useRef(false);

  // Hydrate session state when switching between sessions
  // NOTE: Do NOT stop the stream here — let it run to completion in the
  // background so switching back shows the result without losing progress.
  useEffect(() => {
    if (skipHydrateRef.current) {
      skipHydrateRef.current = false;
      return;
    }
    // If returning to the session that's still streaming, just show streaming UI
    if (streamingSessionId === activeSessionId) {
      setFallbackContent(null);
      return;
    }
    // Hydrate the session's saved state (stream continues in background)
    const session = sessions.find((s) => s.id === activeSessionId);
    if (session?.response) {
      hydrateFromSnapshot(activeSessionId);
      setFallbackContent(null);
    } else if (session?.rawContent) {
      hydrateFromSnapshot(activeSessionId);
      setFallbackContent(session.rawContent);
    } else {
      hydrateFromSnapshot(activeSessionId);
      setFallbackContent(null);
    }
  }, [activeSessionId]);

  const isConfigured = providers.some((p) => p.hasApiKey);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;

    const sessionId = Date.now().toString();
    const newSession = {
      id: sessionId,
      title: text.slice(0, 30),
      originalPrompt: text,
      response: null,
      createdAt: Date.now(),
      hasVisualization: false,
    };
    skipHydrateRef.current = true;
    addSession(newSession);
    setInput("");
    setFallbackContent(null);

    // Store owns the full stream lifecycle
    startStream(sessionId, activeProviderId, text);
  };

  const handleStop = () => {
    stopStream();
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

  // Show streaming UI only if the active session is currently streaming
  const isCurrentStreaming = isStreaming && streamingSessionId === activeSessionId;
  const displayContent = isCurrentStreaming ? streamingContent : "";
  // Don't gate on isStreaming — it's a global flag that may be true because
  // a DIFFERENT session is streaming in the background.
  const hasResult = currentSteps.length > 0 && !isCurrentStreaming;
  const hasFallback = fallbackContent !== null && !hasResult;

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
          {isCurrentStreaming ? (
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

      {/* Streaming content */}
      {isCurrentStreaming && displayContent && (
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

      {/* Streaming but no content yet */}
      {isCurrentStreaming && !displayContent && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            AI 正在解题...
          </div>
        </div>
      )}

      {hasResult && (
        <div className="flex-1 flex min-h-0">
          {/* Left: canvas + summary */}
          <div className="flex-1 min-w-0 flex flex-col">
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

      {!isCurrentStreaming && !hasResult && !hasFallback && (
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
