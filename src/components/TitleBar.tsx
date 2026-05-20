import { useEffect, useRef, useState, useCallback } from "react";
import { Search, Plus, PanelLeft, Sparkles, GripVertical, X } from "lucide-react";
import {
  SUBJECT_LABELS,
  STAGE_LABELS,
  STAGES,
  SUBJECTS,
  hasTopicsFor,
  type Subject,
  type Stage,
  type ParamDef,
} from "@/lib/topics";
import { useUIStore } from "@/lib/ui-store";
import { usePlatform } from "@/hooks/use-platform";
import { ParamSlider } from "@/components/ParamSlider";

interface TitleBarProps {
  subject: Subject;
  stage: Stage;
  onSubjectChange: (subject: Subject) => void;
  onStageChange: (stage: Stage) => void;
  params: Record<string, number>;
  topicParams: ParamDef[];
  onParamChange: (key: string, value: number) => void;
}

export function TitleBar({
  subject,
  stage,
  onSubjectChange,
  onStageChange,
  params,
  topicParams,
  onParamChange,
}: TitleBarProps) {
  const { leftOpen, rightOpen, toggleLeft, toggleRight } = useUIStore();
  const os = usePlatform();

  // 参数弹出面板状态
  const [paramOpen, setParamOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // 浮动面板状态
  const [floating, setFloating] = useState(false);
  const [floatPos, setFloatPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // 点击外部关闭弹出面板
  useEffect(() => {
    if (!paramOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setParamOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [paramOpen]);

  // 拖拽逻辑
  const onDragStart = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      dragOffset.current = {
        x: e.clientX - floatPos.x,
        y: e.clientY - floatPos.y,
      };
      e.preventDefault();
    },
    [floatPos],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setFloatPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };
    const onUp = () => {
      dragging.current = false;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  // 悬浮出来
  const handleFloat = () => {
    setParamOpen(false);
    setFloatPos({ x: window.innerWidth - 320, y: 120 });
    setFloating(true);
  };

  // 关闭浮动面板
  const handleCloseFloat = () => {
    setFloating(false);
  };

  // macOS 交通灯占 ~78px，Windows 窗口按钮占 ~140px
  const toolbarStyle: React.CSSProperties =
    os === "macos"
      ? { paddingLeft: 78 }
      : { paddingRight: 140 };

  return (
    <>
      <div
        className="h-[34px] flex items-center pr-3 gap-2 bg-titlebar border-b border-border select-none shrink-0"
        style={toolbarStyle}
      >
        {/* 侧边栏开关 */}
        <button
          onClick={toggleLeft}
          className={[
            "ml-2 p-1.5 rounded-md transition-colors",
            leftOpen
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted",
          ].join(" ")}
          aria-label="折叠侧边栏"
          aria-pressed={leftOpen}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* 左侧拖拽区域 */}
        <div data-tauri-drag-region className="w-4 h-full shrink-0" />

        {/* 学段切换 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface-elevated rounded-full p-0.5 border border-border shadow-sm">
            {STAGES.map((stageOption) => {
              const isAvailable = hasTopicsFor(subject, stageOption);
              const isActive = stageOption === stage;
              return (
                <button
                  key={stageOption}
                  onClick={isAvailable ? () => onStageChange(stageOption) : undefined}
                  disabled={!isAvailable}
                  className={[
                    "px-3 py-1 text-xs rounded-full transition-colors font-medium",
                    isActive
                      ? "bg-emerald text-emerald-foreground"
                      : isAvailable
                        ? "text-muted-foreground hover:text-foreground"
                        : "text-muted-foreground/40 cursor-not-allowed",
                  ].join(" ")}
                >
                  {STAGE_LABELS[stageOption]}
                </button>
              );
            })}
          </div>

          {/* 学科切换 */}
          <div className="flex items-center bg-surface-elevated rounded-full p-0.5 border border-border shadow-sm">
            {SUBJECTS.map((subjectOption) => {
              const isAvailable = hasTopicsFor(subjectOption, stage);
              const isActive = subjectOption === subject;
              return (
                <button
                  key={subjectOption}
                  onClick={isAvailable ? () => onSubjectChange(subjectOption) : undefined}
                  disabled={!isAvailable}
                  className={[
                    "px-3 py-1 text-xs rounded-full transition-colors font-medium",
                    isActive
                      ? "bg-foreground text-background"
                      : isAvailable
                        ? "text-muted-foreground hover:text-foreground"
                        : "text-muted-foreground/40 cursor-not-allowed",
                  ].join(" ")}
                >
                  {SUBJECT_LABELS[subjectOption]}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-muted-foreground ml-2">
            EduVision <span className="text-foreground font-semibold">AI</span>
          </div>
        </div>

        {/* 右侧拖拽区域 */}
        <div data-tauri-drag-region className="flex-1 h-full" />

        {/* 搜索 / 新建 / AI */}
        <div className="flex items-center gap-1 text-muted-foreground relative">
          <button className="p-1.5 hover:bg-muted rounded-md" aria-label="搜索">
            <Search className="w-4 h-4" />
          </button>
          <button
            ref={btnRef}
            onClick={() => setParamOpen((v) => !v)}
            className={[
              "p-1.5 rounded-md transition-colors",
              paramOpen ? "bg-blue/15 text-blue" : "hover:bg-muted",
            ].join(" ")}
            aria-label="参数控制"
            aria-pressed={paramOpen}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={toggleRight}
            className={[
              "p-1.5 rounded-md transition-colors",
              rightOpen ? "bg-blue/15 text-blue" : "hover:bg-muted",
            ].join(" ")}
            aria-label="AI 助教"
            aria-pressed={rightOpen}
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* 参数弹出面板 */}
          {paramOpen && topicParams.length > 0 && (
            <div
              ref={popoverRef}
              className="absolute right-0 top-full mt-1 w-72 bg-surface-elevated border border-border rounded-lg shadow-lg z-50 overflow-hidden"
            >
              <div className="px-4 pt-3 pb-2">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                  参数控制
                </div>
                <div className="space-y-3">
                  {topicParams.map((paramDef) => (
                    <ParamSlider
                      key={paramDef.key}
                      def={paramDef}
                      value={params[paramDef.key] ?? paramDef.default}
                      onChange={(v) => onParamChange(paramDef.key, v)}
                    />
                  ))}
                </div>
              </div>
              <div className="border-t border-border">
                <button
                  onClick={handleFloat}
                  className="w-full px-4 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                  悬浮出来
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 浮动参数面板 */}
      {floating && (
        <div
          className="fixed z-50 w-72 bg-surface-elevated border border-border rounded-lg shadow-2xl overflow-hidden"
          style={{ left: floatPos.x, top: floatPos.y }}
        >
          <div
            ref={dragRef}
            onMouseDown={onDragStart}
            className="flex items-center justify-between px-4 py-2 bg-surface cursor-move border-b border-border"
          >
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              参数控制
            </span>
            <button
              onClick={handleCloseFloat}
              className="p-1 hover:bg-muted rounded-md text-muted-foreground"
              aria-label="关闭"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="px-4 py-3 space-y-3 max-h-[60vh] overflow-y-auto">
            {topicParams.map((paramDef) => (
              <ParamSlider
                key={paramDef.key}
                def={paramDef}
                value={params[paramDef.key] ?? paramDef.default}
                onChange={(v) => onParamChange(paramDef.key, v)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
