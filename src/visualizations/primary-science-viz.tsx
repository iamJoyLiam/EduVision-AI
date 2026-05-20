import type { VizProps, VisSpec } from "./helpers";

export function MatterStatesViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const temp = params.temp ?? 50;

  const states = [
    { label: "固态", range: [0, 30], color: "var(--blue)" },
    { label: "液态", range: [30, 70], color: "var(--emerald)" },
    { label: "气态", range: [70, 100], color: "var(--pink)" },
  ];

  const currentState = states.find((s) => temp >= s.range[0] && temp <= s.range[1]) || states[1];

  const particleCount = 18;
  const spread = temp < 30 ? 0.4 : temp < 70 ? 0.7 : 1.0;
  const jitter = temp < 30 ? 3 : temp < 70 ? 8 : 15;

  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (i / particleCount) * Math.PI * 2;
    const r = 50 + (i % 3) * 30 * spread;
    const cx = 200 + r * Math.cos(angle) + ((i * 7) % jitter) - jitter / 2;
    const cy = 240 + r * Math.sin(angle) + ((i * 11) % jitter) - jitter / 2;
    return { cx, cy, r: temp < 30 ? 12 : temp < 70 ? 9 : 7 };
  });

  const tempBarX = 480;
  const tempBarY = 100;
  const tempBarH = 280;
  const tempBarW = 30;
  const markerY = tempBarY + tempBarH - (temp / 100) * tempBarH;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={30} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">
        物质三态变化
      </text>
      {/* Particles */}
      <rect x={60} y={100} width={280} height={280} rx={16} fill={currentState.color} opacity={0.08} stroke={currentState.color} strokeWidth={2} />
      {particles.map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={currentState.color} opacity={0.7} />
      ))}
      <text x={200} y={420} fontSize={16} textAnchor="middle" fontWeight={600} style={{ fill: currentState.color }}>
        {currentState.label}
      </text>
      <text x={200} y={445} fontSize={13} textAnchor="middle" className="fill-current text-muted-foreground">
        温度 = {temp.toFixed(0)}°C
      </text>
      {/* Thermometer */}
      <text x={tempBarX + tempBarW / 2} y={80} fontSize={14} textAnchor="middle" fontWeight={600} className="fill-current">
        温度计
      </text>
      <rect x={tempBarX} y={tempBarY} width={tempBarW} height={tempBarH} rx={8} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-foreground" />
      <rect x={tempBarX + 4} y={markerY} width={tempBarW - 8} height={tempBarY + tempBarH - markerY} rx={4} fill="var(--pink)" opacity={0.7} />
      <line x1={tempBarX - 10} y1={markerY} x2={tempBarX + tempBarW + 10} y2={markerY} stroke="var(--pink)" strokeWidth={2} />
      <text x={tempBarX + tempBarW + 18} y={markerY + 5} fontSize={13} fontWeight={600} style={{ fill: "var(--pink)" }}>
        {temp.toFixed(0)}°C
      </text>
      {/* Scale marks */}
      {[0, 25, 50, 75, 100].map((t) => {
        const y = tempBarY + tempBarH - (t / 100) * tempBarH;
        return (
          <g key={t}>
            <line x1={tempBarX - 5} y1={y} x2={tempBarX} y2={y} stroke="currentColor" strokeWidth={1} className="text-foreground" />
            <text x={tempBarX - 8} y={y + 4} fontSize={10} textAnchor="end" className="fill-current text-muted-foreground">{t}°</text>
          </g>
        );
      })}
      {/* State descriptions */}
      <text x={560} y={140} fontSize={13} className="fill-current text-muted-foreground">0~30°C: 固态</text>
      <text x={560} y={170} fontSize={13} className="fill-current text-muted-foreground">粒子紧密排列</text>
      <text x={560} y={220} fontSize={13} className="fill-current text-muted-foreground">30~70°C: 液态</text>
      <text x={560} y={250} fontSize={13} className="fill-current text-muted-foreground">粒子可流动</text>
      <text x={560} y={300} fontSize={13} className="fill-current text-muted-foreground">70~100°C: 气态</text>
      <text x={560} y={330} fontSize={13} className="fill-current text-muted-foreground">粒子自由运动</text>
    </svg>
  );
}

export const matterStatesSpec: VisSpec = { component: MatterStatesViz, supportsAnimation: false };
