import { create } from "zustand";
import type { SolveResponse } from "./solve-schema";
import * as db from "./db";

export interface SolveSession {
  id: string;
  title: string;
  originalPrompt: string;
  response: SolveResponse | null;
  createdAt: number;
  hasVisualization: boolean;
}

interface SolveState {
  sessions: SolveSession[];
  activeSessionId: string;

  // Current solving state
  isStreaming: boolean;
  streamingContent: string;

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
  loadFromDb: () => Promise<void>;
}

export const useSolveStore = create<SolveState>((set, get) => ({
  sessions: [],
  activeSessionId: "",
  isStreaming: false,
  streamingContent: "",
  currentSteps: [],
  currentVisualization: null,
  currentVariables: {},

  setActiveSessionId: (id) => {
    set({ activeSessionId: id });
    get().hydrateFromSnapshot(id);
  },

  addSession: (session) => {
    set((s) => ({
      sessions: [session, ...s.sessions],
      activeSessionId: session.id,
    }));
    // Persist to DB
    db.saveSolveSession(
      session.id,
      session.title,
      session.originalPrompt,
      JSON.stringify(session.response),
      session.createdAt,
    );
  },

  deleteSession: (id) => {
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
    // Persist updated session
    const session = get().sessions.find((s) => s.id === id);
    if (session) {
      db.saveSolveSession(
        session.id,
        session.title,
        session.originalPrompt,
        JSON.stringify(session.response),
        session.createdAt,
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

  loadFromDb: async () => {
    const rows = await db.loadSolveSessions();
    const sessions: SolveSession[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      originalPrompt: r.original_prompt,
      response: safeParseJson(r.response_json),
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
