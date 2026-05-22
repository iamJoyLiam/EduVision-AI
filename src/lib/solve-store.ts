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
- expressions.expr必须是可求值的代数表达式：
  - 乘法必须写*（如a*x^2而非ax^2）
  - 指数用^（如x^2）
  - 不要使用JavaScript的Math对象（如Math.exp(x)），直接写函数名（如exp(x)、sin(x)、cos(x)、sqrt(x)、log(x)、abs(x)）
  - 常量用PI和E（如2*PI*x）
- color只能是chart-1到chart-5
- 如果题目无法可视化（如纯文字推导、概率计算），将visualization设为null
- 如果题目有参数可以调节（如函数中的系数），在variables中声明
- 如果题目没有可调参数，variables可以为空数组
- xRange和yRange根据题目合理设定`;

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
      set({ currentSteps: [], currentVisualization: null, currentVariables: {} });
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
            });
          }
        } else {
          get().updateSession(sessionId, { rawContent: fullContent });
          if (get().activeSessionId === sessionId) {
            set({ currentSteps: [], currentVisualization: null, currentVariables: {} });
          }
        }
      } catch (err: unknown) {
        if ((err as Error).name !== "AbortError") {
          console.error("[SolveStore] stream error:", err);
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
