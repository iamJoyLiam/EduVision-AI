import { useEffect, useMemo, useRef, useState } from "react";
import { TitleBar } from "@/components/TitleBar";
import { FormulaSidebar } from "@/components/FormulaSidebar";
import { SolveHistory } from "@/components/SolveHistory";
import { SolvePanel } from "@/components/SolvePanel";
import { AIPanel } from "@/components/AIPanel";
import { CanvasToolbar } from "@/components/CanvasToolbar";
import { SettingsModal } from "@/components/SettingsModal";
import * as db from "@/lib/db";
import { useAIStore } from "@/lib/ai-store";
import {
  topicsFor,
  SUBJECT_LABELS,
  STAGE_LABELS,
  hasTopicsFor,
  type Subject,
  type Stage,
} from "@/lib/topics";
import { VIZ } from "@/visualizations";
import { usePlayback } from "@/visualizations/use-playback";
import { PlaybackControls } from "@/components/PlaybackControls";
import { useUIStore } from "@/lib/ui-store";
import { useSolveStore } from "@/lib/solve-store";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Lightbulb,
} from "lucide-react";

/** 找到第一个有内容的学段 */
function findDefaultStage(subject: Subject): Stage {
  const stages: Stage[] = ["primary", "junior", "senior"];
  return stages.find((s) => hasTopicsFor(subject, s)) ?? "junior";
}

