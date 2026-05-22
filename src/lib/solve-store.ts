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
  currentSteps: string[];
  currentVisualization: SolveResponse["visualization_config"];
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

const SOLVE_SYSTEM_PROMPT = `# Role
你是顶尖的 K-12（小初高）数理化教育解析中枢。任务是将非结构化的数学、物理、化学题目，转化为严谨的分步解析与可驱动前端图表的结构化 JSON。

# Schema Migration Mandate (STRICT DEPRECATION)
你必须严格执行新版数据结构迁移。严禁输出任何旧版 Schema 字段。以下为新旧字段绝对禁令对照表：
- 严禁使用旧字段 \`steps\` -> 必须迁移为顶层的 \`analysis_steps\` 字符串数组。
- 严禁使用旧字段 \`visualization.type\` -> 必须迁移为顶层的 \`category\`。
- 严禁使用旧字段 \`visualization.expressions\` -> 必须迁移为 \`visualization_config.elements\`。
- 严禁使用旧字段 \`visualization.variables\` -> 必须迁移为 \`visualization_config.controls\`。
- 严禁使用旧字段 \`xRange\`/\`yRange\` -> 必须迁移为 \`visualization_config.viewport\`。

# Subject Specific Rules
## MATH (数学)
- 提取题目中的独立变量（如参数 a, k）。
- 几何题必须以左下角或关键点为原点建立隐式直角坐标系，使用 polygon 或 segment 描绘图形。

### 圆锥曲线绘制规则（CRITICAL）
椭圆、圆、双曲线等隐式方程不能直接用 curve 绘制！必须拆分为上下两个函数分支：
- **椭圆** x²/a² + y²/b² = 1 → 两条 curve：
  - expression: "b * sqrt(1 - x^2 / a^2)" （上半部分）
  - expression: "-b * sqrt(1 - x^2 / a^2)" （下半部分）
- **圆** x² + y² = r² → 两条 curve：
  - expression: "sqrt(r^2 - x^2)"
  - expression: "-sqrt(r^2 - x^2)"
- **双曲线** x²/a² - y²/b² = 1 → 两条 curve：
  - expression: "b * sqrt(x^2 / a^2 - 1)"
  - expression: "-b * sqrt(x^2 / a^2 - 1)"

示例：椭圆 x²/4 + y² = 1 的 elements 应为两个 curve：上半 sqrt(1 - x²/4) 和下半 -sqrt(1 - x²/4)

## PHYSICS (物理)
- 运动学 (PHYSICS_KINEMATICS)：将时间 \`t\` 设为 controls 的滑块参数。轨迹和位置表达式必须是关于 \`t\` 的函数。
- 力学 (PHYSICS_MECHANICS)：使用 \`vector\` 图元表示力，\`expression\` 格式为 \`[起点x, 起点y, 向量dx, 向量dy]\`。

## CHEMISTRY (化学)
- 动力学/平衡 (CHEMISTRY_KINETICS)：将时间或压强/温度设为 controls。使用 \`curve\` 描绘浓度/反应速率变化。

# Hard Constraints (CRITICAL)
1. 严禁输出 Markdown 代码块标签（如 \`\`\`json），直接返回标准的 JSON 字符串。
2. 转义限制：在 \`analysis_steps\` 中输出任何 LaTeX 公式时，必须使用【双反斜杠】转义！例如必须输出 \`\\\\frac{a}{2}\`，严禁输出 \`\\frac{a}{2}\` 或 \`\\frac{a}{2}\`。

# Expression Rules (关键)
- 乘法必须写 *：2*x（不是 2x）
- 幂运算用 ^：x^2
- 指数函数：exp(x)（不是 Math.exp(x)）
- 对数：log(x) 或 log(x)/log(10)
- 三角函数：sin(x), cos(x), tan(x)
- 常量：PI, E
- 禁止使用 JavaScript Math 对象

# Target JSON Schema Definition
{
  "is_visualizable": boolean,
  "subject": "MATH" | "PHYSICS" | "CHEMISTRY",
  "category": "MATH_FUNCTION" | "MATH_GEOMETRY" | "PHYSICS_KINEMATICS" | "PHYSICS_MECHANICS" | "CHEMISTRY_KINETICS" | "NONE",
  "analysis_steps": [
    "**步骤一：受力分析** \\\\n 根据牛顿第二定律 $F = ma$..."
  ],
  "visualization_config": {
    "viewport": { "x_min": -10, "x_max": 10, "y_min": -10, "y_max": 10 },
    "controls": [
      { "symbol": "t", "label": "时间 t", "type": "slider", "min": 0, "max": 10, "step": 0.1, "default": 0 }
    ],
    "elements": [
      {
        "id": "obj_velocity",
        "type": "vector" | "curve" | "point" | "polygon" | "segment",
        "expression": "string",
        "color_intent": "primary" | "danger" | "success" | "warning",
        "label_text": "速度 v"
      }
    ]
  }
}

若 is_visualizable 为 false，visualization_config 字段必须输出 null。`;

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

    const viz = session.response.visualization_config;
    const vars: Record<string, number> = {};
    if (viz?.controls) {
      for (const c of viz.controls) {
        vars[c.symbol] = c.default;
      }
    }

    set({
      currentSteps: session.response.analysis_steps,
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
            hasVisualization: parsed.is_visualizable && parsed.visualization_config !== null,
            rawContent: undefined,
          });
          // If this is still the active session, hydrate immediately
          if (get().activeSessionId === sessionId) {
            const viz = parsed.visualization_config;
            const vars: Record<string, number> = {};
            if (viz?.controls) {
              for (const c of viz.controls) vars[c.symbol] = c.default;
            }
            set({
              currentSteps: parsed.analysis_steps,
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
          return parsed?.is_visualizable && parsed?.visualization_config != null;
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
  // 1. Try direct parse
  const directTry = tryParse(content);
  if (directTry) return directTry;

  // 2. Try extracting from markdown code blocks
  const codeBlocks = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/g);
  if (codeBlocks) {
    for (const block of codeBlocks) {
      const inner = block.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?\s*```$/, "");
      const blockTry = tryParse(inner);
      if (blockTry) return blockTry;
    }
  }

  // 3. Try extracting JSON by braces
  const jsonFromBraces = extractJsonByBraces(content);
  if (jsonFromBraces) {
    const braceTry = tryParse(jsonFromBraces);
    if (braceTry) return braceTry;
  }

  console.warn("[SolveStore] Failed to parse AI response as JSON. Content preview:", content.slice(0, 300));
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

function tryParse(str: string): SolveResponse | null {
  try {
    // Fix single backslashes from AI (e.g. \frac -> \\frac)
    const fixed = fixLatexBackslashes(str.trim());
    const data = JSON.parse(fixed);
    const result = SolveResponseSchema.safeParse(data);
    if (result.success) return result.data;
    console.warn("[SolveStore] Zod validation failed:");
    for (const issue of result.error?.issues ?? []) {
      console.warn(`  - Path: ${issue.path.join('.')}, Code: ${issue.code}, Message: ${issue.message}`);
    }
    console.warn("[SolveStore] Received data:", JSON.stringify(data, null, 2)?.slice(0, 500));
  } catch (err) {
    console.warn("[SolveStore] JSON.parse failed:", (err as Error).message?.slice(0, 200));
  }
  return null;
}

/**
 * Fix LaTeX backslashes that AI outputs as single backslash.
 * In JSON, \f, \s, \l etc. are invalid escape sequences.
 * This converts them to valid double backslashes.
 */
function fixLatexBackslashes(jsonStr: string): string {
  // Strategy: walk through the string, track JSON string boundaries,
  // and fix invalid escape sequences inside strings.
  let result = "";
  let inString = false;
  let i = 0;

  while (i < jsonStr.length) {
    const ch = jsonStr[i];

    if (!inString) {
      if (ch === '"') {
        inString = true;
        result += ch;
      } else {
        result += ch;
      }
      i++;
      continue;
    }

    // Inside a string
    if (ch === "\\") {
      const next = jsonStr[i + 1];
      if (next === undefined) {
        result += "\\\\";
        i++;
        continue;
      }

      // Valid JSON escape sequences: " \ / b f n r t u
      if ('"\\/bfnrtu'.includes(next)) {
        result += ch + next;
        i += 2;
      } else {
        // Invalid escape (like \frac, \sqrt, \ln) - double the backslash
        result += "\\\\" + next;
        i += 2;
      }
    } else if (ch === '"') {
      inString = false;
      result += ch;
      i++;
    } else {
      result += ch;
      i++;
    }
  }

  return result;
}

function safeParseJson(json: string): SolveResponse | null {
  try {
    const data = JSON.parse(json);
    if (data && typeof data === "object" && Array.isArray(data.analysis_steps)) {
      return data as SolveResponse;
    }
  } catch {
    // ignore
  }
  return null;
}
