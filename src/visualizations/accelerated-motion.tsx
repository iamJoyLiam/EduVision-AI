import type { VizProps, VisSpec } from "./helpers";

function AcceleratedMotionViz({ params, playback }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const v0 = params.v0;
  const a = params.a;
  const duration = 8;

  const elapsed = playback?.elapsed ?? 0;
  const currentV = v0 + a * elapsed;
  const currentS = v0 * elapsed + 0.5 * a * elapsed * elapsed;

  // Layout: left track, right top v-t, right bottom s-t
  const trackPadLeft = 60;
  const trackPadRight = 20;
  const trackWidth = svgWidth - trackPadLeft - trackPadRight;
  const trackY = 140;

  // Right panels
  const panelLeft = 360;
  const panelWidth = svgWidth - panelLeft - 20;
  const vtTop = 30;
  const vtHeight = 160;
  const stTop = 220;
  const stHeight = 160;

  // Compute range for v-t and s-t graphs
  const tMax = duration;
  const vMax = Math.max(Math.abs(v0 + a * tMax), Math.abs(v0), 10);
  const sAtMax = v0 * tMax + 0.5 * a * tMax * tMax;
  const sMax = Math.max(Math.abs(sAtMax), Math.abs(currentS), 10);

  // v-t graph coordinate mapping
  const vtToPixel = (t: number, v: number) => ({
    x: panelLeft + (t / tMax) * panelWidth,
    y: vtTop + vtHeight / 2 - (v / vMax) * (vtHeight / 2 - 10),
  });

  // s-t graph coordinate mapping
  const stToPixel = (t: number, s: number) => ({
    x: panelLeft + (t / tMax) * panelWidth,
    y: stTop + stHeight / 2 - (s / sMax) * (stHeight / 2 - 10),
  });

  // Generate v-t curve path (linear: v = v0 + a*t)
  const vtPath = `M ${vtToPixel(0, v0).x.toFixed(1)} ${vtToPixel(0, v0).y.toFixed(1)} L ${vtToPixel(tMax, v0 + a * tMax).x.toFixed(1)} ${vtToPixel(tMax, v0 + a * tMax).y.toFixed(1)}`;

  // Generate s-t curve path (parabolic: s = v0*t + 0.5*a*t^2)
  const stPoints: string[] = [];
  for (let t = 0; t <= tMax; t += 0.1) {
    const s = v0 * t + 0.5 * a * t * t;
    const px = stToPixel(t, s);
    stPoints.push(`${stPoints.length === 0 ? "M" : "L"} ${px.x.toFixed(1)} ${px.y.toFixed(1)}`);
  }

  // Current point positions
  const vtCurrent = vtToPixel(elapsed, currentV);
  const stCurrent = stToPixel(elapsed, currentS);

  // Track object position (map s to horizontal position on track)
  const maxTrackS = Math.max(Math.abs(sAtMax), 1);
  const objectX = trackPadLeft + ((currentS + maxTrackS) / (2 * maxTrackS)) * trackWidth;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      {/* Track section */}
      <rect x={trackPadLeft - 10} y={trackY - 30} width={trackWidth + 20} height={60} rx={8} fill="oklch(0.97 0.01 230)" />
      <line x1={trackPadLeft} y1={trackY + 10} x2={trackPadLeft + trackWidth} y2={trackY + 10} stroke="currentColor" strokeWidth={2} className="text-foreground" />
      {/* Track ticks */}
      {Array.from({ length: 11 }, (_, idx) => {
        const x = trackPadLeft + (idx / 10) * trackWidth;
        return (
          <g key={idx}>
            <line x1={x} y1={trackY + 10} x2={x} y2={trackY + 18} stroke="currentColor" className="text-muted-foreground" />
          </g>
        );
      })}
      {/* Moving object */}
      <circle cx={Math.max(trackPadLeft, Math.min(trackPadLeft + trackWidth, objectX))} cy={trackY} r={12} fill="var(--blue)" />

      {/* Data readout */}
      <g transform="translate(20, 30)">
        <text fontSize={12} className="fill-current text-muted-foreground">t = {elapsed.toFixed(2)} s</text>
        <text y={20} fontSize={12} className="fill-current text-muted-foreground">v = {currentV.toFixed(2)} m/s</text>
        <text y={40} fontSize={12} className="fill-current text-muted-foreground">s = {currentS.toFixed(2)} m</text>
      </g>

      {/* v-t graph */}
      <line x1={panelLeft} y1={vtTop} x2={panelLeft} y2={vtTop + vtHeight} stroke="currentColor" className="text-muted-foreground" />
      <line x1={panelLeft} y1={vtTop + vtHeight / 2} x2={panelLeft + panelWidth} y2={vtTop + vtHeight / 2} stroke="currentColor" strokeWidth={0.5} strokeDasharray="3 3" className="text-muted-foreground" />
      <line x1={panelLeft} y1={vtTop + vtHeight} x2={panelLeft + panelWidth} y2={vtTop + vtHeight} stroke="currentColor" className="text-muted-foreground" />
      <text x={panelLeft - 4} y={vtTop + 14} fontSize={10} textAnchor="end" className="fill-current text-muted-foreground">v</text>
      <path d={vtPath} fill="none" stroke="var(--blue)" strokeWidth={2} />
      <circle cx={vtCurrent.x} cy={vtCurrent.y} r={5} fill="var(--pink)" />
      <text x={panelLeft + panelWidth} y={vtTop + vtHeight + 16} fontSize={10} textAnchor="end" className="fill-current text-muted-foreground">v-t 图</text>

      {/* s-t graph */}
      <line x1={panelLeft} y1={stTop} x2={panelLeft} y2={stTop + stHeight} stroke="currentColor" className="text-muted-foreground" />
      <line x1={panelLeft} y1={stTop + stHeight / 2} x2={panelLeft + panelWidth} y2={stTop + stHeight / 2} stroke="currentColor" strokeWidth={0.5} strokeDasharray="3 3" className="text-muted-foreground" />
      <line x1={panelLeft} y1={stTop + stHeight} x2={panelLeft + panelWidth} y2={stTop + stHeight} stroke="currentColor" className="text-muted-foreground" />
      <text x={panelLeft - 4} y={stTop + 14} fontSize={10} textAnchor="end" className="fill-current text-muted-foreground">s</text>
      <path d={stPoints.join(" ")} fill="none" stroke="var(--emerald)" strokeWidth={2} />
      <circle cx={stCurrent.x} cy={stCurrent.y} r={5} fill="var(--pink)" />
      <text x={panelLeft + panelWidth} y={stTop + stHeight + 16} fontSize={10} textAnchor="end" className="fill-current text-muted-foreground">s-t 图</text>

      {/* Formulas */}
      <text x={20} y={svgHeight - 20} fontSize={11} className="fill-current text-muted-foreground">
        v = v₀ + at = {v0.toFixed(1)} + {a.toFixed(1)}t · s = v₀t + ½at²
      </text>
    </svg>
  );
}

export const acceleratedMotionSpec: VisSpec = {
  component: AcceleratedMotionViz,
  supportsAnimation: true,
};

export default AcceleratedMotionViz;
