import type { Point, VizProps, VisSpec } from "./helpers";

interface SolubilityCurve {
  name: string;
  color: string;
  calcSolubility: (temperature: number) => number;
}

function SolubilityViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const temperature = params.T;
  const substanceIndex = Math.round(params.substance);

  const curves: SolubilityCurve[] = [
    { name: "KNO₃", color: "var(--blue)", calcSolubility: (t) => 13 + 1.9 * t + 0.005 * t * t },
    { name: "NaCl", color: "var(--emerald)", calcSolubility: (t) => 35.7 + 0.07 * t },
    { name: "Ca(OH)₂", color: "var(--pink)", calcSolubility: (t) => Math.max(0, 0.18 - 0.001 * t) * 100 },
  ];

  const padLeft = 60;
  const padBottom = 50;
  const plotWidth = svgWidth - padLeft - 30;
  const plotHeight = svgHeight - padBottom - 30;
  const yMax = 250;

  const toPixel = (t: number, s: number): Point => ({
    x: padLeft + (t / 100) * plotWidth,
    y: padBottom + (1 - s / yMax) * plotHeight,
  });

  const activeCurve = curves[substanceIndex];
  const activeSolubility = activeCurve.calcSolubility(temperature);
  const activePixel = toPixel(temperature, activeSolubility);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <line x1={padLeft} y1={padBottom} x2={padLeft} y2={padBottom + plotHeight} stroke="currentColor" className="text-muted-foreground" />
      <line x1={padLeft} y1={padBottom + plotHeight} x2={padLeft + plotWidth} y2={padBottom + plotHeight} stroke="currentColor" className="text-muted-foreground" />
      {curves.map((curve, curveIdx) => {
        const pathPoints: string[] = [];
        for (let t = 0; t <= 100; t += 2) {
          const px = toPixel(t, curve.calcSolubility(t));
          pathPoints.push(`${pathPoints.length === 0 ? "M" : "L"} ${px.x.toFixed(1)} ${px.y.toFixed(1)}`);
        }
        const isActive = curveIdx === substanceIndex;
        return (
          <path
            key={curve.name}
            d={pathPoints.join(" ")}
            fill="none"
            stroke={curve.color}
            strokeWidth={isActive ? 3 : 1.5}
            opacity={isActive ? 1 : 0.35}
          />
        );
      })}
      <line x1={activePixel.x} y1={padBottom} x2={activePixel.x} y2={padBottom + plotHeight} stroke="currentColor" strokeDasharray="3 3" className="text-muted-foreground" />
      <circle cx={activePixel.x} cy={activePixel.y} r={6} fill={activeCurve.color} />
      <text x={activePixel.x + 10} y={activePixel.y - 8} fontSize={12} className="fill-current">
        S = {activeSolubility.toFixed(1)} g/100g水
      </text>
      <g transform={`translate(${padLeft + 12}, ${padBottom + 12})`}>
        {curves.map((curve, curveIdx) => (
          <g key={curve.name} transform={`translate(0, ${curveIdx * 18})`}>
            <rect width={12} height={3} y={5} fill={curve.color} opacity={curveIdx === substanceIndex ? 1 : 0.4} />
            <text x={18} y={9} fontSize={11} className="fill-current">{curve.name}</text>
          </g>
        ))}
      </g>
      <text x={padLeft + plotWidth - 30} y={padBottom + plotHeight + 18} fontSize={10} className="fill-current text-muted-foreground">T (°C)</text>
    </svg>
  );
}

export const solubilitySpec: VisSpec = {
  component: SolubilityViz,
  supportsAnimation: false,
};

export default SolubilityViz;
