import { create } from "zustand";
import type { SolveResponse } from "./solve-schema";
import { SolveResponseSchema } from "./solve-schema";
import { streamChat } from "./ai-api";
import * as db from "./db";

export interface SolveSession {
  id: string;
  title: string;
  originalPrompt: string;
  response: SolveResponse | null;
  rawContent?: string;
  createdAt: number;
  hasVisualization: boolean;
}

interface SolveState {
  sessions: SolveSession[];
  activeSessionId: string;

  // Stream lifecycle — owned by the store, not the component
  isStreaming: boolean;
  streamingContent: string;
  streamingSessionId: string | null;
  abortController: AbortController | null;

  // Derived from active session
  currentSteps: SolveResponse["steps"];
  currentVisualization: SolveResponse["visualization"];
  currentVariables: Record<string, number>;
  fallbackContent: string | null;

  // Actions
  setActiveSessionId: (id: string) => void;
  addSession: (session: SolveSession) => void;
  deleteSession: (id: string) => void;
  updateSession: (id: string, updates: Partial<SolveSession>) => void;
  setStreaming: (v: boolean) => void;
  setStreamingContent: (v: string) => void;
  setCurrentVariables: (vars: Record<string, number>) => void;
  hydrateFromSnapshot: (sessionId: string) => void;
  startStream: (sessionId: string, providerId: string, prompt: string) => void;
  stopStream: () => void;
  loadFromDb: () => Promise<void>;
}

const SOLVE_SYSTEM_PROMPT = `你是一个专业的数学、物理、化学解题引擎。严格按以下流程处理学生的题目：

## 工作流程
1. **诊断**：判断题目是否包含函数图像、几何图形、坐标轨迹、不等式区域等可可视化元素
2. **拆解**：提取所有独立变量（参数 a, k, b 等）
3. **降级**：将 LaTeX 公式转换为程序可求值的算术表达式
4. **输出**：仅返回下方 JSON，不要输出任何其他文本、解释或 Markdown 标记

## 输出格式（严格遵守，仅返回此 JSON）

{
  "steps": [
    {
      "title": "步骤标题",
      "explanation": "详细讲解，支持Markdown和LaTeX（行内$...$，行间$$...$$）",
      "formula": "本步核心公式（可选）"
    }
  ],
  "visualization": null
}

当 visualization 不为 null 时格式：
{
  "steps": [...],
  "visualization": {
    "type": "function",
    "expressions": [
      { "expr": "a * x^2 + b * x + c", "label": "f(x)", "color": "chart-1" }
    ],
    "variables": [
      { "name": "a", "min": -5, "max": 5, "default": 1, "step": 0.1 }
    ],
    "xRange": [-10, 10],
    "yRange": [-10, 10]
  }
}

## 表达式降级规则（关键）
- 乘法必须写 *：2*x（不是 2x）
- 幂运算用 ^：x^2
- 指数函数：exp(x)（不是 Math.exp(x)）
- 对数：log(x) 或 log(x)/log(10)
- 三角函数：sin(x), cos(x), tan(x)
- 常量：PI, E
- 禁止使用 JavaScript Math 对象

## 可视化规则
- 仅当题目涉及函数/几何/坐标/不等式时才生成 visualization
- 纯文字推导、概率计算、排列组合 → visualization 设为 null
- viewport（xRange/yRange）必须根据题目合理推算，确保曲线在画布内可见
- 如果题目有可调参数，在 variables 中声明；无参数则 variables 为空数组
- color 仅用 chart-1 到 chart-5

## steps 规则
- 至少 1 个步骤
- explanation 中的数学公式用 LaTeX：行内 $...$，行间 $$...$$`;

