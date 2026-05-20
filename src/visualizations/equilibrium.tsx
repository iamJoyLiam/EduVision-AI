import type { Point, VizProps, VisSpec } from "./helpers";

interface ConcentrationSeries {
  name: string;
  values: number[];
  color: string;
}

function EquilibriumViz({ params, playback }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const { A0, B0, K } = params;

  const forwardRate = 1;
  const reverseRate = forwardRate / K;
  const timeStep = 0.02;
  const totalSteps = 600;
  const concentrationA: number[] = [A0];
  const concentrationB: number[] = [B0];
  const concentrationC: number[] = [0];

  for (let step = 1; step < totalSteps; step++) {
    const reactionRate =
      forwardRate * concentrationA[step - 1] * concentrationB[step - 1] -
      reverseRate * concentrationC[step - 1];
    concentrationA.push(Math.max(0, concentrationA[step - 1] - reactionRate * timeStep));
    concentrationB.push(Math.max(0, concentrationB[step - 1] - reactionRate * timeStep));
    concentrationC.push(Math.max(0, concentrationC[step - 1] + reactionRate * timeStep));
  }

  const padLeft = 60;
  const padBottom = 50;
  const plotWidth = svgWidth - padLeft - 20;
  const plotHeight = svgHeight - padBottom - 40;
  const yMax = Math.max(A0, B0, ...concentrationC) * 1.1;

  const toPixel = (stepIdx: number, value: number): Point => ({
    x: padLeft + (stepIdx / (totalSteps - 1)) * plotWidth,
    y: padBottom + (1 - value / yMax) * plotHeight,
  });

  const buildSeriesPath = (values: number[]): string =>
    values
      .map((value, idx) => {
        const px = toPixel(idx, value);
        return `${idx === 0 ? "M" : "L"} ${px.x.toFixed(1)} ${px.y.toFixed(1)}`;
      })
      .join(" ");

  const elapsedTime = playback?.elapsed ?? 0;
  const markerIdx = Math.min(Math.floor((elapsedTime % 8) * (totalSteps / 8)), totalSteps - 1);

  const series: ConcentrationSeries[] = [
    { name: "[A]", values: concentrationA, color: "var(--blue)" },
    { name: "[B]", values: concentrationB, color: "var(--emerald)" },
    { name: "[C]", values: concentrationC, color: "var(--pink)" },
  ];

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={padLeft} y={26} fontSize={13} className="fill-current text-muted-foreground">
        平衡 [A]={concentrationA[totalSteps - 1].toFixed(3)} · [B]={concentrationB[totalSteps - 1].toFixed(3)} · [C]={concentrationC[totalSteps - 1].toFixed(3)}
      </text>
      <line x1={padLeft} y1={padBottom} x2={padLeft} y2={padBottom + plotHeight} stroke="currentColor" className="text-muted-foreground" />
      <line x1={padLeft} y1={padBottom + plotHeight} x2={padLeft + plotWidth} y2={padBottom + plotHeight} stroke="currentColor" className="text-muted-foreground" />
      {series.map((s) => (
        <path key={s.name} d={buildSeriesPath(s.values)} fill="none" stroke={s.color} strokeWidth={2.5} />
      ))}
      {(() => {
        const markerX = padLeft + (markerIdx / (totalSteps - 1)) * plotWidth;
        return <line x1={markerX} y1={padBottom} x2={markerX} y2={padBottom + plotHeight} stroke="currentColor" strokeDasharray="3 3" className="text-muted-foreground" />;
      })()}
      <g transform={`translate(${padLeft + plotWidth - 100}, ${padBottom + 14})`}>
        {series.map((s, legendIdx) => (
          <g key={s.name} transform={`translate(0, ${legendIdx * 18})`}>
            <rect width={14} height={3} y={5} fill={s.color} />
            <text x={20} y={9} fontSize={11} className="fill-current">
              {s.name} = {s.values[markerIdx].toFixed(3)}
            </text>
          </g>
        ))}
      </g>
      <text x={padLeft + plotWidth - 30} y={padBottom + plotHeight + 18} fontSize={10} className="fill-current text-muted-foreground">时间 →</text>
    </svg>
  );
}

export const equilibriumSpec: VisSpec = {
  component: EquilibriumViz,
  supportsAnimation: true,
};

export default EquilibriumViz;
