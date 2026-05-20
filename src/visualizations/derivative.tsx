import { toSvgPixel, Axes, type VizProps, type VisSpec } from "./helpers";

export function DerivativeViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const xMin = -5;
  const xMax = 5;
  const yMin = -5;
  const yMax = 15;
  const a = params.a ?? 1;
  const b = params.b ?? 0;
  const c = params.c ?? 0;
  const x0 = params.x0 ?? 1;
  const h = Math.max(0.05, params.h ?? 0.5);

  const f = (x: number) => a * x * x + b * x + c;
  const fp = (x: number) => 2 * a * x + b;

  const curvePath: string[] = [];
  let inBounds = false;
  for (let x = xMin; x <= xMax; x += 0.05) {
    const y = f(x);
    if (y < yMin - 3 || y > yMax + 3) { inBounds = false; continue; }
    const px = toSvgPixel(x, y, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
    if (!inBounds) { curvePath.push(`M ${px.x.toFixed(1)} ${px.y.toFixed(1)}`); inBounds = true; }
    else curvePath.push(`L ${px.x.toFixed(1)} ${px.y.toFixed(1)}`);
  }

  const y0 = f(x0);
  const y1 = f(x0 + h);
  const slope = (y1 - y0) / h;

  const p0 = toSvgPixel(x0, y0, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
  const p1 = toSvgPixel(x0 + h, y1, xMin, xMax, yMin, yMax, svgWidth, svgHeight);

  const tangentLen = 3;
  const t0 = toSvgPixel(x0 - tangentLen, y0 - slope * tangentLen, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
  const t1 = toSvgPixel(x0 + tangentLen, y0 + slope * tangentLen, xMin, xMax, yMin, yMax, svgWidth, svgHeight);

  const exactSlope = fp(x0);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <Axes svgWidth={svgWidth} svgHeight={svgHeight} xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} />
      {curvePath.length > 0 && <path d={curvePath.join(" ")} fill="none" stroke="var(--blue)" strokeWidth={2.5} />}
      {/* Secant line */}
      <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="var(--pink)" strokeWidth={1.5} strokeDasharray="5 3" />
      {/* Tangent line */}
      <line x1={t0.x} y1={t0.y} x2={t1.x} y2={t1.y} stroke="var(--emerald)" strokeWidth={2} />
      {/* Points */}
      <circle cx={p0.x} cy={p0.y} r={5} fill="var(--pink)" />
      <circle cx={p1.x} cy={p1.y} r={4} fill="var(--pink)" opacity={0.6} />
      {/* Labels */}
      <text x={12} y={20} fontSize={13} className="fill-current text-muted-foreground">
        f(x) = {a.toFixed(1)}x² + {b.toFixed(1)}x + {c.toFixed(1)}
      </text>
      <text x={12} y={40} fontSize={12} style={{ fill: "var(--emerald)" }}>
        f'(x₀) ≈ {slope.toFixed(2)}（h={h.toFixed(2)}）
      </text>
      <text x={12} y={58} fontSize={12} style={{ fill: "var(--pink)" }}>
        精确值 f'(x₀) = {exactSlope.toFixed(2)}
      </text>
    </svg>
  );
}

export const derivativeSpec: VisSpec = { component: DerivativeViz, supportsAnimation: false };
export default DerivativeViz;
