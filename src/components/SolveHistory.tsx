import { Search, BrainCircuit, Settings, Trash2 } from "lucide-react";
import { useUIStore } from "@/lib/ui-store";
import { useSolveStore } from "@/lib/solve-store";
import { useState, useMemo } from "react";

export function SolveHistory() {
  const leftOpen = useUIStore((s) => s.leftOpen);
  const openSettings = useUIStore((s) => s.openSettings);
  const { sessions, activeSessionId, setActiveSessionId, deleteSession } =
    useSolveStore();
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      sessions.filter(
        (s) =>
          !query ||
          s.title.includes(query) ||
          s.originalPrompt.includes(query),
      ),
    [sessions, query],
  );

  return (
    <aside
      className={[
        "shrink-0 bg-sidebar border-r border-border flex flex-col h-full overflow-hidden transition-[width] duration-200 ease-out",
        leftOpen ? "w-64" : "w-0",
      ].join(" ")}
    >
      <div className="w-64 flex flex-col h-full min-h-0">
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索解题记录..."
              className="w-full h-8 pl-8 pr-2 text-xs rounded-md bg-surface-elevated border border-border outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>

        <div className="px-3 pb-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          解题历史 · History
        </div>

        <div className="flex-1 overflow-y-auto pb-2">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              {sessions.length === 0
                ? "输入题目开始解题"
                : "无匹配记录"}
            </div>
          )}
          <div className="space-y-0.5 px-1.5">
            {filtered.map((s) => {
              const active = s.id === activeSessionId;
              return (
                <div key={s.id} className="group relative">
                  <button
                    onClick={() => setActiveSessionId(s.id)}
                    className={[
                      "w-full text-left px-2.5 py-2 rounded-md flex items-center gap-2 transition-colors",
                      active
                        ? "bg-surface-elevated shadow-sm border border-border"
                        : "hover:bg-surface-elevated/60 border border-transparent",
                    ].join(" ")}
                  >
                    <BrainCircuit
                      className={
                        "w-3.5 h-3.5 shrink-0 " +
                        (active ? "text-pink" : "text-muted-foreground")
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-foreground truncate">
                        {s.title}
                      </div>
                      <div className="text-[10.5px] text-muted-foreground truncate">
                        {formatTime(s.createdAt)}
                        {s.hasVisualization && (
                          <span className="ml-1.5 text-pink">
                            &#9632; 图形
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(s.id);
                    }}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground transition-opacity"
                    aria-label="删除"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 border-t border-border p-2">
          <button
            onClick={openSettings}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition-colors"
            aria-label="设置"
          >
            <Settings className="w-3.5 h-3.5" />
            设置
          </button>
        </div>
      </div>
    </aside>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}
