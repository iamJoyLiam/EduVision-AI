import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Send, X, Loader2, History, Plus, Square, Settings, Terminal, ChevronDown } from "lucide-react";
import { useUIStore } from "@/lib/ui-store";
import { useAIStore } from "@/lib/ai-store";
import { streamChat } from "@/lib/ai-api";

interface AIPanelProps {
  context?: string;
}

export function AIPanel({ context }: AIPanelProps) {
  const rightOpen = useUIStore((s) => s.rightOpen);
  const toggleRight = useUIStore((s) => s.toggleRight);
  const openSettings = useUIStore((s) => s.openSettings);

  const aiStore = useAIStore();
  const {
    enabled,
    providers,
    activeProviderId,
    sessions,
    activeSessionId,
    createSession,
    setActiveSessionId,
    addMessage,
    getActiveSession,
  } = aiStore;

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeSession = getActiveSession();
  const messages = activeSession?.messages ?? [];
  const isConfigured = providers.some((p) => p.hasApiKey);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streamingContent]);

  useEffect(() => {
    if (rightOpen && inputRef.current) inputRef.current.focus();
  }, [rightOpen]);

  // Auto-create session if none exists
  useEffect(() => {
    if (rightOpen && sessions.length === 0) {
      createSession();
    }
  }, [rightOpen, sessions.length]);

  const handleNewChat = async () => {
    if (isLoading) return;
    await createSession();
    setShowHistory(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading || !activeSession) return;

    // Ensure there's a session
    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = await createSession();
    }

    const userMsg = {
      id: Date.now().toString(),
      role: "user" as const,
      content: text,
    };
    addMessage(sessionId, userMsg);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    const systemMessage = {
      role: "system" as const,
      content: `你是一个数学、物理、化学教育AI助教。当前学习上下文：${context ?? "无"}。请用简洁、易懂的中文回答学生的问题。如果涉及公式推导，请使用Markdown格式。`,
    };

    const history = (activeSession?.messages ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const allMessages = [systemMessage, ...history, { role: "user" as const, content: text }];

    const controller = new AbortController();
    abortRef.current = controller;

    let fullContent = "";

    try {
      for await (const token of streamChat(activeProviderId, allMessages, controller.signal)) {
        fullContent += token;
        setStreamingContent(fullContent);
      }

      if (fullContent) {
        addMessage(sessionId, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: fullContent,
        });
      }
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") {
        if (fullContent) {
          addMessage(sessionId, {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: fullContent + "\n\n*[已中断]*",
          });
        }
      } else {
        const errMsg = err instanceof Error ? err.message : String(err);
        addMessage(sessionId, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `请求出错：${errMsg}\n\n请检查API Key和网络连接是否正确。可以在设置中配置AI提供商。`,
        });
      }
    } finally {
      setIsLoading(false);
      setStreamingContent("");
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  if (!enabled) return null;

  const displayMessages = streamingContent
    ? [...messages, { id: "streaming", role: "assistant" as const, content: streamingContent }]
    : messages;

  return (
    <aside
      className={[
        "shrink-0 bg-sidebar border-l border-border flex flex-col h-full overflow-hidden transition-[width] duration-200 ease-out",
        rightOpen ? "w-80" : "w-0",
      ].join(" ")}
    >
      <div className="w-80 flex flex-col h-full min-h-0">
        {/* Header */}
        <div className="h-11 shrink-0 px-3 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-blue" />
            AI 助教
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewChat}
              className="p-1.5 hover:bg-muted rounded-md text-muted-foreground"
              aria-label="新对话"
              title="新对话"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={[
                "p-1.5 rounded-md transition-colors",
                showHistory ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted",
              ].join(" ")}
              aria-label="历史对话"
              title="历史对话"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={toggleRight}
              className="p-1.5 hover:bg-muted rounded-md text-muted-foreground"
              aria-label="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History panel */}
        {showHistory ? (
          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8">
                暂无历史对话
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    setActiveSessionId(session.id);
                    setShowHistory(false);
                  }}
                  className={[
                    "w-full text-left px-3 py-2.5 border-b border-border hover:bg-surface-elevated transition-colors",
                    session.id === activeSessionId ? "bg-surface-elevated" : "",
                  ].join(" ")}
                >
                  <div className="text-xs font-medium truncate">{session.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {session.messages.length} 条消息 · {formatTime(session.createdAt)}
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <>
            {!isConfigured ? (
              /* Unconfigured state */
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Settings className="w-7 h-7 text-muted-foreground" />
                </div>
                <div className="text-sm font-medium text-foreground mb-1">AI未配置</div>
                <div className="text-xs text-muted-foreground leading-relaxed mb-5">
                  在设置中配置AI提供商以开始对话
                </div>
                <button
                  onClick={openSettings}
                  className="text-xs px-4 py-2 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  前往设置...
                </button>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                  {displayMessages.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-8 leading-relaxed">
                      问我任何与当前公式或题目相关的问题
                      <div className="mt-2 text-[10px]">支持 Markdown 格式</div>
                    </div>
                  )}
                  {displayMessages.map((m) => {
                    const isUser = m.role === "user";
                    return (
                      <div
                        key={m.id}
                        className={isUser ? "flex justify-end" : "flex justify-start"}
                      >
                        <div
                          className={[
                            "max-w-[88%] min-w-0 text-xs leading-relaxed rounded-lg px-3 py-2 overflow-hidden",
                            isUser
                              ? "bg-foreground text-background"
                              : "bg-surface-elevated border border-border text-foreground",
                          ].join(" ")}
                        >
                          {isUser ? (
                            <span className="whitespace-pre-wrap break-words">{m.content}</span>
                          ) : (
                            <div className="prose prose-sm max-w-none break-words prose-p:my-1 prose-pre:my-1 prose-pre:overflow-x-auto prose-headings:my-1 prose-code:text-[11px]">
                              <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {isLoading && !streamingContent && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      思考中…
                    </div>
                  )}
                </div>

                {/* Composer + Action buttons */}
                <div className="shrink-0 border-t border-border bg-surface">
                  <form onSubmit={onSubmit} className="p-2">
                    <div className="flex items-end gap-1.5">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            onSubmit(e as unknown as React.FormEvent);
                          }
                        }}
                        rows={2}
                        placeholder="输入问题，Enter 发送…"
                        className="flex-1 resize-none text-xs rounded-md bg-surface-elevated border border-border outline-none focus:ring-2 focus:ring-ring/40 px-2 py-1.5"
                      />
                      {isLoading ? (
                        <button
                          type="button"
                          onClick={handleStop}
                          className="h-8 w-8 shrink-0 rounded-md bg-pink text-white flex items-center justify-center"
                          aria-label="停止"
                        >
                          <Square className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={!input.trim()}
                          className="h-8 w-8 shrink-0 rounded-md bg-foreground text-background flex items-center justify-center disabled:opacity-40"
                          aria-label="发送"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 px-2 pb-2">
                    <button
                      onClick={async () => {
                        if (!activeSession) return;
                        const sessionId = activeSessionId || await createSession();
                        addMessage(sessionId, {
                          id: Date.now().toString(),
                          role: "user",
                          content: "/help",
                        });
                      }}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
                    >
                      <Terminal className="w-3 h-3" />
                      基本命令
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowModelDropdown(!showModelDropdown)}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
                      >
                        选择模型
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {showModelDropdown && (
                        <div className="absolute bottom-full left-0 mb-1 w-48 bg-surface-elevated border border-border rounded-lg shadow-lg overflow-hidden z-10">
                          {providers.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => {
                                aiStore.setActiveProviderId(p.id);
                                setShowModelDropdown(false);
                              }}
                              className={[
                                "w-full text-left px-3 py-2 text-[11px] hover:bg-muted transition-colors",
                                p.id === activeProviderId ? "bg-muted" : "",
                              ].join(" ")}
                            >
                              <div className="font-medium">{p.name}</div>
                              <div className="text-muted-foreground text-[10px]">{p.modelId}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}
