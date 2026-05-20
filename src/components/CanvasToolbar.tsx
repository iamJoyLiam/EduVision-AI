import { useState } from "react";
import { Download, RotateCcw, Grid3X3, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

interface CanvasToolbarProps {
  onScreenshot: () => void;
  onReset: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function CanvasToolbar({
  onScreenshot,
  onReset,
  showGrid,
  onToggleGrid,
  zoom,
  onZoomIn,
  onZoomOut,
}: CanvasToolbarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const btnClass =
    "w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors";

  return (
    <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-0.5">
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-6 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-elevated/80 transition-colors bg-surface-elevated/60 backdrop-blur-sm"
        aria-label={collapsed ? "展开工具栏" : "折叠工具栏"}
        title={collapsed ? "展开工具栏" : "折叠工具栏"}
      >
        {collapsed ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-0.5 bg-surface-elevated/90 backdrop-blur-sm border border-border rounded-lg p-1 shadow-sm">
          <button onClick={onScreenshot} className={btnClass} aria-label="截图保存" title="截图保存">
            <Download className="w-4 h-4" />
          </button>
          <div className="h-px bg-border my-0.5" />
          <button onClick={onReset} className={btnClass} aria-label="重置参数" title="重置参数">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleGrid}
            className={`${btnClass} ${showGrid ? "bg-muted text-foreground" : ""}`}
            aria-label="切换网格"
            title="切换网格"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <div className="h-px bg-border my-0.5" />
          <button onClick={onZoomIn} className={btnClass} aria-label="放大" title="放大">
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="text-[10px] text-center text-muted-foreground tabular-nums">
            {Math.round(zoom * 100)}%
          </div>
          <button onClick={onZoomOut} className={btnClass} aria-label="缩小" title="缩小">
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