export const useSolveStore = create<SolveState>((set, get) => ({
  sessions: [],
  activeSessionId: "",
  isStreaming: false,
  streamingContent: "",
  streamingSessionId: null,
  abortController: null,
  currentSteps: [],
  currentVisualization: null,
  currentVariables: {},
  fallbackContent: null,

  setActiveSessionId: (id) => {
    set({ activeSessionId: id });
  },

  addSession: (session) => {
    set((s) => ({
      sessions: [session, ...s.sessions],
      activeSessionId: session.id,
    }));
    db.saveSolveSession(
      session.id,
      session.title,
      session.originalPrompt,
      JSON.stringify(session.response),
      session.createdAt,
      session.rawContent,
    );
  },

  deleteSession: (id) => {
    const state = get();
    // If deleting the streaming session, abort the stream
    if (state.streamingSessionId === id) {
      state.abortController?.abort();
      set({ isStreaming: false, streamingContent: "", streamingSessionId: null, abortController: null });
    }
    set((s) => {
      const remaining = s.sessions.filter((se) => se.id !== id);
      return {
        sessions: remaining,
        activeSessionId:
          s.activeSessionId === id
            ? remaining[0]?.id ?? ""
            : s.activeSessionId,
      };
    });
    db.deleteSolveSessionFromDb(id);
  },

  updateSession: (id, updates) => {
    set((s) => ({
      sessions: s.sessions.map((se) =>
        se.id === id ? { ...se, ...updates } : se,
      ),
    }));
    const session = get().sessions.find((s) => s.id === id);
    if (session) {
      db.saveSolveSession(
        session.id,
        session.title,
        session.originalPrompt,
        JSON.stringify(session.response),
        session.createdAt,
        session.rawContent,
      );
    }
  },

  setStreaming: (v) => set({ isStreaming: v }),
  setStreamingContent: (v) => set({ streamingContent: v }),
  setCurrentVariables: (vars) => set({ currentVariables: vars }),

  hydrateFromSnapshot: (sessionId) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    if (!session || !session.response) {
      set({
        currentSteps: [],
        currentVisualization: null,
        currentVariables: {},
        fallbackContent: session?.rawContent ?? null,
      });
      return;
    }

    const viz = session.response.visualization;
    const vars: Record<string, number> = {};
    if (viz?.variables) {
      for (const v of viz.variables) {
        vars[v.name] = v.default;
      }
    }

    set({
      currentSteps: session.response.steps,
      currentVisualization: viz,
      currentVariables: vars,
      fallbackContent: null,
    });
  },

  /**
   * Run the AI stream entirely inside the store.
   * The component only subscribes to streamingContent — no lifecycle ownership.
   */
  startStream: (sessionId, providerId, prompt) => {
    // Abort any existing stream
    const prev = get().abortController;
    if (prev) prev.abort();

    const controller = new AbortController();
    set({
      isStreaming: true,
      streamingContent: "",
      streamingSessionId: sessionId,
      abortController: controller,
    });

    const messages = [
      { role: "system" as const, content: SOLVE_SYSTEM_PROMPT },
      { role: "user" as const, content: prompt },
    ];

    // Run the entire stream lifecycle inside the store (fire-and-forget)
    (async () => {
      let fullContent = "";

      try {
        for await (const token of streamChat(
          providerId,
          messages,
          controller.signal,
        )) {
          // If the session was switched away, keep streaming in background
          // but don't update the visible streamingContent
          if (get().streamingSessionId === sessionId) {
            fullContent += token;
            set({ streamingContent: fullContent });
          } else {
            fullContent += token;
          }
        }

        // Parse the complete response
        const parsed = extractAndParseJson(fullContent);
        if (parsed) {
          get().updateSession(sessionId, {
            response: parsed,
            hasVisualization: parsed.visualization !== null,
            rawContent: undefined,
          });
          // If this is still the active session, hydrate immediately
          if (get().activeSessionId === sessionId) {
            const viz = parsed.visualization;
            const vars: Record<string, number> = {};
            if (viz?.variables) {
              for (const v of viz.variables) vars[v.name] = v.default;
            }
            set({
              currentSteps: parsed.steps,
              currentVisualization: viz,
              currentVariables: vars,
              fallbackContent: null,
            });
          }
        } else {
          get().updateSession(sessionId, { rawContent: fullContent });
          if (get().activeSessionId === sessionId) {
            set({
              currentSteps: [],
              currentVisualization: null,
              currentVariables: {},
              fallbackContent: fullContent,
            });
          }
        }
      } catch (err: unknown) {
        if ((err as Error).name !== "AbortError") {
          console.error("[SolveStore] stream error:", err);
          // Show error + any partial content as fallback
          const errorHint = `[错误] AI 生成中断: ${(err as Error).message?.slice(0, 200)}`;
          const fallback = fullContent ? `${fullContent}\n\n${errorHint}` : errorHint;
          get().updateSession(sessionId, { rawContent: fallback });
          if (get().activeSessionId === sessionId) {
            set({
              currentSteps: [],
              currentVisualization: null,
              currentVariables: {},
              fallbackContent: fallback,
            });
          }
        } else if (fullContent) {
          // Save partial content on abort
          get().updateSession(sessionId, { rawContent: fullContent });
        }
      } finally {
        // Only clear streaming state if this is still the active stream
        if (get().streamingSessionId === sessionId) {
          set({
            isStreaming: false,
            streamingContent: "",
            streamingSessionId: null,
            abortController: null,
          });
        }
      }
    })();
  },

  stopStream: () => {
    get().abortController?.abort();
  },

  loadFromDb: async () => {
    const rows = await db.loadSolveSessions();
    const sessions: SolveSession[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      originalPrompt: r.original_prompt,
      response: safeParseJson(r.response_json),
      rawContent: r.raw_content ?? undefined,
      createdAt: r.created_at,
      hasVisualization: (() => {
        try {
          const parsed = JSON.parse(r.response_json);
          return parsed?.visualization != null;
        } catch {
          return false;
        }
      })(),
    }));
    set({
      sessions,
      activeSessionId: sessions.length > 0 ? sessions[0].id : "",
    });
    if (sessions.length > 0) {
      get().hydrateFromSnapshot(sessions[0].id);
    }
  },
}));

