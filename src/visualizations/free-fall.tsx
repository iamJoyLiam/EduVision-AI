import type { VizProps, VisSpec } from "./helpers";

function FreeFallViz({ params, playback }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const initialHeight = params.h;
  const gravity = params.g;
  const fallDuration = Math.sqrt((2 * initialHeight) / gravity);

  const elapsedTime = playback?.elapsed ?? 0;
  const clampedTime = Math.min(elapsedTime, fallDuration);
  const currentHeight = initialHeight - 0.5 * gravity * clampedTime * clampedTime;
  const currentVelocity = gravity * clampedTime;

  const ballY = 40 + ((initialHeight - currentHeight) / initialHeight) * 340;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <rect x={0} y={0} width={svgWidth} height={400} fill="oklch(0.97 0.02 230)" />
      <rect x={0} y={400} width={svgWidth} height={80} fill="oklch(0.85 0.06 100)" />
      <line x1={120} y1={40} x2={120} y2={380} stroke="currentColor" className="text-muted-foreground" />
      {Array.from({ length: 11 }, (_, idx) => {
        const tickY = 40 + (idx / 10) * 340;
        return (
          <g key={idx}>
            <line x1={115} y1={tickY} x2={125} y2={tickY} stroke="currentColor" className="text-muted-foreground" />
            <text x={100} y={tickY + 4} fontSize={10} textAnchor="end" className="fill-current text-muted-foreground">
              {(initialHeight * (1 - idx / 10)).toFixed(0)}
            </text>
          </g>
        );
      })}
      <circle cx={300} cy={ballY} r={14} fill="var(--blue)" />
      <circle cx={300} cy={ballY} r={14} fill="none" stroke="white" strokeOpacity={0.4} strokeWidth={2} />
      <g transform="translate(440,60)">
        <rect width={240} height={120} rx={12} fill="white" stroke="currentColor" className="text-border" />
        <text x={16} y={28} fontSize={12} className="fill-current text-muted-foreground">时间 t</text>
        <text x={224} y={28} fontSize={14} textAnchor="end" className="fill-current">{clampedTime.toFixed(2)} s</text>
        <text x={16} y={58} fontSize={12} className="fill-current text-muted-foreground">下落高度</text>
        <text x={224} y={58} fontSize={14} textAnchor="end" className="fill-current">{(initialHeight - currentHeight).toFixed(2)} m</text>
        <text x={16} y={88} fontSize={12} className="fill-current text-muted-foreground">速度 v</text>
        <text x={224} y={88} fontSize={14} textAnchor="end" className="fill-current">{currentVelocity.toFixed(2)} m/s</text>
        <text x={16} y={112} fontSize={11} className="fill-current text-muted-foreground">
          落地速度 = {Math.sqrt(2 * gravity * initialHeight).toFixed(2)} m/s
        </text>
      </g>
    </svg>
  );
}

export const freeFallSpec: VisSpec = {
  component: FreeFallViz,
  supportsAnimation: true,
};

export default FreeFallViz;
