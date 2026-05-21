import { useMemo } from "react";
import type { VisualizationConfig } from "@/lib/solve-schema";
import { Axes, buildCurvePath, useRafValue } from "@/visualizations/helpers";
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

export function DynamicCanvas({
  visualization,
  variables,
  onVariablesChange,
}: DynamicCanvasProps) {
  const throttledVars = useRafValue(variables);
  const throttledViz = useRafValue(visualization);

  const svgWidth = 600;
  const svgHeight = 400;

  const { xRange, yRange, expressions } = throttledViz;
  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;

  const paths = useMemo(() => {
    return expressions.map((exprConfig) => {
      const pathD = buildCurvePath(
        (x) => localMathSandbox.evaluate(exprConfig.expr, { ...throttledVars, x }),
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

  // Build slider defs from visualization variables
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

  return (
    <div className="space-y-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
        动态可视化
      </div>

      {/* SVG Canvas */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto"
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
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            参数调节
          </div>
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
      )}
    </div>
  );
}
