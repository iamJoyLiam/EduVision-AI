import type { VizProps, VisSpec } from "./helpers";

export function Coord3DViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const cx = svgWidth / 2;
  const cy = svgHeight / 2 + 40;

  const x1 = params.x1 ?? 3;
  const y1 = params.y1 ?? 2;
  const z1 = params.z1 ?? 4;
  const x2 = params.x2 ?? -2;
  const y2 = params.y2 ?? 5;
  const z2 = params.z2 ?? 1;

  const scale = 30;
  const angle = Math.PI / 6;
  const project = (x: number, y: number, z: number) => ({
    sx: cx + (x - y) * Math.cos(angle) * scale,
    sy: cy - z * scale + (x + y) * Math.sin(angle) * scale * 0.5,
  });

  const origin = project(0, 0, 0);
  const xEnd = project(8, 0, 0);
  const yEnd = project(0, 8, 0);
  const zEnd = project(0, 0, 8);
  const p1 = project(x1, y1, z1);
  const p2 = project(x2, y2, z2);
  const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      {/* Axes */}
      <line x1={origin.sx} y1={origin.sy} x2={xEnd.sx} y2={xEnd.sy} stroke="var(--blue)" strokeWidth={2} />
      <line x1={origin.sx} y1={origin.sy} x2={yEnd.sx} y2={yEnd.sy} stroke="var(--pink)" strokeWidth={2} />
      <line x1={origin.sx} y1={origin.sy} x2={zEnd.sx} y2={zEnd.sy} stroke="var(--emerald)" strokeWidth={2} />
      <text x={xEnd.sx + 8} y={xEnd.sy + 4} fontSize={13} fontWeight={600} style={{ fill: "var(--blue)" }}>X</text>
      <text x={yEnd.sx + 8} y={yEnd.sy + 4} fontSize={13} fontWeight={600} style={{ fill: "var(--pink)" }}>Y</text>
      <text x={zEnd.sx + 8} y={zEnd.sy} fontSize={13} fontWeight={600} style={{ fill: "var(--emerald)" }}>Z</text>
      {/* Grid lines on XY plane */}
      {[2, 4, 6].map(v => {
        const g1 = project(v, 0, 0);
        const g2 = project(v, 8, 0);
        const g3 = project(0, v, 0);
        const g4 = project(8, v, 0);
        return (
          <g key={v} opacity={0.15}>
            <line x1={g1.sx} y1={g1.sy} x2={g2.sx} y2={g2.sy} stroke="currentColor" strokeWidth={0.5} className="text-foreground" />
            <line x1={g3.sx} y1={g3.sy} x2={g4.sx} y2={g4.sy} stroke="currentColor" strokeWidth={0.5} className="text-foreground" />
          </g>
        );
      })}
      {/* Points */}
      <circle cx={p1.sx} cy={p1.sy} r={5} fill="var(--blue)" />
      <text x={p1.sx + 10} y={p1.sy - 8} fontSize={13} fontWeight={600} style={{ fill: "var(--blue)" }}>
        P₁({x1},{y1},{z1})
      </text>
      <circle cx={p2.sx} cy={p2.sy} r={5} fill="var(--pink)" />
      <text x={p2.sx + 10} y={p2.sy - 8} fontSize={13} fontWeight={600} style={{ fill: "var(--pink)" }}>
        P₂({x2},{y2},{z2})
      </text>
      {/* Distance line */}
      <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="var(--emerald)" strokeWidth={1.5} strokeDasharray="5 3" />
      {/* Info */}
      <text x={12} y={20} fontSize={13} className="fill-current text-muted-foreground">
        空间直角坐标系
      </text>
      <text x={12} y={40} fontSize={12} className="fill-current text-muted-foreground">
        d = √({x2 - x1}² + {y2 - y1}² + {z2 - z1}²) = {dist.toFixed(2)}
      </text>
    </svg>
  );
}

export const coord3DSpec: VisSpec = { component: Coord3DViz, supportsAnimation: false };
export default Coord3DViz;
