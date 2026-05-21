import { create } from "zustand";
import * as db from "./db";
import { getProviders } from "./ai-api";

export interface AIProvider {
  id: string;
  name: string;
  endpoint: string;
  modelId: string;
  maxTokens: number;
  hasApiKey: boolean;
  apiKeyMasked?: string;
  modelList?: string[];
  apiStyle?: "responses" | "chat-completions";
  reasoningLevel?: "off" | "low" | "medium" | "high";
  temperature?: number;
}

export const BUILT_IN_PROVIDERS: Omit<AIProvider, "id">[] = [
  {
    name: "OpenAI",
    endpoint: "https://api.openai.com",
    modelId: "gpt-4.1-mini",
    maxTokens: 2048,
    hasApiKey: false,
    apiStyle: "responses",
    reasoningLevel: "off",
    temperature: 1,
  },
  {
    name: "Claude",
    endpoint: "https://api.anthropic.com",
    modelId: "claude-sonnet-4-20250514",
    maxTokens: 2048,
    hasApiKey: false,
    apiStyle: "chat-completions",
    reasoningLevel: "off",
    temperature: 1,
  },
  {
    name: "GitHub Copilot",
    endpoint: "https://api.githubcopilot.com",
    modelId: "gpt-4o-mini",
    maxTokens: 2048,
    hasApiKey: false,
    apiStyle: "chat-completions",
    reasoningLevel: "off",
    temperature: 1,
  },
  {
    name: "OpenRouter",
    endpoint: "https://openrouter.ai/api",
    modelId: "openai/gpt-4o-mini",
    maxTokens: 2048,
    hasApiKey: false,
    apiStyle: "chat-completions",
    reasoningLevel: "off",
    temperature: 1,
  },
  {
    name: "Gemini",
    endpoint: "https://generativelanguage.googleapis.com",
    modelId: "gemini-2.0-flash",
    maxTokens: 2048,
    hasApiKey: false,
    apiStyle: "chat-completions",
    reasoningLevel: "off",
    temperature: 1,
  },
  {
    name: "Ollama",
    endpoint: "http://localhost:11434",
    modelId: "llama3.2",
    maxTokens: 2048,
    hasApiKey: false,
    apiStyle: "chat-completions",
    reasoningLevel: "off",
    temperature: 1,
  },
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

interface AIState {
  enabled: boolean;
  showError: boolean;
  activeProviderId: string;
  providers: AIProvider[];
  inlineSuggestions: boolean;
  debounceMs: number;
  contextWindowSize: number;
  privacyMode: "local" | "cloud" | "hybrid";

  // Chat state
  sessions: ChatSession[];
  activeSessionId: string;

  // DB integration
  hydrate: () => Promise<void>;
  saveSettings: () => void;
  refreshProviders: () => Promise<void>;

  setEnabled: (v: boolean) => void;
  setShowError: (v: boolean) => void;
  setActiveProviderId: (id: string) => void;
  addProvider: (p: Omit<AIProvider, "id">) => void;
  updateProvider: (id: string, p: Partial<AIProvider>) => void;
  removeProvider: (id: string) => void;
  setInlineSuggestions: (v: boolean) => void;
  setDebounceMs: (v: number) => void;
  setContextWindowSize: (v: number) => void;
  setPrivacyMode: (m: "local" | "cloud" | "hybrid") => void;

  // Chat actions
  createSession: () => Promise<string>;
  deleteSession: (id: string) => Promise<void>;
  setActiveSessionId: (id: string) => void;
  addMessage: (sessionId: string, msg: ChatMessage) => void;
  getActiveSession: () => ChatSession | undefined;
}

export const useAIStore = create<AIState>()((set, get) => ({
  enabled: true,
  showError: true,
  activeProviderId: "",
  providers: [],
  inlineSuggestions: true,
  debounceMs: 500,
  contextWindowSize: 4096,
  privacyMode: "cloud",

  sessions: [],
  activeSessionId: "",

  hydrate: async () => {
    const settings = await db.loadSettings();
    if (Object.keys(settings).length > 0) {
      set({
        enabled: (settings.enabled as boolean) ?? true,
        showError: (settings.showError as boolean) ?? true,
        activeProviderId:
          String(settings.activeProviderId ?? "builtin-0"),
        providers:
          ((settings.providers as AIProvider[]) ?? []).map((p) => ({
            ...p,
            id: String(p.id),
          })),
        inlineSuggestions: (settings.inlineSuggestions as boolean) ?? true,
        debounceMs: (settings.debounceMs as number) ?? 500,
        contextWindowSize: (settings.contextWindowSize as number) ?? 4096,
        privacyMode: (settings.privacyMode as "local" | "cloud" | "hybrid") ?? "cloud",
      });
    }

    const rows = await db.loadSessions();
    const sessions: ChatSession[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      messages: JSON.parse(r.messages) as ChatMessage[],
      createdAt: r.createdAt,
    }));
    set({
      sessions,
      activeSessionId: sessions.length > 0 ? sessions[0].id : "",
    });
  },

  saveSettings: () => {
    const s = get();
    db.saveSettings({
      enabled: s.enabled,
      showError: s.showError,
      activeProviderId: s.activeProviderId,
      providers: s.providers,
      inlineSuggestions: s.inlineSuggestions,
      debounceMs: s.debounceMs,
      contextWindowSize: s.contextWindowSize,
      privacyMode: s.privacyMode,
    });
  },

  refreshProviders: async () => {
    try {
      const backendProviders = await getProviders();
      set({
        providers: backendProviders.map((p) => ({
          id: String(p.id),
          name: p.name,
          endpoint: p.endpoint,
          modelId: p.modelId,
          maxTokens: p.maxTokens,
          hasApiKey: p.hasApiKey,
          apiKeyMasked: p.apiKeyMasked,
          modelList: p.modelList,
          apiStyle: p.apiStyle,
          reasoningLevel: p.reasoningLevel,
          temperature: p.temperature,
        })),
      });
    } catch {
      /* ignore */
    }
  },

  setEnabled: (v) => {
    set({ enabled: v });
    get().saveSettings();
  },
  setShowError: (v) => {
    set({ showError: v });
    get().saveSettings();
  },
  setActiveProviderId: (id) => {
    set({ activeProviderId: id });
    get().saveSettings();
  },
  addProvider: (p) => {
    const id = (p as AIProvider).id || Date.now().toString();
    set((s) => ({
      providers: [...s.providers, { ...p, id }],
      activeProviderId: id,
    }));
    get().saveSettings();
  },
  updateProvider: (id, p) => {
    set((s) => ({
      providers: s.providers.map((pr) =>
        pr.id === id ? { ...pr, ...p } : pr
      ),
    }));
    get().saveSettings();
  },
  removeProvider: (id) => {
    set((s) => ({
      providers: s.providers.filter((pr) => pr.id !== id),
      activeProviderId:
        s.activeProviderId === id
          ? s.providers[0]?.id ?? ""
          : s.activeProviderId,
    }));
    get().saveSettings();
  },
  setInlineSuggestions: (v) => {
    set({ inlineSuggestions: v });
    get().saveSettings();
  },
  setDebounceMs: (v) => {
    set({ debounceMs: v });
    get().saveSettings();
  },
  setContextWindowSize: (v) => {
    set({ contextWindowSize: v });
    get().saveSettings();
  },
  setPrivacyMode: (m) => {
    set({ privacyMode: m });
    get().saveSettings();
  },

  createSession: async () => {
    const id = Date.now().toString();
    const session: ChatSession = {
      id,
      title: "新对话",
      messages: [],
      createdAt: Date.now(),
    };
    set((s) => ({
      sessions: [session, ...s.sessions],
      activeSessionId: id,
    }));
    await db.insertSession(id, session.title, [], session.createdAt);
    return id;
  },
  deleteSession: async (id) => {
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
    await db.deleteSessionFromDb(id);
  },
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  addMessage: (sessionId, msg) =>
    set((s) => {
      const updated = s.sessions.map((se) =>
        se.id === sessionId
          ? {
              ...se,
              messages: [...se.messages, msg],
              title:
                se.messages.length === 0 && msg.role === "user"
                  ? msg.content.slice(0, 30)
                  : se.title,
            }
          : se
      );
      const session = updated.find((se) => se.id === sessionId);
      if (session) {
        db.saveSession(
          session.id,
          session.title,
          session.messages,
          session.createdAt
        );
      }
      return { sessions: updated };
    }),
  getActiveSession: () => {
    const s = get();
    return s.sessions.find((se) => se.id === s.activeSessionId);
  },
}));
