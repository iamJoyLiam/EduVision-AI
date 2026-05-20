import { type VizProps, type VisSpec } from "./helpers";

// ── 分数意义与运算 ──
export function FractionViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const a = Math.max(1, Math.round(params.a ?? 1));
  const b = Math.max(1, Math.round(params.b ?? 3));
  const k = Math.max(1, Math.round(params.k ?? 1));
  const ka = a * k;
  const kb = b * k;

  const drawPie = (cx: number, cy: number, r: number, num: number, den: number, color: string) => {
    const segs: React.ReactNode[] = [];
    for (let i = 0; i < den; i++) {
      const startAngle = (i / den) * 2 * Math.PI - Math.PI / 2;
      const endAngle = ((i + 1) / den) * 2 * Math.PI - Math.PI / 2;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArc = den === 1 ? 1 : 0;
      const filled = i < num;
      segs.push(
        <path key={i}
          d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
          fill={filled ? color : "none"}
          stroke="currentColor" strokeWidth={1.5} className="text-foreground" opacity={filled ? 0.7 : 0.15}
        />
      );
    }
    return segs;
  };

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={30} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">分数的意义</text>
      {/* Original fraction */}
      <text x={180} y={70} fontSize={16} textAnchor="middle" className="fill-current">分数 {a}/{b}</text>
      <g>{drawPie(180, 200, 100, a, b, "var(--blue)")}</g>
      <text x={180} y={340} fontSize={14} textAnchor="middle" className="fill-current text-muted-foreground">分成 {b} 份，取 {a} 份</text>
      {/* Scaled fraction */}
      <text x={540} y={70} fontSize={16} textAnchor="middle" className="fill-current">等值分数 {ka}/{kb}</text>
      <g>{drawPie(540, 200, 100, ka, kb, "var(--pink)")}</g>
      <text x={540} y={340} fontSize={14} textAnchor="middle" className="fill-current text-muted-foreground">分成 {kb} 份，取 {ka} 份</text>
      {/* Equality */}
      <text x={svgWidth / 2} y={400} fontSize={20} textAnchor="middle" fontWeight={600} className="fill-current">
        {a}/{b} = {ka}/{kb}
      </text>
      <text x={svgWidth / 2} y={430} fontSize={14} textAnchor="middle" className="fill-current text-muted-foreground">
        分子分母同时乘以 {k}，分数值不变
      </text>
    </svg>
  );
}

// ── 平面图形面积 ──
export function AreaViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const shape = Math.round(params.shape ?? 0);
  const base = params.base ?? 6;
  const height = params.height ?? 4;

  const scale = 30;
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;

  const renderShape = () => {
    if (shape === 0) {
      // Rectangle
      const w = base * scale;
      const h = height * scale;
      return (
        <g>
          <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill="var(--blue)" opacity={0.3} stroke="var(--blue)" strokeWidth={2} />
          {/* Grid lines */}
          {Array.from({ length: Math.floor(base) }, (_, i) => (
            <line key={`v${i}`} x1={cx - w / 2 + (i + 1) * scale} y1={cy - h / 2} x2={cx - w / 2 + (i + 1) * scale} y2={cy + h / 2} stroke="var(--blue)" strokeWidth={0.5} opacity={0.3} />
          ))}
          {Array.from({ length: Math.floor(height) }, (_, i) => (
            <line key={`h${i}`} x1={cx - w / 2} y1={cy - h / 2 + (i + 1) * scale} x2={cx + w / 2} y2={cy - h / 2 + (i + 1) * scale} stroke="var(--blue)" strokeWidth={0.5} opacity={0.3} />
          ))}
          <text x={cx} y={cy - h / 2 - 10} fontSize={13} textAnchor="middle" className="fill-current">底 = {base.toFixed(1)}</text>
          <text x={cx + w / 2 + 15} y={cy} fontSize={13} className="fill-current">高 = {height.toFixed(1)}</text>
          <text x={cx} y={cy + h / 2 + 25} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">S = {base.toFixed(1)} × {height.toFixed(1)} = {(base * height).toFixed(1)}</text>
        </g>
      );
    } else {
      // Triangle
      const w = base * scale;
      const h = height * scale;
      return (
        <g>
          <polygon points={`${cx - w / 2},${cy + h / 2} ${cx + w / 2},${cy + h / 2} ${cx},${cy - h / 2}`}
            fill="var(--pink)" opacity={0.3} stroke="var(--pink)" strokeWidth={2} />
          {/* Height line */}
          <line x1={cx} y1={cy - h / 2} x2={cx} y2={cy + h / 2} stroke="var(--emerald)" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={cx - w / 2 - 10} y={cy + h / 2 + 20} fontSize={13} textAnchor="middle" className="fill-current">底 = {base.toFixed(1)}</text>
          <text x={cx + 15} y={cy} fontSize={13} className="fill-current">高 = {height.toFixed(1)}</text>
          <text x={cx} y={cy + h / 2 + 40} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">
            S = ½ × {base.toFixed(1)} × {height.toFixed(1)} = {(0.5 * base * height).toFixed(1)}
          </text>
        </g>
      );
    }
  };

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={30} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">
        {shape === 0 ? "矩形面积" : "三角形面积"}
      </text>
      <text x={svgWidth / 2} y={55} fontSize={14} textAnchor="middle" className="fill-current text-muted-foreground">
        {shape === 0 ? "S = 底 × 高" : "S = ½ × 底 × 高"}
      </text>
      {renderShape()}
    </svg>
  );
}

