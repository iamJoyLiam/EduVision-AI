import { toSvgPixel, buildCurvePath, Axes, useRafValue, type VizProps, type VisSpec } from "./helpers";

function QuadraticViz({ params, playback }: VizProps) {
  const throttled = useRafValue(params);
  const svgWidth = 720;
  const svgHeight = 480;
  const xMin = -10;
  const xMax = 10;
  const yMin = -10;
  const yMax = 10;
  const { a, b, c } = throttled;

  const step = playback?.step ?? 3;

  const pathD = buildCurvePath(
    (x) => a * x * x + b * x + c,
    xMin, xMax, yMin, yMax, svgWidth, svgHeight,
  );

  const vertexX = a !== 0 ? -b / (2 * a) : 0;
  const vertexY = a * vertexX * vertexX + b * vertexX + c;
  const vertexPx = toSvgPixel(vertexX, vertexY, xMin, xMax, yMin, yMax, svgWidth, svgHeight);

  // Axis of symmetry pixel position
  const axisTop = toSvgPixel(vertexX, yMax + 2, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
  const axisBottom = toSvgPixel(vertexX, yMin - 2, xMin, xMax, yMin, yMax, svgWidth, svgHeight);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <Axes svgWidth={svgWidth} svgHeight={svgHeight} xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} />
      <path
        d={pathD}
        fill="none"
        stroke="var(--blue)"
        strokeWidth={2.5}
      />

      {/* Step 1: Axis of symmetry */}
      {step >= 1 && a !== 0 && (
        <line
          x1={axisTop.x}
          y1={axisTop.y}
          x2={axisBottom.x}
          y2={axisBottom.y}
          stroke="var(--pink)"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          opacity={step === 1 ? 0.8 : 0.35}
        />
      )}
      {step >= 1 && a !== 0 && (
        <text
          x={axisTop.x + 6}
          y={axisTop.y + 14}
          fontSize={11}
          style={{ fill: "var(--pink)" }}
          opacity={step === 1 ? 1 : 0.4}
        >
          x = -b/(2a) = {vertexX.toFixed(2)}
        </text>
      )}

      {/* Step 2: Vertex */}
      {step >= 2 && a !== 0 && vertexY >= yMin && vertexY <= yMax && (
        <g opacity={step === 2 ? 1 : 0.4}>
          <circle cx={vertexPx.x} cy={vertexPx.y} r={5} fill="var(--pink)" />
          <text x={vertexPx.x + 10} y={vertexPx.y - 10} fontSize={12} fontWeight={600} style={{ fill: "var(--pink)" }}>
            顶点 ({vertexX.toFixed(2)}, {vertexY.toFixed(2)})
          </text>
        </g>
      )}

      {/* Step 3: Direction arrow */}
      {step >= 3 && a !== 0 && (
        <g opacity={0.7}>
          {(() => {
            const arrowX = vertexPx.x + 60;
            const arrowStartY = vertexPx.y;
            const arrowEndY = a > 0 ? vertexPx.y + 40 : vertexPx.y - 40;
            return (
              <>
                <line x1={arrowX} y1={arrowStartY} x2={arrowX} y2={arrowEndY} stroke="var(--emerald)" strokeWidth={2} markerEnd="url(#dir-arrow)" />
                <defs>
                  <marker id="dir-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M0,0 L10,5 L0,10 z" fill="var(--emerald)" />
                  </marker>
                </defs>
                <text x={arrowX + 10} y={(arrowStartY + arrowEndY) / 2 + 4} fontSize={11} className="fill-current text-muted-foreground">
                  {a > 0 ? "开口向上" : "开口向下"}
                </text>
              </>
            );
          })()}
        </g>
      )}

      <text x={12} y={20} fontSize={13} className="fill-current text-muted-foreground">
        y = {a.toFixed(2)}x² + {b.toFixed(2)}x + {c.toFixed(2)}
      </text>
    </svg>
  );
}

export const quadraticSpec: VisSpec = {
  component: QuadraticViz,
  supportsAnimation: true,
};

export default QuadraticViz;
