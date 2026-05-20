import { Search, Plus, PanelLeft, Sparkles } from "lucide-react";
import {
  SUBJECT_LABELS,
  STAGE_LABELS,
  STAGES,
  SUBJECTS,
  hasTopicsFor,
  type Subject,
  type Stage,
} from "@/lib/topics";
import { useUIStore } from "@/lib/ui-store";
import { usePlatform } from "@/hooks/use-platform";

interface TitleBarProps {
  subject: Subject;
  stage: Stage;
  onSubjectChange: (subject: Subject) => void;
  onStageChange: (stage: Stage) => void;
}

export function TitleBar({
  subject,
  stage,
  onSubjectChange,
  onStageChange,
}: TitleBarProps) {
  const { leftOpen, rightOpen, toggleLeft, toggleRight } = useUIStore();
  const os = usePlatform();

  // macOS 交通灯占 ~78px，Windows 窗口按钮占 ~140px
  const toolbarStyle: React.CSSProperties =
    os === "macos"
      ? { paddingLeft: 78 }
      : { paddingRight: 140 };

  return (
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
      <div className="flex items-center gap-1 text-muted-foreground">
        <button className="p-1.5 hover:bg-muted rounded-md" aria-label="搜索">
          <Search className="w-4 h-4" />
        </button>
        <button className="p-1.5 hover:bg-muted rounded-md" aria-label="新建">
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
      </div>
    </div>
  );
}
