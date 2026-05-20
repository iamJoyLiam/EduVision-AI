import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface TokenPayload {
  token: string;
  done: boolean;
}

export async function* streamChat(
  providerId: string,
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  const tokens: string[] = [];
  let done = false;
  let resolveNext: (() => void) | null = null;
  let rejectFn: ((err: Error) => void) | null = null;

  const unlisten = await listen<TokenPayload>("ai-token", (event) => {
    const payload = event.payload;
    if (payload.done) {
      done = true;
      resolveNext?.();
    } else {
      tokens.push(payload.token);
      resolveNext?.();
    }
  });

  // Handle abort
  signal?.addEventListener("abort", () => {
    done = true;
    rejectFn?.(new DOMException("Aborted", "AbortError"));
  });

  // Start streaming (fire and forget — tokens arrive via events)
  invoke("stream_chat", { providerId, messages }).catch((err) => {
    done = true;
    rejectFn?.(new Error(String(err)));
  });

  try {
    while (!done) {
      if (tokens.length > 0) {
        yield tokens.shift()!;
      } else {
        await new Promise<void>((resolve, reject) => {
          resolveNext = resolve;
          rejectFn = reject;
        });
        resolveNext = null;
        rejectFn = null;
      }
    }
    // Drain remaining tokens
    while (tokens.length > 0) {
      yield tokens.shift()!;
    }
  } finally {
    unlisten();
  }
}

export interface TestResult {
  ok: boolean;
  error: string;
}

export interface ProviderInput {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  modelId: string;
  maxTokens: number;
  modelList?: string[];
  apiStyle?: "responses" | "chat-completions";
  reasoningLevel?: "off" | "low" | "medium" | "high";
  temperature?: number;
}

export interface ProviderView {
  id: string;
  name: string;
  endpoint: string;
  modelId: string;
  maxTokens: number;
  hasApiKey: boolean;
  modelList?: string[];
  apiStyle?: "responses" | "chat-completions";
  reasoningLevel?: "off" | "low" | "medium" | "high";
  temperature?: number;
}

export async function testConnection(provider: ProviderInput): Promise<TestResult> {
  return invoke("test_connection", { provider });
}

export async function fetchModels(provider: ProviderInput): Promise<string[]> {
  return invoke("fetch_models", { provider });
}

export async function getProviders(): Promise<ProviderView[]> {
  return invoke("get_providers");
}

export async function saveProvider(provider: ProviderInput): Promise<void> {
  return invoke("save_provider", { provider });
}

export async function removeProvider(id: string): Promise<void> {
  return invoke("remove_provider", { id });
}