// ── 比与比例 ──
export function RatioViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const a = Math.max(1, Math.round(params.a ?? 2));
  const b = Math.max(1, Math.round(params.b ?? 3));
  const k = Math.max(1, Math.round(params.k ?? 2));
  const c = a * k;
  const d = b * k;

  const barMax = 400;
  const scale = barMax / Math.max(a, b, c, d);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={30} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">比与比例</text>
      <text x={svgWidth / 2} y={58} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">a/b = c/d → ad = bc</text>
      {/* Original ratio */}
      <text x={120} y={120} fontSize={14} textAnchor="middle" fontWeight={600} className="fill-current">比 {a} : {b}</text>
      <rect x={120} y={140} width={a * scale} height={30} fill="var(--blue)" opacity={0.6} rx={4} />
      <text x={120 + a * scale / 2} y={160} fontSize={12} textAnchor="middle" fill="white">{a}</text>
      <rect x={120} y={180} width={b * scale} height={30} fill="var(--pink)" opacity={0.6} rx={4} />
      <text x={120 + b * scale / 2} y={200} fontSize={12} textAnchor="middle" fill="white">{b}</text>
      {/* Scaled ratio */}
      <text x={120} y={280} fontSize={14} textAnchor="middle" fontWeight={600} className="fill-current">比 {c} : {d}</text>
      <rect x={120} y={300} width={c * scale} height={30} fill="var(--blue)" opacity={0.6} rx={4} />
      <text x={120 + c * scale / 2} y={320} fontSize={12} textAnchor="middle" fill="white">{c}</text>
      <rect x={120} y={340} width={d * scale} height={30} fill="var(--pink)" opacity={0.6} rx={4} />
      <text x={120 + d * scale / 2} y={360} fontSize={12} textAnchor="middle" fill="white">{d}</text>
      {/* Verification */}
      <text x={svgWidth / 2} y={420} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">
        {a}/{b} = {c}/{d}，验证: {a}×{d} = {a * d}，{b}×{c} = {b * c} ✓
      </text>
    </svg>
  );
}

// ── 简易方程 ──
export function SimpleEquationViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const a = params.a ?? 2;
  const b = params.b ?? 3;
  const c = params.c ?? 7;
  const x = a !== 0 ? (c - b) / a : 0;

  const balanceY = 240;
  const leftX = 200;
  const rightX = 520;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={30} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">简易方程</text>
      <text x={svgWidth / 2} y={58} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">{a}x + {b} = {c}</text>
      {/* Balance beam */}
      <line x1={100} y1={balanceY} x2={620} y2={balanceY} stroke="currentColor" strokeWidth={3} className="text-foreground" />
      {/* Fulcrum */}
      <polygon points={`${svgWidth / 2 - 20},${balanceY + 40} ${svgWidth / 2 + 20},${balanceY + 40} ${svgWidth / 2},${balanceY}`} fill="var(--emerald)" opacity={0.6} />
      {/* Left side */}
      <rect x={leftX - 50} y={balanceY - 80} width={100} height={70} rx={8} fill="var(--blue)" opacity={0.2} stroke="var(--blue)" strokeWidth={1.5} />
      <text x={leftX} y={balanceY - 40} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">{a}x + {b}</text>
      {/* Right side */}
      <rect x={rightX - 30} y={balanceY - 80} width={60} height={70} rx={8} fill="var(--pink)" opacity={0.2} stroke="var(--pink)" strokeWidth={1.5} />
      <text x={rightX} y={balanceY - 40} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">{c}</text>
      {/* Solution steps */}
      <text x={svgWidth / 2} y={330} fontSize={15} textAnchor="middle" className="fill-current">移项: {a}x = {c} - {b} = {c - b}</text>
      <text x={svgWidth / 2} y={360} fontSize={15} textAnchor="middle" className="fill-current">两边除以 {a}: x = {c - b} / {a} = {x.toFixed(2)}</text>
      <text x={svgWidth / 2} y={400} fontSize={20} textAnchor="middle" fontWeight={600} style={{ fill: "var(--emerald)" }}>x = {x.toFixed(2)}</text>
      {/* Verification */}
      <text x={svgWidth / 2} y={440} fontSize={14} textAnchor="middle" className="fill-current text-muted-foreground">
        验证: {a}×{x.toFixed(2)} + {b} = {(a * x + b).toFixed(2)} ✓
      </text>
    </svg>
  );
}

