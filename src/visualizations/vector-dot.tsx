import { toSvgPixel, Axes, type VizProps, type VisSpec } from "./helpers";

export function VectorDotViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const xMin = -8;
  const xMax = 8;
  const yMin = -6;
  const yMax = 6;

  const ax = params.ax ?? 4;
  const ay = params.ay ?? 2;
  const bx = params.bx ?? 3;
  const by = params.by ?? -1;

  const dot = ax * bx + ay * by;
  const magA = Math.sqrt(ax * ax + ay * ay);
  const magB = Math.sqrt(bx * bx + by * by);
  const cosTheta = magA > 0 && magB > 0 ? dot / (magA * magB) : 0;
  const theta = Math.acos(Math.max(-1, Math.min(1, cosTheta)));
  const projB = dot / (magB * magB);

  const origin = toSvgPixel(0, 0, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
  const aEnd = toSvgPixel(ax, ay, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
  const bEnd = toSvgPixel(bx, by, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
  const projEnd = toSvgPixel(bx * projB, by * projB, xMin, xMax, yMin, yMax, svgWidth, svgHeight);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <Axes svgWidth={svgWidth} svgHeight={svgHeight} xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} />
      {/* Vector a */}
      <line x1={origin.x} y1={origin.y} x2={aEnd.x} y2={aEnd.y} stroke="var(--blue)" strokeWidth={2.5} markerEnd="url(#vec-a)" />
      {/* Vector b */}
      <line x1={origin.x} y1={origin.y} x2={bEnd.x} y2={bEnd.y} stroke="var(--pink)" strokeWidth={2.5} markerEnd="url(#vec-b)" />
      {/* Projection of a on b */}
      <line x1={origin.x} y1={origin.y} x2={projEnd.x} y2={projEnd.y} stroke="var(--emerald)" strokeWidth={1.5} strokeDasharray="5 3" />
      {/* Perpendicular from a to projection */}
      <line x1={aEnd.x} y1={aEnd.y} x2={projEnd.x} y2={projEnd.y} stroke="currentColor" strokeWidth={0.8} strokeDasharray="3 2" opacity={0.4} className="text-muted-foreground" />
      <defs>
        <marker id="vec-a" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--blue)" />
        </marker>
        <marker id="vec-b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--pink)" />
        </marker>
      </defs>
      <text x={aEnd.x + 8} y={aEnd.y - 6} fontSize={13} fontWeight={600} style={{ fill: "var(--blue)" }}>a⃗</text>
      <text x={bEnd.x + 8} y={bEnd.y + 14} fontSize={13} fontWeight={600} style={{ fill: "var(--pink)" }}>b⃗</text>
      <text x={12} y={20} fontSize={13} className="fill-current text-muted-foreground">
        a⃗·b⃗ = {dot.toFixed(1)}，|a⃗|={magA.toFixed(2)}，|b⃗|={magB.toFixed(2)}
      </text>
      <text x={12} y={40} fontSize={12} className="fill-current text-muted-foreground">
        cosθ = {cosTheta.toFixed(3)}，θ = {(theta * 180 / Math.PI).toFixed(1)}°
      </text>
    </svg>
  );
}

export const vectorDotSpec: VisSpec = { component: VectorDotViz, supportsAnimation: false };
export default VectorDotViz;