export default function App() {
  // Initialize SQLite and hydrate stores
  useEffect(() => {
    db.init().then(() => {
      useAIStore.getState().hydrate();
      useSolveStore.getState().loadFromDb();
    });
    return () => {
      db.flushSettings();
      db.flushAllSessions();
      db.flushSolveSessions();
    };
  }, []);

  const [subject, setSubject] = useState<Subject>("math");
  const [stage, setStage] = useState<Stage>("junior");
  const [activeTopicId, setActiveTopicId] = useState<string | undefined>();

  const topics = useMemo(() => topicsFor(subject, stage), [subject, stage]);
  const activeTopic = useMemo(
    () => topics.find((t) => t.id === activeTopicId) ?? topics[0],
    [topics, activeTopicId],
  );

  // 用户滑块覆盖值（仅存储用户手动调整过的参数）
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [stepIdx, setStepIdx] = useState(0);

  // 画布工具栏状态
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const { bottomOpen, toggleBottom, settingsOpen, mode } = useUIStore();

  // 从 activeTopic 默认值 + 用户覆盖合并出实际参数，保证同一帧更新
  const params: Record<string, number> = useMemo(() => {
    if (!activeTopic) return {};
    const defaults = Object.fromEntries(
      activeTopic.params.map((p) => [p.key, p.default]),
    );
    return { ...defaults, ...overrides };
  }, [activeTopic, overrides]);

  // 主题切换时重置用户覆盖与步骤
  useEffect(() => {
    setOverrides({});
    setStepIdx(0);
    setZoom(1);
    setShowGrid(false);
  }, [activeTopic?.id]);

  const isAnimated = activeTopic?.animated ?? false;
  const playback = usePlayback({
    totalSteps: activeTopic?.steps?.length ?? 1,
    duration: activeTopic?.animationDuration ?? 5,
    resetDeps: [activeTopic?.id],
    loop: activeTopic?.componentKey === "projectile",
  });

  const currentStep = isAnimated ? playback.step : stepIdx;

  // 学科/学段切换时，若当前学段无内容则跳转到有内容的学段
  useEffect(() => {
    if (!hasTopicsFor(subject, stage)) {
      setStage(findDefaultStage(subject));
    }
  }, [subject, stage]);

  // 工具栏操作
  const handleScreenshot = () => {
    const el = canvasRef.current;
    if (!el) return;
    const svg = el.querySelector("svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTopic?.title ?? "visualization"}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setOverrides({});
    setZoom(1);
    setShowGrid(false);
  };

  // ── Solve mode ──
  if (mode === "solve") {
    return (
      <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
        <TitleBar
          subject={subject}
          stage={stage}
          onSubjectChange={setSubject}
          onStageChange={setStage}
          params={{}}
          topicParams={[]}
          onParamChange={() => {}}
        />
        <div className="flex-1 flex min-h-0">
          <SolveHistory />
          <SolvePanel />
        </div>
        <SettingsModal open={settingsOpen} />
      </div>
    );
  }

  // ── Browse mode ──
  if (!activeTopic) {
    return (
      <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
        <TitleBar
          subject={subject}
          stage={stage}
          onSubjectChange={setSubject}
          onStageChange={setStage}
          params={{}}
          topicParams={[]}
          onParamChange={() => {}}
        />
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          本学段暂无内容
        </div>
      </div>
    );
  }

  const VizComponent = VIZ[activeTopic.componentKey];

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <TitleBar
        subject={subject}
        stage={stage}
        onSubjectChange={setSubject}
        onStageChange={setStage}
        params={params}
        topicParams={activeTopic.params}
        onParamChange={(key, value) =>
          setOverrides((prev) => ({ ...prev, [key]: value }))
        }
      />

      <div className="flex-1 flex min-h-0">
        <FormulaSidebar
          topics={topics}
          activeId={activeTopic.id}
          onSelect={setActiveTopicId}
        />

        <main className="flex-1 flex flex-col min-w-0 bg-background">
          {/* 主题标题 */}
          <div className="px-6 pt-5 pb-3 border-b border-border bg-surface">
            <div className="text-[11px] text-muted-foreground tracking-wide">
              {STAGE_LABELS[stage]} · {SUBJECT_LABELS[subject]} ·{" "}
              {activeTopic.group}
            </div>
            <div className="mt-1 flex items-baseline gap-3">
              <h1 className="text-xl font-semibold">{activeTopic.title}</h1>
              <span className="font-mono text-sm text-muted-foreground">
                {activeTopic.formula}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {activeTopic.description}
            </p>
          </div>

          {/* 可视化画布 */}
          <div ref={canvasRef} className="flex-1 p-6 min-h-0 relative">
            <div
              className="w-full h-full bg-card border border-border rounded-2xl shadow-sm overflow-hidden relative"
              style={{
                backgroundImage: showGrid
                  ? "radial-gradient(circle, var(--border) 1px, transparent 1px)"
                  : undefined,
                backgroundSize: showGrid ? "20px 20px" : undefined,
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                }}
              >
                {VizComponent ? (
                  <VizComponent
                    params={params}
                    playback={isAnimated ? playback : undefined}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    可视化加载中...
                  </div>
                )}
              </div>
              <CanvasToolbar
                onScreenshot={handleScreenshot}
                onReset={handleReset}
                showGrid={showGrid}
                onToggleGrid={() => setShowGrid((v) => !v)}
                zoom={zoom}
                onZoomIn={() =>
                  setZoom((z) => Math.min(3, +(z + 0.1).toFixed(1)))
                }
                onZoomOut={() =>
                  setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(1)))
                }
              />
            </div>
          </div>

          {/* 底部控制面板 */}
          <div
            className="border-t border-border bg-surface overflow-hidden transition-[max-height] duration-300 ease-out"
            style={{ maxHeight: bottomOpen ? "400px" : "40px" }}
          >
            {/* 折叠按钮栏 */}
            <button
              onClick={toggleBottom}
              className="w-full h-10 px-6 flex items-center justify-between text-xs text-muted-foreground hover:bg-surface-elevated transition-colors"
            >
              <span className="font-semibold tracking-wide">控制面板</span>
              {bottomOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>

            {/* 面板内容 */}
            <div className="px-6 pb-4 grid grid-cols-3 gap-6">
              {/* 分步演示 */}
              <div className="col-span-2 space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
                  <span>分步演示</span>
                  <span className="text-muted-foreground/70 normal-case tracking-normal">
                    {activeTopic.steps
                      ? `${currentStep + 1} / ${activeTopic.steps.length}`
                      : ""}
                  </span>
                </div>
                <div className="bg-card border border-border rounded-lg p-3 min-h-22 text-sm">
                  {activeTopic.steps?.[currentStep] ?? "—"}
                </div>
                {isAnimated ? (
                  <PlaybackControls
                    isPlaying={playback.isPlaying}
                    progress={playback.progress}
                    speed={playback.speed}
                    step={playback.step}
                    totalSteps={activeTopic.steps?.length ?? 1}
                    onPlay={playback.play}
                    onPause={playback.pause}
                    onReset={playback.reset}
                    onStepForward={playback.stepForward}
                    onStepBackward={playback.stepBackward}
                    onSpeedChange={playback.setSpeed}
                  />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        setStepIdx((prev) => Math.max(0, prev - 1))
                      }
                      className="h-8 w-8 rounded-md border border-border bg-card hover:bg-muted flex items-center justify-center"
                      aria-label="上一步"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setStepIdx((prev) =>
                          Math.min(
                            (activeTopic.steps?.length ?? 1) - 1,
                            prev + 1,
                          ),
                        )
                      }
                      className="h-8 w-8 rounded-md border border-border bg-card hover:bg-muted flex items-center justify-center"
                      aria-label="下一步"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setStepIdx(0)}
                      className="h-8 px-3 rounded-md border border-border bg-card hover:bg-muted flex items-center gap-1.5 text-xs"
                    >
                      <Play className="w-3.5 h-3.5" />
                      重新讲解
                    </button>
                  </div>
                )}
              </div>

              {/* 教学提示 */}
              <div className="col-span-1 space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  教学提示
                </div>
                <div className="bg-[oklch(0.97_0.04_95)] border border-[oklch(0.85_0.08_95)] rounded-lg p-3 text-xs leading-relaxed flex gap-2">
                  <Lightbulb className="w-4 h-4 shrink-0 text-[oklch(0.6_0.15_75)]" />
                  <span className="text-[oklch(0.35_0.05_75)]">
                    {activeTopic.hint ?? "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>

        <AIPanel
          context={`${STAGE_LABELS[stage]} · ${SUBJECT_LABELS[subject]} · ${activeTopic.group} · ${activeTopic.title}（${activeTopic.formula}）`}
        />
      </div>

      <SettingsModal open={settingsOpen} />
    </div>
  );
}
