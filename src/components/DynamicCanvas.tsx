import { useMemo, useRef, useState, useEffect } from "react";
import type { VisualizationConfig } from "@/lib/solve-schema";
import {
  Axes,
  buildCurvePath,
  toSvgPixel,
  useRafValue,
} from "@/visualizations/helpers";
import { ParamSlider } from "./ParamSlider";
import { localMathSandbox } from "@/lib/math-sandbox";

interface DynamicCanvasProps {
  visualization: VisualizationConfig;
  variables: Record<string, number>;
  onVariablesChange: (vars: Record<string, number>) => void;
}

const CHART_COLORS: Record<string, string> = {
  "chart-1": "var(--chart-1)",
  "chart-2": "var(--chart-2)",
  "chart-3": "var(--chart-3)",
  "chart-4": "var(--chart-4)",
  "chart-5": "var(--chart-5)",
};

const RAW_COLORS: Record<string, string> = {
  "chart-1": "oklch(0.62 0.18 250)",
  "chart-2": "oklch(0.72 0.17 152)",
  "chart-3": "oklch(0.72 0.18 0)",
  "chart-4": "oklch(0.78 0.16 80)",
  "chart-5": "oklch(0.6 0.18 300)",
};

function buildEquationLabel(
  expr: string,
  vars: Record<string, number>,
): string {
  let eq = expr;
  for (const [name, val] of Object.entries(vars)) {
    const formatted = Number.isInteger(val) ? val.toString() : val.toFixed(2);
    eq = eq.replace(
      new RegExp(`(?<![a-zA-Z])${name}(?![a-zA-Z])`, "g"),
      formatted,
    );
  }
  eq = eq.replace(/\^/g, "^").replace(/\*/g, "");
  return `y = ${eq}`;
}

function findXIntercepts(
  expr: string,
  vars: Record<string, number>,
  xMin: number,
  xMax: number,
): number[] {
  const intercepts: number[] = [];
  const steps = 200;
  const dx = (xMax - xMin) / steps;
  let prevY = localMathSandbox.evaluate(expr, { ...vars, x: xMin });

  for (let i = 1; i <= steps; i++) {
    const x = xMin + i * dx;
    const y = localMathSandbox.evaluate(expr, { ...vars, x });
    if (prevY * y < 0) {
      const frac = Math.abs(prevY) / (Math.abs(prevY) + Math.abs(y));
      intercepts.push(x - dx + frac * dx);
    }
    prevY = y;
  }
  return intercepts;
}

/** Measure a container's actual pixel size */
function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 720, height: 480 });

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return size;
}

export function DynamicCanvas({
  visualization,
  variables,
  onVariablesChange,
}: DynamicCanvasProps) {
  const throttledVars = useRafValue(variables);
  const throttledViz = useRafValue(visualization);
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: svgWidth, height: svgHeight } = useContainerSize(containerRef);

  const { xRange, yRange, expressions } = throttledViz;
  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;

  // Build curve paths
  const paths = useMemo(() => {
    return expressions.map((exprConfig) => {
      const pathD = buildCurvePath(
        (x) =>
          localMathSandbox.evaluate(exprConfig.expr, { ...throttledVars, x }),
        xMin,
        xMax,
        yMin,
        yMax,
        svgWidth,
        svgHeight,
      );
      return { ...exprConfig, pathD };
    });
  }, [expressions, throttledVars, xMin, xMax, yMin, yMax, svgWidth, svgHeight]);

  // Compute key points
  const keyPoints = useMemo(() => {
    return expressions.map((exprConfig) => {
      const points: Array<{
        x: number;
        y: number;
        label: string;
      }> = [];

      if (xMin <= 0 && xMax >= 0) {
        const y0 = localMathSandbox.evaluate(exprConfig.expr, {
          ...throttledVars,
          x: 0,
        });
        if (isFinite(y0) && y0 >= yMin && y0 <= yMax) {
          points.push({ x: 0, y: y0, label: `(0, ${y0.toFixed(1)})` });
        }
      }

      for (const xi of findXIntercepts(
        exprConfig.expr,
        throttledVars,
        xMin,
        xMax,
      )) {
        points.push({ x: xi, y: 0, label: `(${xi.toFixed(1)}, 0)` });
      }

      return points;
    });
  }, [expressions, throttledVars, xMin, xMax, yMin, yMax]);

  const sliderDefs = useMemo(
    () =>
      visualization.variables.map((v) => ({
        key: v.name,
        label: v.name,
        min: v.min,
        max: v.max,
        default: v.default,
        step: v.step,
      })),
    [visualization.variables],
  );

  const equationLabels = useMemo(
    () => expressions.map((e) => buildEquationLabel(e.expr, throttledVars)),
    [expressions, throttledVars],
  );

  return (
    <div className="flex flex-col h-full">
      {/* SVG Canvas — ref for measuring, fills container completely */}
      <div ref={containerRef} className="flex-1 min-h-0 bg-card border border-border rounded-xl overflow-hidden relative">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        >
          <Axes
            svgWidth={svgWidth}
            svgHeight={svgHeight}
            xMin={xMin}
            xMax={xMax}
            yMin={yMin}
            yMax={yMax}
          />

          {paths.map((p, i) => (
            <path
              key={i}
              d={p.pathD}
              fill="none"
              stroke={CHART_COLORS[p.color] ?? "var(--blue)"}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Key points */}
          {keyPoints.map((pts, ci) =>
            pts.map((pt, pi) => {
              const px = toSvgPixel(
                pt.x,
                pt.y,
                xMin,
                xMax,
                yMin,
                yMax,
                svgWidth,
                svgHeight,
              );
              const color =
                RAW_COLORS[expressions[ci].color] ?? "oklch(0.62 0.18 250)";
              return (
                <g key={`kp-${ci}-${pi}`}>
                  <circle
                    cx={px.x}
                    cy={px.y}
                    r={4}
                    fill={color}
                    stroke="white"
                    strokeWidth={1.5}
                  />
                  <text
                    x={px.x + 8}
                    y={px.y - 8}
                    fontSize={10}
                    fontWeight={500}
                    fill={color}
                  >
                    {pt.label}
                  </text>
                </g>
              );
            }),
          )}

          {/* Equation labels */}
          <g transform="translate(16, 20)">
            {equationLabels.map((label, i) => (
              <text
                key={i}
                x={0}
                y={i * 20}
                fontSize={13}
                fontWeight={600}
                fontFamily="monospace"
                fill={
                  RAW_COLORS[expressions[i].color] ?? "oklch(0.62 0.18 250)"
                }
              >
                {label}
              </text>
            ))}
          </g>

          {/* Legend */}
          <g transform={`translate(${svgWidth - 120}, 16)`}>
            {expressions.map((expr, i) => (
              <g key={i} transform={`translate(0, ${i * 18})`}>
                <rect
                  x={0}
                  y={-5}
                  width={12}
                  height={3}
                  rx={1.5}
                  fill={CHART_COLORS[expr.color] ?? "var(--blue)"}
                />
                <text
                  x={16}
                  y={0}
                  fontSize={11}
                  className="fill-current text-muted-foreground"
                >
                  {expr.label}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Variable Sliders */}
      {sliderDefs.length > 0 && (
        <div className="shrink-0 mt-3 bg-card border border-border rounded-xl px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            参数调节
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
            {sliderDefs.map((def) => (
              <ParamSlider
                key={def.key}
                def={def}
                value={variables[def.key] ?? def.default}
                onChange={(v) =>
                  onVariablesChange({ ...variables, [def.key]: v })
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
