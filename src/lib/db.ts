import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

let settingsDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSettings: Record<string, unknown> | null = null;
const SETTINGS_DEBOUNCE_MS = 500;
const SESSION_DEBOUNCE_MS = 1000;

const sessionDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const pendingSessions = new Map<
  string,
  { title: string; messages: string; createdAt: number }
>();

// ── Init ──

export async function init(): Promise<void> {
  try {
    db = await Database.load("sqlite:eduvision.db");

    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        messages TEXT NOT NULL DEFAULT '[]',
        created_at INTEGER NOT NULL
      )
    `);

    await migrateFromLocalStorage();
  } catch (err) {
    console.error("[db] Failed to initialize SQLite:", err);
    db = null;
  }
}

// ── Migration ──

async function migrateFromLocalStorage(): Promise<void> {
  if (!db) return;

  const existing = await db.select<Array<{ count: number }>>(
    "SELECT COUNT(*) as count FROM settings"
  );
  if (existing[0]?.count > 0) return;

  const raw = localStorage.getItem("eduvision-ai-settings");
  if (!raw) return;

  try {
    const wrapper = JSON.parse(raw);
    const state = wrapper?.state;
    if (!state || typeof state !== "object") return;

    const keys = [
      "enabled",
      "showError",
      "activeProviderId",
      "providers",
      "inlineSuggestions",
      "debounceMs",
      "contextWindowSize",
      "privacyMode",
    ] as const;

    for (const key of keys) {
      if (key in state) {
        const value =
          typeof state[key] === "string"
            ? state[key]
            : JSON.stringify(state[key]);
        await db.execute(
          "INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)",
          [key, value]
        );
      }
    }

    localStorage.removeItem("eduvision-ai-settings");
  } catch (err) {
    console.error("[db] localStorage migration failed:", err);
  }
}

// ── Settings ──

export async function loadSettings(): Promise<Record<string, unknown>> {
  if (!db) return {};

  try {
    const rows = await db.select<Array<{ key: string; value: string }>>(
      "SELECT key, value FROM settings"
    );

    const result: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        result[row.key] = row.value;
      }
    }
    return result;
  } catch (err) {
    console.error("[db] Failed to load settings:", err);
    return {};
  }
}

export function saveSettings(settings: Record<string, unknown>): void {
  pendingSettings = settings;

  if (settingsDebounceTimer) {
    clearTimeout(settingsDebounceTimer);
  }

  settingsDebounceTimer = setTimeout(() => {
    flushSettings();
  }, SETTINGS_DEBOUNCE_MS);
}

export async function flushSettings(): Promise<void> {
  if (!db || !pendingSettings) return;

  const settings = pendingSettings;
  pendingSettings = null;

  if (settingsDebounceTimer) {
    clearTimeout(settingsDebounceTimer);
    settingsDebounceTimer = null;
  }

  try {
    for (const [key, value] of Object.entries(settings)) {
      const strValue = typeof value === "string" ? value : JSON.stringify(value);
      await db.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)",
        [key, strValue]
      );
    }
  } catch (err) {
    console.error("[db] Failed to save settings:", err);
    pendingSettings = settings;
  }
}

// ── Sessions ──

export interface SessionRow {
  id: string;
  title: string;
  messages: string;
  createdAt: number;
}

export async function loadSessions(): Promise<SessionRow[]> {
  if (!db) return [];

  try {
    return await db.select<SessionRow[]>(
      "SELECT id, title, messages, created_at as createdAt FROM sessions ORDER BY created_at DESC"
    );
  } catch (err) {
    console.error("[db] Failed to load sessions:", err);
    return [];
  }
}

export async function insertSession(
  id: string,
  title: string,
  messages: unknown[],
  createdAt: number
): Promise<void> {
  if (!db) return;

  try {
    await db.execute(
      "INSERT OR REPLACE INTO sessions (id, title, messages, created_at) VALUES ($1, $2, $3, $4)",
      [id, title, JSON.stringify(messages), createdAt]
    );
  } catch (err) {
    console.error("[db] Failed to insert session:", err);
  }
}

export function saveSession(
  id: string,
  title: string,
  messages: unknown[],
  createdAt: number
): void {
  pendingSessions.set(id, {
    title,
    messages: JSON.stringify(messages),
    createdAt,
  });

  const existing = sessionDebounceTimers.get(id);
  if (existing) clearTimeout(existing);

  sessionDebounceTimers.set(
    id,
    setTimeout(async () => {
      sessionDebounceTimers.delete(id);
      const data = pendingSessions.get(id);
      if (!data || !db) return;
      pendingSessions.delete(id);

      try {
        await db.execute(
          "INSERT OR REPLACE INTO sessions (id, title, messages, created_at) VALUES ($1, $2, $3, $4)",
          [id, data.title, data.messages, data.createdAt]
        );
      } catch (err) {
        console.error("[db] Failed to save session:", err);
        pendingSessions.set(id, data);
      }
    }, SESSION_DEBOUNCE_MS)
  );
}

export async function deleteSessionFromDb(id: string): Promise<void> {
  const timer = sessionDebounceTimers.get(id);
  if (timer) clearTimeout(timer);
  sessionDebounceTimers.delete(id);
  pendingSessions.delete(id);

  if (!db) return;

  try {
    await db.execute("DELETE FROM sessions WHERE id = $1", [id]);
  } catch (err) {
    console.error("[db] Failed to delete session:", err);
  }
}

export async function flushAllSessions(): Promise<void> {
  if (!db || pendingSessions.size === 0) return;

  for (const [id, data] of pendingSessions) {
    const timer = sessionDebounceTimers.get(id);
    if (timer) clearTimeout(timer);
    sessionDebounceTimers.delete(id);

    try {
      await db.execute(
        "INSERT OR REPLACE INTO sessions (id, title, messages, created_at) VALUES ($1, $2, $3, $4)",
        [id, data.title, data.messages, data.createdAt]
      );
    } catch (err) {
      console.error("[db] Failed to flush session:", err);
    }
  }
  pendingSessions.clear();
}
