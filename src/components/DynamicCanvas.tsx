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

type ColorIntent = "primary" | "danger" | "success" | "warning";

interface Point { x: number; y: number }

const COLOR_MAP: Record<ColorIntent, string> = {
  primary: "oklch(0.62 0.18 250)",
  danger: "oklch(0.72 0.18 80)",
  success: "oklch(0.72 0.17 152)",
  warning: "oklch(0.78 0.16 80)",
};

const CSS_VAR_MAP: Record<ColorIntent, string> = {
  primary: "var(--chart-1)",
  danger: "var(--chart-3)",
  success: "var(--chart-2)",
  warning: "var(--chart-4)",
};

function getColor(intent: string): string {
  return COLOR_MAP[intent as ColorIntent] ?? COLOR_MAP.primary;
}

function getCssColor(intent: string): string {
  return CSS_VAR_MAP[intent as ColorIntent] ?? CSS_VAR_MAP.primary;
}

function parsePoint(expr: string, vars: Record<string, number>): Point | null {
  try {
    const match = expr.match(/\[([^,]+),\s*([^\]]+)\]/);
    if (match) {
      const x = localMathSandbox.evaluate(match[1].trim(), vars);
      const y = localMathSandbox.evaluate(match[2].trim(), vars);
      return { x, y };
    }
  } catch {}
  return null;
}

function parsePointList(expr: string, vars: Record<string, number>): [number, number][] | null {
  try {
    // Match outer array: [[...], [...], ...]
    const match = expr.match(/\[(\[[\s\S]*\])\]/);
    if (!match) return null;

    const inner = match[1];
    const points: [number, number][] = [];

    // Split by ], [ to get individual coordinate pairs
    const pairs = inner.split(/\],\s*\[/);

    for (const pair of pairs) {
      // Clean up brackets
      const cleaned = pair.replace(/^\[/, "").replace(/\]$/, "");
      const coords = cleaned.split(",").map((s) => s.trim());

      if (coords.length >= 2) {
        const x = localMathSandbox.evaluate(coords[0], vars);
        const y = localMathSandbox.evaluate(coords[1], vars);
        points.push([x, y]);
      }
    }

    return points.length > 0 ? points : null;
  } catch {}
  return null;
}

