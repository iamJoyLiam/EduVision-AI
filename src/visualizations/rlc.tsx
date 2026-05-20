import type { VizProps, VisSpec } from "./helpers";

function RlcViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const { R, L, C, f } = params;
  const capacitanceFarad = C * 1e-6;
  const resonantFreq = 1 / (2 * Math.PI * Math.sqrt(L * capacitanceFarad));

  const freqMin = 1;
  const freqMax = Math.max(resonantFreq * 3, f * 1.5, 200);
  const padLeft = 60;
  const padBottom = 50;
  const plotWidth = svgWidth - padLeft - 20;
  const plotHeight = svgHeight - padBottom - 40;
  const sourceVoltage = 10;

  const calcCurrent = (freq: number): number => {
    const inductanceReactance = 2 * Math.PI * freq * L;
    const capacitanceReactance = 1 / (2 * Math.PI * freq * capacitanceFarad);
    const impedance = Math.sqrt(R * R + (inductanceReactance - capacitanceReactance) ** 2);
    return sourceVoltage / impedance;
  };

  const sampleCount = 200;
  let maxCurrent = 0;
  const freqSamples: { freq: number; current: number }[] = [];
  for (let idx = 0; idx <= sampleCount; idx++) {
    const freq = freqMin + ((freqMax - freqMin) * idx) / sampleCount;
    const current = calcCurrent(freq);
    maxCurrent = Math.max(maxCurrent, current);
    freqSamples.push({ freq, current });
  }

  const curvePath = freqSamples
    .map((sample, idx) => {
      const px = padLeft + ((sample.freq - freqMin) / (freqMax - freqMin)) * plotWidth;
      const py = padBottom + (1 - sample.current / maxCurrent) * plotHeight;
      return `${idx === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`;
    })
    .join(" ");

  const currentCurrent = calcCurrent(f);
  const currentPixelX = padLeft + ((f - freqMin) / (freqMax - freqMin)) * plotWidth;
  const currentPixelY = padBottom + (1 - currentCurrent / maxCurrent) * plotHeight;
  const resonantPixelX = padLeft + ((resonantFreq - freqMin) / (freqMax - freqMin)) * plotWidth;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={padLeft} y={26} fontSize={13} className="fill-current text-muted-foreground">
        谐振频率 f₀ = {resonantFreq.toFixed(2)} Hz · 当前 I = {currentCurrent.toFixed(4)} A
      </text>
      <line x1={padLeft} y1={padBottom} x2={padLeft} y2={padBottom + plotHeight} stroke="currentColor" className="text-muted-foreground" />
      <line x1={padLeft} y1={padBottom + plotHeight} x2={padLeft + plotWidth} y2={padBottom + plotHeight} stroke="currentColor" className="text-muted-foreground" />
      {resonantPixelX > padLeft && resonantPixelX < padLeft + plotWidth && (
        <>
          <line x1={resonantPixelX} y1={padBottom} x2={resonantPixelX} y2={padBottom + plotHeight} stroke="var(--pink)" strokeDasharray="4 4" opacity={0.6} />
          <text x={resonantPixelX + 4} y={padBottom + 14} fontSize={11} className="fill-current" style={{ fill: "var(--pink)" }}>f₀</text>
        </>
      )}
      <path d={curvePath} fill="none" stroke="var(--blue)" strokeWidth={2.5} />
      <circle cx={currentPixelX} cy={currentPixelY} r={5} fill="var(--pink)" />
      <text x={padLeft} y={padBottom + plotHeight + 18} fontSize={10} className="fill-current text-muted-foreground">{freqMin.toFixed(0)} Hz</text>
      <text x={padLeft + plotWidth - 40} y={padBottom + plotHeight + 18} fontSize={10} className="fill-current text-muted-foreground">{freqMax.toFixed(0)} Hz</text>
      <text x={padLeft - 8} y={padBottom + 4} fontSize={10} textAnchor="end" className="fill-current text-muted-foreground">I (A)</text>
    </svg>
  );
}

export const rlcSpec: VisSpec = {
  component: RlcViz,
  supportsAnimation: false,
};

export default RlcViz;
