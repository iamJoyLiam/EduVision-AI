import * as React from "react";
import type { VizProps, VisSpec } from "./helpers";

function SequenceLimitViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const totalTerms = Math.floor(params.N);
  const padX = 50;
  const padY = 30;
  const plotWidth = svgWidth - padX - 20;
  const plotHeight = svgHeight - padY - 30;
  const yMax = 1.1;

  const dotElements: React.JSX.Element[] = [];
  for (let term = 1; term <= totalTerms; term++) {
    const value = 1 / term;
    const px = padX + ((term - 1) / Math.max(totalTerms - 1, 1)) * plotWidth;
    const py = padY + (1 - value / yMax) * plotHeight;
    dotElements.push(<circle key={term} cx={px} cy={py} r={2.5} fill="var(--blue)" />);
  }

  const yZeroLine = padY + plotHeight;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <line x1={padX} y1={padY} x2={padX} y2={padY + plotHeight} stroke="currentColor" className="text-muted-foreground" />
      <line x1={padX} y1={yZeroLine} x2={padX + plotWidth} y2={yZeroLine} stroke="currentColor" className="text-muted-foreground" />
      <line x1={padX} y1={yZeroLine} x2={padX + plotWidth} y2={yZeroLine} stroke="var(--pink)" strokeDasharray="4 4" />
      {dotElements}
      <text x={padX + 4} y={padY + 14} fontSize={12} className="fill-current text-muted-foreground">aₙ = 1/n</text>
      <text x={padX + plotWidth - 60} y={yZeroLine - 6} fontSize={11} className="fill-current" style={{ fill: "var(--pink)" }}>极限 = 0</text>
      <text x={padX - 10} y={padY + plotHeight + 18} fontSize={10} className="fill-current text-muted-foreground">n=1</text>
      <text x={padX + plotWidth - 20} y={padY + plotHeight + 18} fontSize={10} className="fill-current text-muted-foreground">n={totalTerms}</text>
    </svg>
  );
}

export const sequenceLimitSpec: VisSpec = {
  component: SequenceLimitViz,
  supportsAnimation: false,
};

export default SequenceLimitViz;
