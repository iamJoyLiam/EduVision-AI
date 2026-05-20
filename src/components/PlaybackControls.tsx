import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface PlaybackControlsProps {
  isPlaying: boolean;
  progress: number;
  speed: number;
  step: number;
  totalSteps: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onSpeedChange: (speed: number) => void;
}

const SPEED_OPTIONS = [0.5, 1, 2];

export function PlaybackControls({
  isPlaying,
  progress,
  speed,
  step,
  totalSteps,
  onPlay,
  onPause,
  onReset,
  onStepForward,
  onStepBackward,
  onSpeedChange,
}: PlaybackControlsProps) {
  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-blue rounded-full transition-[width] duration-100"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onStepBackward}
          disabled={step === 0}
          className="h-8 w-8 rounded-md border border-border bg-card hover:bg-muted flex items-center justify-center disabled:opacity-40"
          aria-label="上一步"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={isPlaying ? onPause : onPlay}
          className="h-8 w-8 rounded-md border border-border bg-card hover:bg-muted flex items-center justify-center"
          aria-label={isPlaying ? "暂停" : "播放"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={onStepForward}
          disabled={step >= totalSteps - 1}
          className="h-8 w-8 rounded-md border border-border bg-card hover:bg-muted flex items-center justify-center disabled:opacity-40"
          aria-label="下一步"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={onReset}
          className="h-8 w-8 rounded-md border border-border bg-card hover:bg-muted flex items-center justify-center"
          aria-label="重置"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1" />

        {/* Speed selector */}
        <div className="flex items-center bg-surface-elevated rounded-full p-0.5 border border-border">
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => onSpeedChange(opt)}
              className={[
                "px-2 py-0.5 text-[10px] rounded-full transition-colors font-medium",
                speed === opt
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {opt}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
