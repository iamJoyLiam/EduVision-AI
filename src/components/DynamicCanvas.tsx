import { useMemo } from "react";
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

/**
 * Build a human-readable equation string with variable values substituted.
 * e.g. "a * x^2 + b * x + c" with a=2, b=-3, c=1 → "y = 2x² + -3x + 1"
 */
function buildEquationLabel(
  expr: string,
  vars: Record<string, number>,
): string {
  let eq = expr;
  for (const [name, val] of Object.entries(vars)) {
    const formatted = Number.isInteger(val) ? val.toString() : val.toFixed(2);
    // Replace variable name with value, but not inside function names like "sin", "cos"
    eq = eq.replace(new RegExp(`(?<![a-zA-Z])${name}(?![a-zA-Z])`, "g"), formatted);
  }
  // Clean up display
  eq = eq.replace(/\^/g, "^").replace(/\*/g, "");
  return `y = ${eq}`;
}

/**
 * Find x-intercepts by scanning for sign changes in y values.
 */
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
      // Sign change — linear interpolation for better accuracy
      const x0 = x - dx;
      const x1 = x;
      const frac = Math.abs(prevY) / (Math.abs(prevY) + Math.abs(y));
      intercepts.push(x0 + frac * (x1 - x0));
    }
    prevY = y;
  }
  return intercepts;
}

export function DynamicCanvas({
  visualization,
  variables,
  onVariablesChange,
}: DynamicCanvasProps) {
  const throttledVars = useRafValue(variables);
  const throttledViz = useRafValue(visualization);

  const svgWidth = 720;
  const svgHeight = 480;

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
  }, [expressions, throttledVars, xMin, xMax, yMin, yMax]);

  // Compute key points for each expression
  const keyPoints = useMemo(() => {
    return expressions.map((exprConfig) => {
      const points: Array<{
        x: number;
        y: number;
        label: string;
        type: "intercept" | "vertex";
      }> = [];

      // Y-intercept (x=0)
      if (xMin <= 0 && xMax >= 0) {
        const y0 = localMathSandbox.evaluate(exprConfig.expr, {
          ...throttledVars,
          x: 0,
        });
        if (isFinite(y0) && y0 >= yMin && y0 <= yMax) {
          points.push({ x: 0, y: y0, label: `(0, ${y0.toFixed(1)})`, type: "intercept" });
        }
      }

      // X-intercepts
      const xIntercepts = findXIntercepts(
        exprConfig.expr,
        throttledVars,
        xMin,
        xMax,
      );
      for (const xi of xIntercepts) {
        points.push({
          x: xi,
          y: 0,
          label: `(${xi.toFixed(1)}, 0)`,
          type: "intercept",
        });
      }

      return points;
    });
  }, [expressions, throttledVars, xMin, xMax, yMin, yMax]);

  // Build slider defs
  const sliderDefs = useMemo(() => {
    return visualization.variables.map((v) => ({
      key: v.name,
      label: v.name,
      min: v.min,
      max: v.max,
      default: v.default,
      step: v.step,
    }));
  }, [visualization.variables]);

  // Equation labels
  const equationLabels = useMemo(() => {
    return expressions.map((exprConfig) =>
      buildEquationLabel(exprConfig.expr, throttledVars),
    );
  }, [expressions, throttledVars]);

  return (
    <div className="flex flex-col h-full">
      {/* SVG Canvas — fills available space */}
      <div className="flex-1 min-h-0 bg-card border border-border rounded-xl overflow-hidden relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <Axes
            svgWidth={svgWidth}
            svgHeight={svgHeight}
            xMin={xMin}
            xMax={xMax}
            yMin={yMin}
            yMax={yMax}
          />

          {/* Curves */}
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

          {/* Key points (intercepts) */}
          {keyPoints.map((pts, curveIdx) =>
            pts.map((pt, ptIdx) => {
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
              const color = RAW_COLORS[expressions[curveIdx].color] ?? "oklch(0.62 0.18 250)";
              return (
                <g key={`kp-${curveIdx}-${ptIdx}`}>
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

          {/* Equation labels — top-left */}
          <g transform="translate(16, 20)">
            {equationLabels.map((label, i) => (
              <text
                key={i}
                x={0}
                y={i * 20}
                fontSize={13}
                fontWeight={600}
                fontFamily="monospace"
                fill={RAW_COLORS[expressions[i].color] ?? "oklch(0.62 0.18 250)"}
              >
                {label}
              </text>
            ))}
          </g>

          {/* Legend — top-right */}
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

      {/* Variable Sliders — below canvas */}
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