// ── JSON parsing (moved from SolvePanel) ──

function extractAndParseJson(content: string): SolveResponse | null {
  const directTry = tryParse(content);
  if (directTry) return directTry;

  const codeBlocks = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/g);
  if (codeBlocks) {
    for (const block of codeBlocks) {
      const inner = block.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```$/, "");
      const blockTry = tryParse(inner);
      if (blockTry) return blockTry;
    }
  }

  const jsonFromBraces = extractJsonByBraces(content);
  if (jsonFromBraces) {
    const braceTry = tryParse(jsonFromBraces);
    if (braceTry) return braceTry;
  }

  const fixed = fixJsonBackslashes(content);
  if (fixed) {
    const fixedTry = tryParse(fixed);
    if (fixedTry) return fixedTry;
  }

  console.warn("[SolveStore] Failed to parse AI response as JSON");
  return null;
}

function extractJsonByBraces(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

function fixJsonBackslashes(content: string): string | null {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  let jsonStr = content.slice(start, end + 1);
  jsonStr = jsonStr.replace(/\\(?![\\"\/bfnrtu])/g, "\\\\");
  return jsonStr;
}

function tryParse(str: string): SolveResponse | null {
  try {
    const data = JSON.parse(str.trim());
    const result = SolveResponseSchema.safeParse(data);
    if (result.success) return result.data;
    console.warn("[SolveStore] Zod validation failed:", result.error?.issues);
  } catch (err) {
    console.warn("[SolveStore] JSON.parse failed:", (err as Error).message?.slice(0, 100));
  }
  return null;
}

function safeParseJson(json: string): SolveResponse | null {
  try {
    const data = JSON.parse(json);
    if (data && typeof data === "object" && Array.isArray(data.steps)) {
      return data as SolveResponse;
    }
  } catch {
    // ignore
  }
  return null;
}
