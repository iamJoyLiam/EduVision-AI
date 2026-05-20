import { toSvgPixel, Axes, type VizProps, type VisSpec } from "./helpers";

function LinearFunctionViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const xMin = -10;
  const xMax = 10;
  const yMin = -10;
  const yMax = 10;
  const k = params.k;
  const b = params.b;

  const p1 = toSvgPixel(xMin, k * xMin + b, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
  const p2 = toSvgPixel(xMax, k * xMax + b, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
  const intercept = toSvgPixel(0, b, xMin, xMax, yMin, yMax, svgWidth, svgHeight);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <Axes svgWidth={svgWidth} svgHeight={svgHeight} xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} />
      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--blue)" strokeWidth={2.5} />
      <circle cx={intercept.x} cy={intercept.y} r={4} fill="var(--pink)" />
      <text x={12} y={20} fontSize={13} className="fill-current text-muted-foreground">
        y = {k.toFixed(2)}x + {b.toFixed(2)}
      </text>
    </svg>
  );
}

export const linearFunctionSpec: VisSpec = {
  component: LinearFunctionViz,
  supportsAnimation: false,
};

export default LinearFunctionViz;
