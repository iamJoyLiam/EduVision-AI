import type { Point, VizProps, VisSpec } from "./helpers";

function ProjectileViz({ params, playback }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const { v0, angle, g } = params;
  const radAngle = (angle * Math.PI) / 180;
  const vx0 = v0 * Math.cos(radAngle);
  const vy0 = v0 * Math.sin(radAngle);
  const totalTime = (2 * vy0) / g;
  const range = vx0 * totalTime;
  const maxHeight = (vy0 * vy0) / (2 * g);

  const padLeft = 60;
  const padBottom = 60;
  const plotWidth = svgWidth - padLeft - 20;
  const plotHeight = svgHeight - padBottom - 20;
  const scaleX = plotWidth / Math.max(range * 1.1, 10);
  const scaleY = plotHeight / Math.max(maxHeight * 1.2, 5);
  const scale = Math.min(scaleX, scaleY);

  const toPixel = (mathX: number, mathY: number): Point => ({
    x: padLeft + mathX * scale,
    y: svgHeight - padBottom - mathY * scale,
  });

  const pathPoints: string[] = [];
  const steps = 100;
  for (let step = 0; step <= steps; step++) {
    const t = (step / steps) * totalTime;
    const x = vx0 * t;
    const y = vy0 * t - 0.5 * g * t * t;
    const px = toPixel(x, y);
    pathPoints.push(`${step === 0 ? "M" : "L"} ${px.x.toFixed(1)} ${px.y.toFixed(1)}`);
  }

  const elapsedTime = playback?.elapsed ?? 0;
  const loopTime = elapsedTime % (totalTime + 0.6);
  const clampedTime = Math.min(loopTime, totalTime);
  const ballMathX = vx0 * clampedTime;
  const ballMathY = vy0 * clampedTime - 0.5 * g * clampedTime * clampedTime;
  const ballPixel = toPixel(ballMathX, Math.max(ballMathY, 0));

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="oklch(0.98 0.01 230)" />
      <line x1={padLeft} y1={svgHeight - padBottom} x2={svgWidth - 20} y2={svgHeight - padBottom} stroke="currentColor" className="text-muted-foreground" />
      <line x1={padLeft} y1={20} x2={padLeft} y2={svgHeight - padBottom} stroke="currentColor" className="text-muted-foreground" />
      <path d={pathPoints.join(" ")} fill="none" stroke="var(--blue)" strokeWidth={2} strokeDasharray="3 3" opacity={0.6} />
      <line
        x1={padLeft}
        y1={svgHeight - padBottom}
        x2={padLeft + 40 * Math.cos(radAngle)}
        y2={svgHeight - padBottom - 40 * Math.sin(radAngle)}
        stroke="var(--pink)"
        strokeWidth={2.5}
        markerEnd="url(#arrow)"
      />
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--pink)" />
        </marker>
      </defs>
      <circle cx={ballPixel.x} cy={ballPixel.y} r={9} fill="var(--blue)" />
      <g transform="translate(440,30)">
        <rect width={260} height={130} rx={12} fill="white" stroke="currentColor" className="text-border" />
        <text x={16} y={26} fontSize={12} className="fill-current text-muted-foreground">射程 R</text>
        <text x={244} y={26} fontSize={14} textAnchor="end" className="fill-current">{range.toFixed(2)} m</text>
        <text x={16} y={52} fontSize={12} className="fill-current text-muted-foreground">最大高度</text>
        <text x={244} y={52} fontSize={14} textAnchor="end" className="fill-current">{maxHeight.toFixed(2)} m</text>
        <text x={16} y={78} fontSize={12} className="fill-current text-muted-foreground">飞行时间</text>
        <text x={244} y={78} fontSize={14} textAnchor="end" className="fill-current">{totalTime.toFixed(2)} s</text>
        <text x={16} y={104} fontSize={12} className="fill-current text-muted-foreground">当前位置</text>
        <text x={244} y={104} fontSize={13} textAnchor="end" className="fill-current">
          ({ballMathX.toFixed(1)}, {Math.max(ballMathY, 0).toFixed(1)})
        </text>
      </g>
    </svg>
  );
}

export const projectileSpec: VisSpec = {
  component: ProjectileViz,
  supportsAnimation: true,
};

export default ProjectileViz;
