import { toSvgPixel, Axes, type VizProps, type VisSpec } from "./helpers";

export function ExpLogViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const xMin = -6;
  const xMax = 6;
  const yMin = -4;
  const yMax = 12;
  const a = Math.max(0.1, params.a);

  const expPath: string[] = [];
  const logPath: string[] = [];
  let expInBounds = false;
  let logInBounds = false;

  for (let x = xMin; x <= xMax; x += 0.05) {
    const ey = Math.pow(a, x);
    if (ey >= yMin - 2 && ey <= yMax + 2) {
      const px = toSvgPixel(x, ey, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
      if (!expInBounds) { expPath.push(`M ${px.x.toFixed(1)} ${px.y.toFixed(1)}`); expInBounds = true; }
      else expPath.push(`L ${px.x.toFixed(1)} ${px.y.toFixed(1)}`);
    } else expInBounds = false;

    if (x > 0.01) {
      const ly = Math.log(x) / Math.log(a);
      if (ly >= yMin - 2 && ly <= yMax + 2) {
        const px = toSvgPixel(x, ly, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
        if (!logInBounds) { logPath.push(`M ${px.x.toFixed(1)} ${px.y.toFixed(1)}`); logInBounds = true; }
        else logPath.push(`L ${px.x.toFixed(1)} ${px.y.toFixed(1)}`);
      } else logInBounds = false;
    }
  }

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <Axes svgWidth={svgWidth} svgHeight={svgHeight} xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} />
      {/* y=x reference line */}
      <line
        x1={toSvgPixel(xMin, xMin, xMin, xMax, yMin, yMax, svgWidth, svgHeight).x}
        y1={toSvgPixel(xMin, xMin, xMin, xMax, yMin, yMax, svgWidth, svgHeight).y}
        x2={toSvgPixel(xMax, xMax, xMin, xMax, yMin, yMax, svgWidth, svgHeight).x}
        y2={toSvgPixel(xMax, xMax, xMin, xMax, yMin, yMax, svgWidth, svgHeight).y}
        stroke="currentColor" strokeWidth={0.8} strokeDasharray="4 3" opacity={0.3} className="text-muted-foreground"
      />
      {expPath.length > 0 && <path d={expPath.join(" ")} fill="none" stroke="var(--blue)" strokeWidth={2.5} />}
      {logPath.length > 0 && <path d={logPath.join(" ")} fill="none" stroke="var(--pink)" strokeWidth={2.5} />}
      {/* Labels */}
      <text x={svgWidth - 12} y={30} fontSize={12} textAnchor="end" style={{ fill: "var(--blue)" }}>
        y = {a.toFixed(1)}ˣ
      </text>
      <text x={svgWidth - 12} y={48} fontSize={12} textAnchor="end" style={{ fill: "var(--pink)" }}>
        y = log₍{a.toFixed(1)}₎x
      </text>
      <text x={12} y={20} fontSize={13} className="fill-current text-muted-foreground">
        指数函数与对数函数（互为反函数）
      </text>
    </svg>
  );
}

export const expLogSpec: VisSpec = { component: ExpLogViz, supportsAnimation: false };
export default ExpLogViz;