// ── 坐标系与位置 ──
export function CoordViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const px = Math.round(params.x ?? 3);
  const py = Math.round(params.y ?? 2);

  const cx = svgWidth / 2;
  const cy = svgHeight / 2;
  const scale = 40;
  const gridSize = 8;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={25} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">坐标系与位置</text>
      {/* Grid */}
      {Array.from({ length: gridSize * 2 + 1 }, (_, i) => {
        const v = i - gridSize;
        return (
          <g key={i} opacity={0.15}>
            <line x1={cx + v * scale} y1={cy - gridSize * scale} x2={cx + v * scale} y2={cy + gridSize * scale} stroke="currentColor" strokeWidth={0.5} className="text-foreground" />
            <line x1={cx - gridSize * scale} y1={cy + v * scale} x2={cx + gridSize * scale} y2={cy + v * scale} stroke="currentColor" strokeWidth={0.5} className="text-foreground" />
          </g>
        );
      })}
      {/* Axes */}
      <line x1={cx - gridSize * scale} y1={cy} x2={cx + gridSize * scale} y2={cy} stroke="currentColor" strokeWidth={2} className="text-foreground" />
      <line x1={cx} y1={cy - gridSize * scale} x2={cx} y2={cy + gridSize * scale} stroke="currentColor" strokeWidth={2} className="text-foreground" />
      {/* Axis labels */}
      {Array.from({ length: gridSize }, (_, i) => {
        const v = i + 1;
        return (
          <g key={i}>
            <text x={cx + v * scale} y={cy + 18} fontSize={11} textAnchor="middle" className="fill-current text-muted-foreground">{v}</text>
            <text x={cx - v * scale} y={cy + 18} fontSize={11} textAnchor="middle" className="fill-current text-muted-foreground">-{v}</text>
            <text x={cx - 15} y={cy - v * scale + 4} fontSize={11} textAnchor="end" className="fill-current text-muted-foreground">{v}</text>
            <text x={cx - 15} y={cy + v * scale + 4} fontSize={11} textAnchor="end" className="fill-current text-muted-foreground">-{v}</text>
          </g>
        );
      })}
      <text x={cx + gridSize * scale + 10} y={cy - 8} fontSize={13} className="fill-current">x</text>
      <text x={cx + 10} y={cy - gridSize * scale - 8} fontSize={13} className="fill-current">y</text>
      {/* Point */}
      <circle cx={cx + px * scale} cy={cy - py * scale} r={6} fill="var(--blue)" />
      {/* Dashed lines */}
      <line x1={cx + px * scale} y1={cy - py * scale} x2={cx + px * scale} y2={cy} stroke="var(--pink)" strokeWidth={1.5} strokeDasharray="4 3" />
      <line x1={cx} y1={cy - py * scale} x2={cx + px * scale} y2={cy - py * scale} stroke="var(--pink)" strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={cx + px * scale + 12} y={cy - py * scale - 10} fontSize={14} fontWeight={600} style={{ fill: "var(--blue)" }}>({px}, {py})</text>
    </svg>
  );
}

export const fractionSpec: VisSpec = { component: FractionViz, supportsAnimation: false };
export const areaSpec: VisSpec = { component: AreaViz, supportsAnimation: false };
export const ratioSpec: VisSpec = { component: RatioViz, supportsAnimation: false };
export const simpleEquationSpec: VisSpec = { component: SimpleEquationViz, supportsAnimation: false };
export const coordSpec: VisSpec = { component: CoordViz, supportsAnimation: false };
