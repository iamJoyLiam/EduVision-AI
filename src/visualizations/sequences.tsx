import { toSvgPixel, Axes, type VizProps, type VisSpec } from "./helpers";

export function ArithmeticSeqViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const xMin = 0;
  const xMax = 20;
  const yMin = -20;
  const yMax = 60;
  const a1 = params.a1 ?? 2;
  const d = params.d ?? 3;
  const n = Math.round(params.n ?? 10);

  const points: { x: number; y: number; px: number; py: number }[] = [];
  for (let i = 1; i <= n; i++) {
    const an = a1 + (i - 1) * d;
    const p = toSvgPixel(i, an, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
    points.push({ x: i, y: an, px: p.x, py: p.y });
  }

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <Axes svgWidth={svgWidth} svgHeight={svgHeight} xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} />
      {points.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.px} cy={pt.py} r={4} fill="var(--blue)" />
          {i > 0 && (
            <line x1={points[i - 1].px} y1={points[i - 1].py} x2={pt.px} y2={pt.py} stroke="var(--blue)" strokeWidth={1.5} opacity={0.5} />
          )}
        </g>
      ))}
      <text x={12} y={20} fontSize={13} className="fill-current text-muted-foreground">
        等差数列 a₁={a1.toFixed(0)}, d={d.toFixed(0)}
      </text>
      <text x={12} y={40} fontSize={12} className="fill-current text-muted-foreground">
        aₙ = {a1.toFixed(0)} + (n-1)×{d.toFixed(0)}，Sₙ = n/2 × (2×{a1.toFixed(0)} + (n-1)×{d.toFixed(0)})
      </text>
      {n > 0 && <text x={12} y={60} fontSize={12} className="fill-current text-muted-foreground">
        a₍{n}₎ = {points[n - 1]?.y.toFixed(0)}，S₍{n}₎ = {(n * (2 * a1 + (n - 1) * d) / 2).toFixed(0)}
      </text>}
    </svg>
  );
}

export function GeometricSeqViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const xMin = 0;
  const xMax = 15;
  const yMin = -10;
  const yMax = 100;
  const a1 = Math.max(0.1, params.a1 ?? 2);
  const q = params.q ?? 2;
  const n = Math.round(params.n ?? 8);

  const points: { x: number; y: number; px: number; py: number }[] = [];
  for (let i = 1; i <= n; i++) {
    const an = a1 * Math.pow(q, i - 1);
    if (an > yMax * 2) break;
    const p = toSvgPixel(i, Math.min(an, yMax), xMin, xMax, yMin, yMax, svgWidth, svgHeight);
    points.push({ x: i, y: an, px: p.x, py: p.y });
  }

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <Axes svgWidth={svgWidth} svgHeight={svgHeight} xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} />
      {points.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.px} cy={pt.py} r={4} fill="var(--pink)" />
          {i > 0 && (
            <line x1={points[i - 1].px} y1={points[i - 1].py} x2={pt.px} y2={pt.py} stroke="var(--pink)" strokeWidth={1.5} opacity={0.5} />
          )}
        </g>
      ))}
      <text x={12} y={20} fontSize={13} className="fill-current text-muted-foreground">
        等比数列 a₁={a1.toFixed(1)}, q={q.toFixed(2)}
      </text>
      <text x={12} y={40} fontSize={12} className="fill-current text-muted-foreground">
        aₙ = {a1.toFixed(1)} × {q.toFixed(2)}^(n-1)
      </text>
      {q !== 1 && <text x={12} y={60} fontSize={12} className="fill-current text-muted-foreground">
        Sₙ = {a1.toFixed(1)} × (1 - {q.toFixed(2)}^n) / (1 - {q.toFixed(2)})
      </text>}
    </svg>
  );
}

export const arithmeticSeqSpec: VisSpec = { component: ArithmeticSeqViz, supportsAnimation: false };
export const geometricSeqSpec: VisSpec = { component: GeometricSeqViz, supportsAnimation: false };
