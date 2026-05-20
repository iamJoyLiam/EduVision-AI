import { useMemo, useState } from "react";
import { Search, FunctionSquare, Settings } from "lucide-react";
import { type Topic } from "@/lib/topics";
import { useUIStore } from "@/lib/ui-store";

interface FormulaSidebarProps {
  topics: Topic[];
  activeId?: string;
  onSelect: (id: string) => void;
}

export function FormulaSidebar({ topics, activeId, onSelect }: FormulaSidebarProps) {
  const [query, setQuery] = useState("");
  const leftOpen = useUIStore((s) => s.leftOpen);
  const openSettings = useUIStore((s) => s.openSettings);

  const grouped = useMemo(() => {
    const filtered = topics.filter(
      (t) =>
        !query ||
        t.title.includes(query) ||
        t.formula.includes(query) ||
        t.group.includes(query),
    );
    const map = new Map<string, Topic[]>();
    for (const t of filtered) {
      const arr = map.get(t.group) ?? [];
      arr.push(t);
      map.set(t.group, arr);
    }
    return Array.from(map.entries());
  }, [topics, query]);

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
              placeholder="筛选公式..."
              className="w-full h-8 pl-8 pr-2 text-xs rounded-md bg-surface-elevated border border-border outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>

        <div className="px-3 pb-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          公式 · Formulas
        </div>

        <div className="flex-1 overflow-y-auto pb-2">
          {grouped.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              无匹配公式
            </div>
          )}
          {grouped.map(([group, list]) => (
            <div key={group} className="mb-3">
              <div className="px-3 py-1 text-[11px] text-muted-foreground">
                {group}
              </div>
              <div className="space-y-0.5 px-1.5">
                {list.map((t) => {
                  const active = t.id === activeId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onSelect(t.id)}
                      className={[
                        "w-full text-left px-2.5 py-2 rounded-md flex items-center gap-2 transition-colors",
                        active
                          ? "bg-surface-elevated shadow-sm border border-border"
                          : "hover:bg-surface-elevated/60 border border-transparent",
                      ].join(" ")}
                    >
                      <FunctionSquare
                        className={
                          "w-3.5 h-3.5 shrink-0 " +
                          (active ? "text-blue" : "text-muted-foreground")
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-foreground truncate">
                          {t.title}
                        </div>
                        <div className="text-[10.5px] text-muted-foreground font-mono truncate">
                          {t.formula}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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
