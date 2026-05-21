import { useState, useCallback, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { useUIStore } from "@/lib/ui-store";
import {
  useAIStore,
  type AIProvider,
  BUILT_IN_PROVIDERS,
} from "@/lib/ai-store";
import {
  testConnection,
  fetchModels,
  saveProvider,
  removeProvider,
  type ProviderInput,
} from "@/lib/ai-api";
import { usePlatform } from "@/hooks/use-platform";

interface SettingsModalProps {
  open: boolean;
}

type Tab = "general" | "ai" | "about";

const TABS: { key: Tab; label: string }[] = [
  { key: "general", label: "常规" },
  { key: "ai", label: "AI" },
  { key: "about", label: "关于" },
];

function TrafficLights({ onClose }: { onClose: () => void }) {
  const os = usePlatform();
  if (os !== "macos") return null;

  return (
    <div className="flex items-center gap-2 group mr-3">
      <button
        onClick={onClose}
        className="w-3.5 h-3.5 rounded-full bg-[#FF5F57] hover:brightness-90 flex items-center justify-center"
        aria-label="关闭"
      >
        <span className="text-[9px] leading-none text-[#4A0002] opacity-0 group-hover:opacity-100 font-bold">
          ×
        </span>
      </button>
      <span
        className="w-3.5 h-3.5 rounded-full bg-[#E8E8E8] dark:bg-[#505050]"
        aria-hidden="true"
      />
      <span
        className="w-3.5 h-3.5 rounded-full bg-[#E8E8E8] dark:bg-[#505050]"
        aria-hidden="true"
      />
    </div>
  );
}

export function SettingsModal({ open }: SettingsModalProps) {
  const closeSettings = useUIStore((s) => s.closeSettings);
  const os = usePlatform();
  const [activeTab, setActiveTab] = useState<Tab>("ai");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeSettings}
      />
      <div className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center px-5 py-3 border-b border-border">
          <TrafficLights onClose={closeSettings} />
          <h2 className="flex-1 text-sm font-semibold text-center">设置</h2>
          {os !== "macos" && (
            <button
              onClick={closeSettings}
              className="p-1 hover:bg-muted rounded-md text-muted-foreground"
              aria-label="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-0 border-b border-border px-5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                "px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
                activeTab === tab.key
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {activeTab === "general" && <GeneralTab />}
          {activeTab === "ai" && <AITab />}
          {activeTab === "about" && <AboutTab />}
        </div>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={[
        "relative w-9 h-5 rounded-full transition-colors shrink-0",
        checked ? "bg-emerald" : "bg-muted",
      ].join(" ")}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={[
          "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-xs font-medium">{label}</div>
        {description && (
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {description}
          </div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function GeneralTab() {
  return (
    <div className="space-y-1 divide-y divide-border">
      <SettingRow label="界面语言" description="选择界面显示语言">
        <span className="text-xs text-muted-foreground">简体中文</span>
      </SettingRow>
      <SettingRow label="主题" description="切换深色/浅色模式">
        <span className="text-xs text-muted-foreground">跟随系统</span>
      </SettingRow>
    </div>
  );
}

// ── AI Tab ──
function AITab() {
  const store = useAIStore();
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(
    null,
  );
  const [isNewProvider, setIsNewProvider] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleAddPreset = (preset: Omit<AIProvider, "id">) => {
    setIsNewProvider(true);
    setEditingProvider({ ...preset, id: "" });
    setShowAddMenu(false);
  };

  const handleAddCustom = () => {
    setIsNewProvider(true);
    setEditingProvider({
      id: "",
      name: "自定义提供商",
      endpoint: "",
      modelId: "",
      maxTokens: 2048,
      hasApiKey: false,
    });
    setShowAddMenu(false);
  };

  return (
    <div className="space-y-5">
      {/* 开关 */}
      <div className="space-y-1 divide-y divide-border">
        <SettingRow
          label="启用 AI 助教"
          description="关闭后将隐藏AI侧边栏和相关功能"
        >
          <Toggle checked={store.enabled} onChange={store.setEnabled} />
        </SettingRow>
        <SettingRow
          label="显示错误信息"
          description="在AI面板中显示请求错误详情"
        >
          <Toggle checked={store.showError} onChange={store.setShowError} />
        </SettingRow>
      </div>

      {/* 活动提供商 */}
      <div className="flex items-center justify-between py-3 border-t border-border">
        <div className="text-xs font-medium">活动提供商</div>
        <select
          value={store.activeProviderId}
          onChange={(e) => store.setActiveProviderId(e.target.value)}
          className="w-48 h-8 text-xs rounded-md bg-surface-elevated border border-border px-2 outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value="">无</option>
          {store.providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* 提供商配置 */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            提供商配置
          </div>
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-md border border-border hover:bg-muted transition-colors"
            >
              <Plus className="w-3 h-3" />
              添加提供商
              <ChevronDown className="w-3 h-3" />
            </button>
            {showAddMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-lg shadow-lg z-10 py-1">
                {BUILT_IN_PROVIDERS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => handleAddPreset(p)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-elevated transition-colors"
                  >
                    {p.name}
                  </button>
                ))}
                <div className="h-px bg-border my-1" />
                <button
                  onClick={handleAddCustom}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-elevated transition-colors"
                >
                  自定义提供商
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          {store.providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => {
                setIsNewProvider(false);
                setEditingProvider({ ...provider });
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 border border-border rounded-lg hover:bg-surface-elevated transition-colors text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium">{provider.name}</div>
                <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {provider.endpoint || "未配置 Endpoint"}
                </div>
              </div>
              {provider.hasApiKey && (
                <span className="text-[10px] text-emerald px-1.5 py-0.5 rounded bg-emerald/10 shrink-0 ml-2">
                  已配置
                </span>
              )}
            </button>
          ))}
          {store.providers.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-4">
              暂无已配置的提供商
            </div>
          )}
        </div>
      </div>

      {/* Provider editor dialog */}
      {editingProvider && (
        <ProviderEditorDialog
          provider={editingProvider}
          isNew={isNewProvider}
          onSave={(p) => {
            if (isNewProvider) store.addProvider(p);
            else store.updateProvider(p.id, p);
            setEditingProvider(null);
          }}
          onRemove={
            !isNewProvider
              ? () => {
                  store.removeProvider(editingProvider.id);
                  setEditingProvider(null);
                }
              : undefined
          }
          onClose={() => setEditingProvider(null)}
        />
      )}

      {/* 行内建议 */}
      <div className="space-y-1 divide-y divide-border border-t border-border pt-4">
        <SettingRow label="行内建议" description="在输入时启动内联建议">
          <Toggle
            checked={store.inlineSuggestions}
            onChange={store.setInlineSuggestions}
          />
        </SettingRow>
        {store.inlineSuggestions && (
          <SettingRow
            label="Debounce 延迟"
            description="输入停止后等待多久触发建议"
          >
            <input
              type="number"
              min={50}
              max={5000}
              step={50}
              value={store.debounceMs}
              onChange={(e) =>
                store.setDebounceMs(
                  Math.min(5000, Math.max(50, +e.target.value)),
                )
              }
              className="w-24 h-7 text-xs text-right rounded-md bg-surface-elevated border border-border px-2 outline-none focus:ring-2 focus:ring-ring/40"
            />
          </SettingRow>
        )}
      </div>

      {/* 上下文 */}
      <div className="space-y-1 divide-y divide-border border-t border-border pt-4">
        <SettingRow
          label="上下文窗口大小"
          description="发送给AI的最大上下文令牌数"
        >
          <input
            type="number"
            value={store.contextWindowSize}
            onChange={(e) =>
              store.setContextWindowSize(Math.max(256, +e.target.value))
            }
            className="w-24 h-7 text-xs text-right rounded-md bg-surface-elevated border border-border px-2 outline-none focus:ring-2 focus:ring-ring/40"
          />
        </SettingRow>
      </div>

      {/* 隐私 */}
      <div className="border-t border-border pt-4">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
          隐私
        </div>
        <SettingRow label="连接策略" description="选择AI数据处理方式">
          <select
            value={store.privacyMode}
            onChange={(e) =>
              store.setPrivacyMode(
                e.target.value as "local" | "cloud" | "hybrid",
              )
            }
            className="w-32 h-7 text-xs rounded-md bg-surface-elevated border border-border px-2 outline-none focus:ring-2 focus:ring-ring/40"
          >
            <option value="local">本地优先</option>
            <option value="cloud">云端</option>
            <option value="hybrid">混合模式</option>
          </select>
        </SettingRow>
      </div>
    </div>
  );
}

function formatTestError(raw: string): string {
  if (/ECONNREFUSED|connection refused/i.test(raw)) return "无法连接到服务器";
  if (/timeout|ETIMEDOUT/i.test(raw)) return "连接超时";
  const m = raw.match(/HTTP\s*(\d+)/);
  if (m) {
    const code = +m[1];
    if (code === 401) return "API 密钥无效或已过期";
    if (code === 403) return "访问被拒绝";
    if (code === 404) return "Endpoint 或模型不存在";
    if (code === 429) return "请求频率超限";
    if (code >= 500) return "服务器错误";
    return `请求失败 (HTTP ${code})`;
  }
  return raw.length > 40 ? raw.slice(0, 40) + "…" : raw;
}

// ── Provider config per provider type ──
const PROVIDER_CONFIG: Record<
  string,
  {
    hasApiKey: boolean;
    hasEndpoint: boolean;
    hasReasoning: boolean;
    autoDetect: boolean;
    hasTelemetry?: boolean;
  }
> = {
  OpenAI: {
    hasApiKey: true,
    hasEndpoint: true,
    hasReasoning: true,
    autoDetect: false,
  },
  Claude: {
    hasApiKey: true,
    hasEndpoint: true,
    hasReasoning: true,
    autoDetect: false,
  },
  OpenRouter: {
    hasApiKey: true,
    hasEndpoint: true,
    hasReasoning: true,
    autoDetect: false,
  },
  Gemini: {
    hasApiKey: true,
    hasEndpoint: true,
    hasReasoning: true,
    autoDetect: false,
  },
  "GitHub Copilot": {
    hasApiKey: false,
    hasEndpoint: false,
    hasReasoning: false,
    autoDetect: true,
    hasTelemetry: true,
  },
  Ollama: {
    hasApiKey: false,
    hasEndpoint: true,
    hasReasoning: false,
    autoDetect: true,
  },
};

const PROVIDER_MODELS: Record<string, string[]> = {
  OpenAI: [
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    "gpt-4o",
    "gpt-4o-mini",
    "o3",
    "o3-mini",
    "o4-mini",
  ],
  Claude: [
    "claude-sonnet-4-20250514",
    "claude-opus-4-20250514",
    "claude-3-5-haiku-20241022",
  ],
  Gemini: [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ],
  OpenRouter: [
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "anthropic/claude-sonnet-4",
    "google/gemini-2.0-flash",
  ],
  "GitHub Copilot": ["gpt-4o", "gpt-4o-mini", "gpt-4", "o1-mini"],
  Ollama: ["llama3.2", "llama3.1", "mistral", "codellama", "qwen2.5", "phi3"],
};

// ── Provider Editor Dialog ──
function ProviderEditorDialog({
  provider,
  isNew,
  onSave,
  onRemove,
  onClose,
}: {
  provider: AIProvider;
  isNew: boolean;
  onSave: (p: AIProvider) => void;
  onRemove?: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...provider });
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [testMsg, setTestMsg] = useState("");
  const [fetchingModels, setFetchingModels] = useState(false);
  const [githubTelemetry, setGithubTelemetry] = useState(true);

  const config = PROVIDER_CONFIG[form.name] ?? {
    hasApiKey: true,
    hasEndpoint: true,
    hasReasoning: true,
    autoDetect: false,
  };
  const isCustom = !PROVIDER_CONFIG[form.name];

  const update = (fields: Partial<AIProvider>) =>
    setForm((prev) => ({ ...prev, ...fields }));

  const allModels = [
    ...new Set([
      ...(PROVIDER_MODELS[form.name] ?? []),
      ...(form.modelList ?? []),
    ]),
  ];
  const isOther = !allModels.includes(form.modelId);

  const toInput = (): ProviderInput => ({
    id: form.id || Date.now().toString(),
    name: form.name,
    endpoint: form.endpoint,
    apiKey,
    modelId: form.modelId,
    maxTokens: form.maxTokens,
    modelList: form.modelList,
    apiStyle: form.apiStyle,
    reasoningLevel: form.reasoningLevel,
    temperature: form.temperature,
  });

  const handleTestConnection = useCallback(async () => {
    setTestStatus("testing");
    setTestMsg("");
    try {
      const result = await testConnection(toInput());
      if (result.ok) {
        setTestStatus("success");
        setTestMsg("连接成功");
        setFetchingModels(true);
        try {
          const models = await fetchModels(toInput());
          if (models.length > 0) update({ modelList: models });
        } catch {
          /* optional */
        } finally {
          setFetchingModels(false);
        }
      } else {
        setTestStatus("error");
        setTestMsg(
          form.name === "GitHub Copilot"
            ? "未认证，请先登录 GitHub"
            : form.name === "Ollama"
              ? "服务未运行"
              : formatTestError(result.error),
        );
      }
    } catch (err) {
      setTestStatus("error");
      setTestMsg(
        formatTestError(err instanceof Error ? err.message : "连接失败"),
      );
    }
  }, [form, apiKey]);

  // Auto-detect for GitHub Copilot / Ollama on mount
  useEffect(() => {
    if (config.autoDetect && form.endpoint) handleTestConnection();
  }, []);

  const handleSave = async () => {
    const input = toInput();
    // Ensure form.id matches the ID sent to backend
    if (!form.id) setForm((prev) => ({ ...prev, id: input.id }));
    await saveProvider(input);
    onSave({ ...form, id: input.id, hasApiKey: apiKey.length > 0 || form.hasApiKey });
  };

  const handleRemove = async () => {
    if (onRemove) {
      await removeProvider(form.id);
      onRemove();
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
          <h3 className="text-sm font-semibold">
            {isNew
              ? `添加 ${form.name || "自定义提供商"}`
              : `编辑 ${form.name}`}
          </h3>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {/* ── 身份验证 (key-based providers + custom) ── */}
          {config.hasApiKey && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                身份验证
              </div>
              <div className="flex items-center justify-between gap-0">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold shrink-0">
                  API Key
                </label>
                <div className="flex items-center">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      form.hasApiKey ? "已保存密钥，输入新密钥可替换" : "sk-..."
                    }
                    className="w-56 h-7 text-xs rounded-l-md bg-surface-elevated border border-border border-r-0 px-2 outline-none focus:ring-2 focus:ring-ring/40"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="px-1.5 h-7 text-[10px] rounded-r-md border border-border hover:bg-muted text-muted-foreground shrink-0"
                  >
                    {showKey ? "隐藏" : "显示"}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus === "testing" || !form.endpoint}
                  className="h-6 px-2 text-[10px] rounded-md border border-border hover:bg-muted transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                >
                  {testStatus === "testing" ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> 测试中
                    </>
                  ) : (
                    "测试连接"
                  )}
                </button>
              </div>
              {testStatus === "success" && (
                <div className="flex items-center gap-1 text-[11px] text-emerald">
                  <Check className="w-3.5 h-3.5" /> {testMsg}
                </div>
              )}
              {testStatus === "error" && (
                <div className="flex items-center gap-1 text-[11px] text-pink">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {testMsg}
                </div>
              )}
            </div>
          )}

          {/* ── 账户 (GitHub Copilot) ── */}
          {form.name === "GitHub Copilot" && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                账户
              </div>
              {testStatus === "success" ? (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald">
                  <Check className="w-3.5 h-3.5" /> 已认证
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground shrink-0">
                    需要认证
                  </div>
                  <button
                    onClick={handleTestConnection}
                    disabled={testStatus === "testing"}
                    className="flex-1 h-7 text-xs rounded-md bg-foreground text-background hover:opacity-90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {testStatus === "testing" ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> 检测中…
                      </>
                    ) : (
                      "使用 GitHub 登录"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── 连接 ── */}
          {config.hasEndpoint && (
            <div className="space-y-2 border-t border-border pt-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                连接
              </div>
              {isCustom && (
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold shrink-0">
                    名称
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update({ name: e.target.value })}
                    placeholder="My Provider"
                    className="w-56 h-7 text-xs rounded-md bg-surface-elevated border border-border px-2 outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold shrink-0">
                  Endpoint
                </label>
                <input
                  type="text"
                  value={form.endpoint}
                  onChange={(e) => update({ endpoint: e.target.value })}
                  placeholder="https://api.openai.com"
                  className="w-56 h-7 text-xs rounded-md bg-surface-elevated border border-border px-2 outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
            </div>
          )}

          {/* ── Model ── */}
          <div className="space-y-2 border-t border-border pt-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
              Model
              {fetchingModels && <Loader2 className="w-3 h-3 animate-spin" />}
            </div>

            <div className="flex items-center justify-between gap-2">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold shrink-0">
                模型
              </label>
              <select
                value={isOther ? "__other__" : form.modelId}
                onChange={(e) => {
                  update({
                    modelId:
                      e.target.value === "__other__" ? "" : e.target.value,
                  });
                }}
                className="w-auto max-w-48 h-7 text-xs rounded-md bg-surface-elevated border border-border px-2 outline-none focus:ring-2 focus:ring-ring/40 truncate"
              >
                {allModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                <option value="__other__">Other</option>
              </select>
            </div>

            {isOther && (
              <div className="flex items-center justify-between gap-2">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold shrink-0">
                  Model ID
                </label>
                <input
                  type="text"
                  value={form.modelId}
                  onChange={(e) => update({ modelId: e.target.value })}
                  placeholder="输入 Model ID"
                  className="w-auto max-w-48 h-7 text-xs rounded-md bg-surface-elevated border border-border px-2 outline-none focus:ring-2 focus:ring-ring/40 truncate"
                />
              </div>
            )}

            {config.hasReasoning && (
              <div className="flex items-center justify-between gap-2">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold shrink-0">
                  Reasoning
                </label>
                <select
                  value={form.reasoningLevel ?? "off"}
                  onChange={(e) =>
                    update({
                      reasoningLevel: e.target.value as
                        | "off"
                        | "low"
                        | "medium"
                        | "high",
                    })
                  }
                  className="w-20 h-7 text-xs rounded-md bg-surface-elevated border border-border px-2 outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <option value="off">Off</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            )}

            {/* Error + reload (GitHub Copilot / Ollama) */}
            {config.autoDetect && testStatus === "error" && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-[11px] text-pink">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {testMsg}
                </div>
                <div className="text-right">
                  <button
                    onClick={handleTestConnection}
                    className="h-6 px-2 text-[10px] rounded-md border border-border hover:bg-muted transition-colors"
                  >
                    重新加载
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Advanced ── */}
          <div className="space-y-2 border-t border-border pt-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Advanced
            </div>

            <div className="flex items-center justify-between gap-2">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold shrink-0">
                最大输出令牌数
              </label>
              <input
                type="number"
                value={form.maxTokens}
                onChange={(e) =>
                  update({ maxTokens: Math.max(1, +e.target.value || 2048) })
                }
                className="w-20 h-7 text-xs text-right rounded-md bg-surface-elevated border border-border px-2 outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>

            {config.hasTelemetry && (
              <div className="flex items-center justify-between py-1">
                <div className="text-xs">像 GitHub 发送遥测数据</div>
                <Toggle
                  checked={githubTelemetry}
                  onChange={setGithubTelemetry}
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center justify-between px-4 py-2 border-t border-border">
          <div>
            {!isNew && (
              <button
                onClick={handleRemove}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-pink hover:bg-pink/10 rounded-md transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                移除提供商
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-xs rounded-md bg-foreground text-background hover:opacity-90 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutTab() {
  return (
    <div className="space-y-4 text-xs">
      <div className="text-center py-6">
        <div className="text-lg font-semibold">EduVision AI</div>
        <div className="text-muted-foreground mt-1">v0.1.0</div>
      </div>
      <div className="text-muted-foreground leading-relaxed">
        EduVision AI
        是一款面向小初高中学数学、物理、化学的交互式可视化教学工具。通过动态图形帮助学生直观理解公式背后的几何意义与物理过程。
      </div>
      <div className="border-t border-border pt-3 text-muted-foreground">
        <div>为中华崛起而读书！</div>
      </div>
    </div>
  );
}