function parseVector(expr: string, vars: Record<string, number>): [number, number, number, number] | null {
  try {
    const match = expr.match(/\[([^,]+),\s*([^,]+),\s*([^,]+),\s*([^\]]+)\]/);
    if (match) {
      const ox = localMathSandbox.evaluate(match[1].trim(), vars);
      const oy = localMathSandbox.evaluate(match[2].trim(), vars);
      const dx = localMathSandbox.evaluate(match[3].trim(), vars);
      const dy = localMathSandbox.evaluate(match[4].trim(), vars);
      return [ox, oy, dx, dy];
    }
  } catch {}
  return null;
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

  const { viewport, elements, controls } = throttledViz;
  const { x_min: xMin, x_max: xMax, y_min: yMin, y_max: yMax } = viewport;

  // Build curve paths and render elements
  const renderedElements = useMemo(() => {
    return elements.map((elem) => {
      const color = getColor(elem.color_intent);
      const cssColor = getCssColor(elem.color_intent);

      if (elem.type === "curve") {
        const pathD = buildCurvePath(
          (x: number) => localMathSandbox.evaluate(elem.expression, { ...throttledVars, x }),
          xMin, xMax, yMin, yMax, svgWidth, svgHeight,
        );
        return { kind: "curve" as const, id: elem.id, label: elem.label_text, pathD, color, cssColor };
      }

      if (elem.type === "point") {
        const pt = parsePoint(elem.expression, throttledVars);
        if (pt) {
          const px = toSvgPixel(pt.x, pt.y, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
          return { kind: "point" as const, id: elem.id, label: elem.label_text, px, color, cssColor };
        }
      }

      if (elem.type === "polygon" || elem.type === "segment") {
        const points = parsePointList(elem.expression, throttledVars);
        if (points) {
          const svgPoints = points.map(([x, y]: [number, number]) =>
            toSvgPixel(x, y, xMin, xMax, yMin, yMax, svgWidth, svgHeight)
          );
          return { kind: elem.type, id: elem.id, label: elem.label_text, svgPoints, color, cssColor };
        }
      }

      if (elem.type === "vector") {
        const vec = parseVector(elem.expression, throttledVars);
        if (vec) {
          const [ox, oy, dx, dy] = vec;
          const start = toSvgPixel(ox, oy, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
          const end = toSvgPixel(ox + dx, oy + dy, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
          return { kind: "vector" as const, id: elem.id, label: elem.label_text, start, end, color, cssColor };
        }
      }

      return { kind: "unknown" as const, id: elem.id, color, cssColor };
    });
  }, [elements, throttledVars, xMin, xMax, yMin, yMax, svgWidth, svgHeight]);

  const sliderDefs = useMemo(
    () =>
      controls.map((c) => ({
        key: c.symbol,
        label: c.label,
        min: c.min,
        max: c.max,
        default: c.default,
        step: c.step,
      })),
    [controls],
  );

  // Build equation labels for curves
  const equationLabels = useMemo(
    () =>
      elements
        .filter((e) => e.type === "curve")
        .map((e) => {
          let eq = e.expression;
          for (const [name, val] of Object.entries(throttledVars)) {
            const formatted = Number.isInteger(val) ? val.toString() : val.toFixed(2);
            eq = eq.replace(
              new RegExp(`(?<![a-zA-Z])${name}(?![a-zA-Z])`, "g"),
              formatted,
            );
          }
          eq = eq.replace(/\^/g, "^").replace(/\*/g, "");
          return `y = ${eq}`;
        }),
    [elements, throttledVars],
  );

  return (
    <div className="flex flex-col h-full">
      {/* SVG Canvas */}
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

          {/* Render elements */}
          {renderedElements.map((elem, i) => {
            if (elem.kind === "curve" && elem.pathD) {
              return (
                <path
                  key={elem.id ?? i}
                  d={elem.pathD}
                  fill="none"
                  stroke={elem.cssColor}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            }

            if (elem.kind === "point" && elem.px) {
              return (
                <g key={elem.id ?? i}>
                  <circle
                    cx={elem.px.x}
                    cy={elem.px.y}
                    r={4}
                    fill={elem.color}
                    stroke="white"
                    strokeWidth={1.5}
                  />
                  {elem.label && (
                    <text
                      x={elem.px.x + 8}
                      y={elem.px.y - 8}
                      fontSize={10}
                      fontWeight={500}
                      fill={elem.color}
                    >
                      {elem.label}
                    </text>
                  )}
                </g>
              );
            }

            if ((elem.kind === "polygon" || elem.kind === "segment") && elem.svgPoints) {
              const pointsStr = elem.svgPoints.map((p: Point) => `${p.x},${p.y}`).join(" ");
              if (elem.kind === "polygon") {
                return (
                  <polygon
                    key={elem.id ?? i}
                    points={pointsStr}
                    fill={elem.cssColor}
                    fillOpacity={0.15}
                    stroke={elem.color}
                    strokeWidth={1.5}
                  />
                );
              }
              return (
                <polyline
                  key={elem.id ?? i}
                  points={pointsStr}
                  fill="none"
                  stroke={elem.color}
                  strokeWidth={1.5}
                />
              );
            }

            if (elem.kind === "vector" && elem.start && elem.end) {
              return (
                <g key={elem.id ?? i}>
                  <defs>
                    <marker
                      id={`arrow-${elem.id}`}
                      markerWidth="10"
                      markerHeight="7"
                      refX="10"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill={elem.color} />
                    </marker>
                  </defs>
                  <line
                    x1={elem.start.x}
                    y1={elem.start.y}
                    x2={elem.end.x}
                    y2={elem.end.y}
                    stroke={elem.color}
                    strokeWidth={2}
                    markerEnd={`url(#arrow-${elem.id})`}
                  />
                  {elem.label && (
                    <text
                      x={(elem.start.x + elem.end.x) / 2}
                      y={(elem.start.y + elem.end.y) / 2 - 8}
                      fontSize={10}
                      fontWeight={500}
                      fill={elem.color}
                      textAnchor="middle"
                    >
                      {elem.label}
                    </text>
                  )}
                </g>
              );
            }

            return null;
          })}

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
                fill={COLOR_MAP.primary}
              >
                {label}
              </text>
            ))}
          </g>

          {/* Legend */}
          <g transform={`translate(${svgWidth - 120}, 16)`}>
            {elements.map((elem, i) => (
              <g key={i} transform={`translate(0, ${i * 18})`}>
                <rect
                  x={0}
                  y={-5}
                  width={12}
                  height={3}
                  rx={1.5}
                  fill={getCssColor(elem.color_intent)}
                />
                <text
                  x={16}
                  y={0}
                  fontSize={11}
                  className="fill-current text-muted-foreground"
                >
                  {elem.label_text ?? elem.id}
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
