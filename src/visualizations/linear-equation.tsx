import { Axes, type VizProps, type VisSpec } from "./helpers";

function LinearEquationViz({ params, playback }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const xMin = -10;
  const xMax = 10;
  const yMin = -10;
  const yMax = 10;
  const a = params.a;
  const b = params.b;
  const solution = a !== 0 ? -b / a : NaN;
  const step = playback?.step ?? 3;

  // Number line dimensions
  const lineY = 300;
  const linePadLeft = 60;
  const linePadRight = 60;
  const lineWidth = svgWidth - linePadLeft - linePadRight;

  const numberToX = (n: number) => linePadLeft + ((n - xMin) / (xMax - xMin)) * lineWidth;

  // Equation display opacity per step
  const showOriginal = step >= 0;
  const showMoved = step >= 1;
  const showDivided = step >= 2;
  const showSolution = step >= 3;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <Axes svgWidth={svgWidth} svgHeight={svgHeight} xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} />

      {/* Number line */}
      <line x1={linePadLeft} y1={lineY} x2={svgWidth - linePadRight} y2={lineY} stroke="currentColor" strokeWidth={2} className="text-foreground" />
      {Array.from({ length: 21 }, (_, idx) => {
        const n = xMin + idx;
        const x = numberToX(n);
        const isMajor = n % 2 === 0;
        return (
          <g key={idx}>
            <line x1={x} y1={lineY - (isMajor ? 8 : 4)} x2={x} y2={lineY + (isMajor ? 8 : 4)} stroke="currentColor" strokeWidth={isMajor ? 1.5 : 0.8} className="text-foreground" />
            {isMajor && (
              <text x={x} y={lineY + 22} fontSize={11} textAnchor="middle" className="fill-current text-muted-foreground">
                {n}
              </text>
            )}
          </g>
        );
      })}

      {/* Step 0: Original equation */}
      {showOriginal && (
        <text x={svgWidth / 2} y={60} fontSize={20} textAnchor="middle" className="fill-current" opacity={step === 0 ? 1 : 0.4}>
          {a.toFixed(1)}x + {b.toFixed(1)} = 0
        </text>
      )}

      {/* Step 1: Moved term */}
      {showMoved && (
        <g opacity={step === 1 ? 1 : 0.4}>
          <text x={svgWidth / 2} y={110} fontSize={20} textAnchor="middle" className="fill-current">
            {a.toFixed(1)}x = {(-b).toFixed(1)}
          </text>
          {/* Arrow showing move */}
          <line x1={svgWidth / 2 + 80} y1={70} x2={svgWidth / 2 + 40} y2={100} stroke="var(--pink)" strokeWidth={1.5} markerEnd="url(#eq-arrow)" />
          <defs>
            <marker id="eq-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--pink)" />
            </marker>
          </defs>
        </g>
      )}

      {/* Step 2: Divided */}
      {showDivided && (
        <g opacity={step === 2 ? 1 : 0.4}>
          <text x={svgWidth / 2} y={160} fontSize={20} textAnchor="middle" className="fill-current">
            x = {(-b).toFixed(1)} / {a.toFixed(1)}
          </text>
          <text x={svgWidth / 2} y={185} fontSize={14} textAnchor="middle" className="fill-current text-muted-foreground">
            = {solution.toFixed(2)}
          </text>
        </g>
      )}

      {/* Step 3: Solution on number line */}
      {showSolution && !isNaN(solution) && solution >= xMin && solution <= xMax && (
        <g>
          <circle cx={numberToX(solution)} cy={lineY} r={8} fill="var(--pink)" />
          <text x={numberToX(solution)} y={lineY - 16} fontSize={13} textAnchor="middle" fontWeight={600} style={{ fill: "var(--pink)" }}>
            x = {solution.toFixed(2)}
          </text>
        </g>
      )}

      {/* Step indicator */}
      <text x={svgWidth - 20} y={30} fontSize={11} textAnchor="end" className="fill-current text-muted-foreground">
        步骤 {step + 1} / 4
      </text>
    </svg>
  );
}

export const linearEquationSpec: VisSpec = {
  component: LinearEquationViz,
  supportsAnimation: true,
};

export default LinearEquationViz;
