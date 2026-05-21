import * as React from "react";

// ── 共享类型 ──

export type ParamMap = Record<string, number>;

export interface Point {
  x: number;
  y: number;
}

export interface PlaybackState {
  isPlaying: boolean;
  step: number;
  elapsed: number;
  progress: number;
  speed: number;
}

export interface VizProps {
  params: ParamMap;
  playback?: PlaybackState;
}

export interface VisSpec {
  component: React.ComponentType<VizProps>;
  supportsAnimation: boolean;
}

// ── rAF 节流 Hook ──

/**
 * Coalesces rapid value updates into one render per animation frame.
 * Prevents data races when sliders fire onChange at high frequency.
 */
export function useRafValue<T>(value: T): T {
  const latestRef = React.useRef(value);
  const [rendered, setRendered] = React.useState(value);
  const rafRef = React.useRef(0);

  React.useEffect(() => {
    latestRef.current = value;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setRendered(latestRef.current);
    });
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return rendered;
}

// ── 曲线路径构建 ──

/**
 * Build an SVG path string for y = f(x), skipping out-of-bounds points.
 * Pure function — no side effects, no interpolation.
 */
export function buildCurvePath(
  curveFn: (x: number) => number | null,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  svgWidth: number,
  svgHeight: number,
  step: number = 0.1,
): string {
  const segs: string[] = [];
  const yLo = yMin - 5;
  const yHi = yMax + 5;
  const steps = Math.round((xMax - xMin) / step);
  let inBounds = false;

  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * step;
    const y = curveFn(x);

    if (y === null || !isFinite(y) || y < yLo || y > yHi) {
      inBounds = false;
      continue;
    }

    const p = toSvgPixel(x, y, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
    if (!inBounds) {
      segs.push(`M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
      inBounds = true;
    } else {
      segs.push(`L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`);
    }
  }

  return segs.join(" ");
}

// ── 坐标转换 ──

/** 将数学坐标转为 SVG 像素坐标 */
export function toSvgPixel(
  mathX: number,
  mathY: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  svgWidth: number,
  svgHeight: number,
): Point {
  return {
    x: ((mathX - xMin) / (xMax - xMin)) * svgWidth,
    y: svgHeight - ((mathY - yMin) / (yMax - yMin)) * svgHeight,
  };
}

// ── 可复用的 SVG 坐标轴 ──

export interface AxesProps {
  svgWidth: number;
  svgHeight: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export function Axes({ svgWidth, svgHeight, xMin, xMax, yMin, yMax }: AxesProps) {
  const origin = toSvgPixel(0, 0, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
  const tickElements: React.JSX.Element[] = [];

  // X axis ticks + labels
  for (let tick = Math.ceil(xMin); tick <= Math.floor(xMax); tick++) {
    if (tick === 0) continue;
    const px = ((tick - xMin) / (xMax - xMin)) * svgWidth;
    tickElements.push(
      <line key={`xt${tick}`} x1={px} y1={origin.y - 3} x2={px} y2={origin.y + 3} stroke="currentColor" />,
    );
    const labelY = Math.min(origin.y + 14, svgHeight - 4);
    tickElements.push(
      <text key={`xl${tick}`} x={px} y={labelY} textAnchor="middle" fontSize={10} className="fill-current">
        {tick}
      </text>,
    );
  }
  // Y axis ticks + labels
  for (let tick = Math.ceil(yMin); tick <= Math.floor(yMax); tick++) {
    if (tick === 0) continue;
    const py = svgHeight - ((tick - yMin) / (yMax - yMin)) * svgHeight;
    tickElements.push(
      <line key={`yt${tick}`} x1={origin.x - 3} y1={py} x2={origin.x + 3} y2={py} stroke="currentColor" />,
    );
    const labelX = Math.max(origin.x - 6, 4);
    tickElements.push(
      <text key={`yl${tick}`} x={labelX} y={py + 3} textAnchor="end" fontSize={10} className="fill-current">
        {tick}
      </text>,
    );
  }
  // Origin label
  if (xMin < 0 && xMax > 0 && yMin < 0 && yMax > 0) {
    tickElements.push(
      <text key="origin" x={origin.x - 6} y={origin.y + 14} textAnchor="end" fontSize={10} className="fill-current">
        0
      </text>,
    );
  }

  return (
    <g className="text-muted-foreground/40">
      {Array.from({ length: 20 }, (_, idx) => {
        const gx = (idx / 20) * svgWidth;
        return <line key={`gx${idx}`} x1={gx} y1={0} x2={gx} y2={svgHeight} stroke="currentColor" strokeWidth={0.3} />;
      })}
      {Array.from({ length: 14 }, (_, idx) => {
        const gy = (idx / 14) * svgHeight;
        return <line key={`gy${idx}`} x1={0} y1={gy} x2={svgWidth} y2={gy} stroke="currentColor" strokeWidth={0.3} />;
      })}
      <line x1={0} y1={origin.y} x2={svgWidth} y2={origin.y} stroke="currentColor" strokeWidth={1.2} />
      <line x1={origin.x} y1={0} x2={origin.x} y2={svgHeight} stroke="currentColor" strokeWidth={1.2} />
      {tickElements}
    </g>
  );
}
