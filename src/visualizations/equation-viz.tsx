import { buildCurvePath, Axes, useRafValue, type VizProps, type VisSpec } from "./helpers";

interface EquationVizConfig {
  title: string;
  formula: (params: Record<string, number>) => string;
  /** 2D 曲线：给定 x 返回 y，null 表示不绘制 */
  curveFn?: (x: number, params: Record<string, number>) => number | null;
  /** 曲线标签 */
  curveLabel?: (params: Record<string, number>) => string;
  /** 额外注释 */
  annotations?: (params: Record<string, number>, svgW: number, svgH: number) => React.ReactNode;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  svgWidth?: number;
  svgHeight?: number;
}

export function createEquationViz(config: EquationVizConfig): React.ComponentType<VizProps> {
  const {
    formula,
    curveFn,
    curveLabel,
    annotations,
    xMin = -10,
    xMax = 10,
    yMin = -10,
    yMax = 10,
    svgWidth = 720,
    svgHeight = 480,
  } = config;

  function EquationViz({ params }: VizProps) {
    const throttled = useRafValue(params);
    const pathD = curveFn
      ? buildCurvePath((x) => curveFn(x, throttled), xMin, xMax, yMin, yMax, svgWidth, svgHeight)
      : "";

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
        <Axes svgWidth={svgWidth} svgHeight={svgHeight} xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} />
        {pathD && (
          <path d={pathD} fill="none" stroke="var(--blue)" strokeWidth={2.5} />
        )}
        {curveLabel && pathD && (
          <text x={12} y={20} fontSize={13} className="fill-current text-muted-foreground">
            {curveLabel(throttled)}
          </text>
        )}
        <text x={svgWidth - 12} y={20} fontSize={13} textAnchor="end" className="fill-current text-muted-foreground">
          {formula(throttled)}
        </text>
        {annotations?.(throttled, svgWidth, svgHeight)}
      </svg>
    );
  }

  return EquationViz;
}

export const equationVizSpec: VisSpec = {
  component: null as unknown as React.ComponentType<VizProps>,
  supportsAnimation: false,
};

export function makeSpec(component: React.ComponentType<VizProps>): VisSpec {
  return { component, supportsAnimation: false };
}
