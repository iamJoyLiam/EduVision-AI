import { toSvgPixel, Axes, type VizProps, type VisSpec } from "./helpers";

export function ConicSectionViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const xMin = -12;
  const xMax = 12;
  const yMin = -10;
  const yMax = 10;
  const a = Math.max(0.5, params.a ?? 5);
  const b = Math.max(0.5, params.b ?? 3);

  const c = Math.sqrt(Math.abs(a * a - b * b));

  const curvePath: string[] = [];
  let inBounds = false;
  for (let deg = 0; deg <= 360; deg += 1) {
    const rad = (deg * Math.PI) / 180;
    const x = a * Math.cos(rad);
    const y = b * Math.sin(rad);
    const px = toSvgPixel(x, y, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
    if (!inBounds) { curvePath.push(`M ${px.x.toFixed(1)} ${px.y.toFixed(1)}`); inBounds = true; }
    else curvePath.push(`L ${px.x.toFixed(1)} ${px.y.toFixed(1)}`);
  }

  const f1 = toSvgPixel(-c, 0, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
  const f2 = toSvgPixel(c, 0, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
  const center = toSvgPixel(0, 0, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
  const aEnd = toSvgPixel(a, 0, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
  const bEnd = toSvgPixel(0, b, xMin, xMax, yMin, yMax, svgWidth, svgHeight);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <Axes svgWidth={svgWidth} svgHeight={svgHeight} xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} />
      <path d={curvePath.join(" ")} fill="none" stroke="var(--blue)" strokeWidth={2.5} />
      {/* Semi-major axis */}
      <line x1={center.x} y1={center.y} x2={aEnd.x} y2={aEnd.y} stroke="var(--emerald)" strokeWidth={1.5} strokeDasharray="4 2" />
      {/* Semi-minor axis */}
      <line x1={center.x} y1={center.y} x2={bEnd.x} y2={bEnd.y} stroke="var(--emerald)" strokeWidth={1.5} strokeDasharray="4 2" />
      {/* Foci */}
      <circle cx={f1.x} cy={f1.y} r={4} fill="var(--pink)" />
      <circle cx={f2.x} cy={f2.y} r={4} fill="var(--pink)" />
      {/* Labels */}
      <text x={12} y={20} fontSize={13} className="fill-current text-muted-foreground">
        椭圆 x²/{a.toFixed(1)}² + y²/{b.toFixed(1)}² = 1
      </text>
      <text x={12} y={40} fontSize={12} className="fill-current text-muted-foreground">
        a={a.toFixed(1)}, b={b.toFixed(1)}, c={c.toFixed(2)}
      </text>
      <text x={f1.x - 8} y={f1.y + 18} fontSize={11} style={{ fill: "var(--pink)" }}>F₁</text>
      <text x={f2.x + 8} y={f2.y + 18} fontSize={11} style={{ fill: "var(--pink)" }}>F₂</text>
    </svg>
  );
}

export const conicSectionSpec: VisSpec = { component: ConicSectionViz, supportsAnimation: false };
export default ConicSectionViz;
