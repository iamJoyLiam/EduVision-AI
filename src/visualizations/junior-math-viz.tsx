import { toSvgPixel, Axes, type VizProps, type VisSpec } from "./helpers";

// ── 实数与绝对值 ──
export function AbsoluteValueViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const lineY = 200;
  const padL = 50;
  const scale = 28;

  const xVal = params.x ?? 3;

  const numToX = (n: number) => padL + (n + 12) * scale;
  const absVal = Math.abs(xVal);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={30} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">实数与绝对值</text>
      <text x={svgWidth / 2} y={58} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">|x| = 距离原点的距离</text>
      {/* Number line */}
      <line x1={padL} y1={lineY} x2={padL + 24 * scale} y2={lineY} stroke="currentColor" strokeWidth={2} className="text-foreground" />
      {Array.from({ length: 25 }, (_, i) => {
        const n = i - 12;
        const x = numToX(n);
        const isMajor = n % 3 === 0;
        return (
          <g key={i}>
            <line x1={x} y1={lineY - (isMajor ? 8 : 4)} x2={x} y2={lineY + (isMajor ? 8 : 4)} stroke="currentColor" strokeWidth={isMajor ? 1.5 : 0.8} className="text-foreground" />
            {isMajor && <text x={x} y={lineY + 25} fontSize={11} textAnchor="middle" className="fill-current text-muted-foreground">{n}</text>}
          </g>
        );
      })}
      {/* Point x */}
      <circle cx={numToX(xVal)} cy={lineY} r={7} fill="var(--blue)" />
      <text x={numToX(xVal)} y={lineY - 16} fontSize={14} textAnchor="middle" fontWeight={600} style={{ fill: "var(--blue)" }}>x = {xVal.toFixed(1)}</text>
      {/* Distance arrow */}
      <line x1={numToX(0)} y1={lineY + 45} x2={numToX(xVal)} y2={lineY + 45} stroke="var(--pink)" strokeWidth={2} markerEnd="url(#abs-arrow)" markerStart="url(#abs-arrow)" />
      <text x={(numToX(0) + numToX(xVal)) / 2} y={lineY + 70} fontSize={14} textAnchor="middle" fontWeight={600} style={{ fill: "var(--pink)" }}>
        |x| = {absVal.toFixed(1)}
      </text>
      <defs>
        <marker id="abs-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4">
          <circle cx="5" cy="5" r="3" fill="var(--pink)" />
        </marker>
      </defs>
      {/* Formula */}
      <text x={svgWidth / 2} y={340} fontSize={15} textAnchor="middle" className="fill-current">
        |{xVal.toFixed(1)}| = {xVal >= 0 ? `${xVal.toFixed(1)}` : `-(${xVal.toFixed(1)}) = ${absVal.toFixed(1)}`}
      </text>
      <text x={svgWidth / 2} y={380} fontSize={14} textAnchor="middle" className="fill-current text-muted-foreground">
        {xVal >= 0 ? "x ≥ 0 时，|x| = x" : "x < 0 时，|x| = -x"}
      </text>
    </svg>
  );
}

// ── 二元一次方程组 ──
export function LinearSystemViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const xMin = -8;
  const xMax = 8;
  const yMin = -8;
  const yMax = 8;

  const a1 = params.a1 ?? 2;
  const b1 = params.b1 ?? 1;
  const c1 = params.c1 ?? 5;
  const a2 = params.a2 ?? 1;
  const b2 = params.b2 ?? -1;
  const c2 = params.c2 ?? 1;

  const det = a1 * b2 - a2 * b1;
  const hasSolution = Math.abs(det) > 0.001;
  const sx = hasSolution ? (c1 * b2 - c2 * b1) / det : 0;
  const sy = hasSolution ? (a1 * c2 - a2 * c1) / det : 0;

  const linePath = (a: number, b: number, c: number) => {
    if (Math.abs(b) > 0.001) {
      const y1 = (c - a * xMin) / b;
      const y2 = (c - a * xMax) / b;
      const p1 = toSvgPixel(xMin, y1, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
      const p2 = toSvgPixel(xMax, y2, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
      return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    const x = c / a;
    const p1 = toSvgPixel(x, yMin, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
    const p2 = toSvgPixel(x, yMax, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
    return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  };

  const sp = hasSolution ? toSvgPixel(sx, sy, xMin, xMax, yMin, yMax, svgWidth, svgHeight) : null;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <Axes svgWidth={svgWidth} svgHeight={svgHeight} xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} />
      <path d={linePath(a1, b1, c1)} fill="none" stroke="var(--blue)" strokeWidth={2.5} />
      <path d={linePath(a2, b2, c2)} fill="none" stroke="var(--pink)" strokeWidth={2.5} />
      {sp && <circle cx={sp.x} cy={sp.y} r={6} fill="var(--emerald)" />}
      <text x={12} y={20} fontSize={13} className="fill-current text-muted-foreground">
        {a1}x + {b1}y = {c1}
      </text>
      <text x={12} y={40} fontSize={13} className="fill-current text-muted-foreground">
        {a2}x + {b2}y = {c2}
      </text>
      {hasSolution && <text x={sp!.x + 12} y={sp!.y - 10} fontSize={13} fontWeight={600} style={{ fill: "var(--emerald)" }}>
        x={sx.toFixed(2)}, y={sy.toFixed(2)}
      </text>}
    </svg>
  );
}

// ── 一元一次不等式 ──
export function InequalityViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const a = params.a ?? 2;
  const b = params.b ?? -4;
  const boundary = a !== 0 ? -b / a : 0;

  const lineY = 200;
  const padL = 60;
  const scale = 25;
  const numToX = (n: number) => padL + (n + 10) * scale;

  const shadeStart = a > 0 ? boundary : -10;
  const shadeEnd = a > 0 ? 10 : boundary;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={30} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">一元一次不等式</text>
      <text x={svgWidth / 2} y={58} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">{a}x + {b} {'>'} 0</text>
      {/* Number line */}
      <line x1={padL} y1={lineY} x2={padL + 20 * scale} y2={lineY} stroke="currentColor" strokeWidth={2} className="text-foreground" />
      {Array.from({ length: 21 }, (_, i) => {
        const n = i - 10;
        const x = numToX(n);
        return (
          <g key={i}>
            <line x1={x} y1={lineY - 5} x2={x} y2={lineY + 5} stroke="currentColor" strokeWidth={1} className="text-foreground" />
            {n % 2 === 0 && <text x={x} y={lineY + 22} fontSize={11} textAnchor="middle" className="fill-current text-muted-foreground">{n}</text>}
          </g>
        );
      })}
      {/* Shaded region */}
      <rect x={numToX(shadeStart)} y={lineY - 15} width={numToX(shadeEnd) - numToX(shadeStart)} height={30} fill="var(--blue)" opacity={0.15} rx={4} />
      {/* Boundary point */}
      <circle cx={numToX(boundary)} cy={lineY} r={7} fill="none" stroke="var(--pink)" strokeWidth={2} />
      <text x={numToX(boundary)} y={lineY - 25} fontSize={14} textAnchor="middle" fontWeight={600} style={{ fill: "var(--pink)" }}>x = {boundary.toFixed(2)}</text>
      {/* Arrow indicating direction */}
      {a > 0 ? (
        <text x={numToX(5)} y={lineY - 35} fontSize={16} textAnchor="middle" style={{ fill: "var(--blue)" }}>→ x {'>'} {boundary.toFixed(2)}</text>
      ) : (
        <text x={numToX(-5)} y={lineY - 35} fontSize={16} textAnchor="middle" style={{ fill: "var(--blue)" }}>← x {'<'} {boundary.toFixed(2)}</text>
      )}
      {/* Solution */}
      <text x={svgWidth / 2} y={320} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">
        解集: x {a > 0 ? '>' : '<'} {boundary.toFixed(2)}
      </text>
      <text x={svgWidth / 2} y={360} fontSize={14} textAnchor="middle" className="fill-current text-muted-foreground">
        数轴上蓝色区域为解集，空心圆表示不包含边界点
      </text>
    </svg>
  );
}

// ── 勾股定理 ──
export function PythagoreanViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const a = Math.max(1, params.a ?? 3);
  const b = Math.max(1, params.b ?? 4);
  const c = Math.sqrt(a * a + b * b);

  const scale = 45;
  const cx = 250;
  const cy = 350;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={30} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">勾股定理</text>
      <text x={svgWidth / 2} y={58} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">a² + b² = c²</text>
      {/* Triangle */}
      <polygon points={`${cx},${cy} ${cx + a * scale},${cy} ${cx},${cy - b * scale}`}
        fill="var(--blue)" opacity={0.15} stroke="var(--blue)" strokeWidth={2} />
      {/* Right angle mark */}
      <rect x={cx} y={cy - 15} width={15} height={15} fill="none" stroke="var(--blue)" strokeWidth={1.5} />
      {/* Labels */}
      <text x={cx + a * scale / 2} y={cy + 22} fontSize={14} textAnchor="middle" fontWeight={600} className="fill-current">a = {a.toFixed(1)}</text>
      <text x={cx - 18} y={cy - b * scale / 2} fontSize={14} textAnchor="middle" fontWeight={600} className="fill-current" transform={`rotate(-90, ${cx - 18}, ${cy - b * scale / 2})`}>b = {b.toFixed(1)}</text>
      <text x={cx + a * scale / 2 + 12} y={cy - b * scale / 2 - 8} fontSize={14} textAnchor="middle" fontWeight={600} style={{ fill: "var(--pink)" }}>c = {c.toFixed(2)}</text>
      {/* Squares on sides */}
      <rect x={cx} y={cy + 10} width={a * scale} height={a * scale} fill="var(--blue)" opacity={0.1} stroke="var(--blue)" strokeWidth={1} strokeDasharray="4 2" />
      <text x={cx + a * scale / 2} y={cy + 10 + a * scale / 2 + 6} fontSize={12} textAnchor="middle" className="fill-current">a² = {(a * a).toFixed(1)}</text>
      <rect x={cx - b * scale - 10} y={cy - b * scale} width={b * scale} height={b * scale} fill="var(--emerald)" opacity={0.1} stroke="var(--emerald)" strokeWidth={1} strokeDasharray="4 2" />
      <text x={cx - b * scale / 2 - 10} y={cy - b * scale / 2 + 6} fontSize={12} textAnchor="middle" className="fill-current">b² = {(b * b).toFixed(1)}</text>
      {/* Result */}
      <text x={svgWidth / 2} y={420} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">
        {a.toFixed(1)}² + {b.toFixed(1)}² = {(a * a).toFixed(1)} + {(b * b).toFixed(1)} = {(c * c).toFixed(1)} = {c.toFixed(2)}²
      </text>
    </svg>
  );
}

// ── 相似与位似 ──
export function SimilarViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const k = Math.max(0.2, Math.min(3, params.k ?? 2));

  const tri1 = [
    { x: 100, y: 350 },
    { x: 300, y: 350 },
    { x: 200, y: 150 },
  ];
  const center = { x: 500, y: 300 };
  const tri2 = tri1.map(p => ({
    x: center.x + (p.x - center.x) * k,
    y: center.y + (p.y - center.y) * k,
  }));

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={30} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">相似与位似</text>
      <text x={svgWidth / 2} y={58} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">相似比 k = {k.toFixed(2)}</text>
      {/* Original triangle */}
      <polygon points={tri1.map(p => `${p.x},${p.y}`).join(" ")} fill="var(--blue)" opacity={0.2} stroke="var(--blue)" strokeWidth={2} />
      <text x={200} y={380} fontSize={13} textAnchor="middle" className="fill-current text-muted-foreground">原图形</text>
      {/* Scaled triangle */}
      <polygon points={tri2.map(p => `${p.x},${p.y}`).join(" ")} fill="var(--pink)" opacity={0.2} stroke="var(--pink)" strokeWidth={2} />
      {/* Center point */}
      <circle cx={center.x} cy={center.y} r={4} fill="var(--emerald)" />
      <text x={center.x + 10} y={center.y - 8} fontSize={12} style={{ fill: "var(--emerald)" }}>位似中心</text>
      {/* Scaling lines */}
      {tri1.map((_p, i) => (
        <line key={i} x1={center.x} y1={center.y} x2={tri2[i].x} y2={tri2[i].y} stroke="var(--emerald)" strokeWidth={0.8} strokeDasharray="3 2" opacity={0.5} />
      ))}
      <text x={svgWidth / 2} y={440} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">
        对应边之比 = {k.toFixed(2)}，面积之比 = {(k * k).toFixed(2)}
      </text>
    </svg>
  );
}

// ── 圆的性质 ──
export function CircleViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const r = Math.max(3, Math.min(10, params.r ?? 6));
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;
  const scale = 30;

  // Points on circle
  const angleA = -0.8;
  const angleB = 0.3;
  const angleC = 1.8;

  const A = { x: cx + r * scale * Math.cos(angleA), y: cy - r * scale * Math.sin(angleA) };
  const B = { x: cx + r * scale * Math.cos(angleB), y: cy - r * scale * Math.sin(angleB) };
  const C = { x: cx + r * scale * Math.cos(angleC), y: cy - r * scale * Math.sin(angleC) };

  const centralAngle = Math.abs(angleA - angleB) * 180 / Math.PI;
  const inscribedAngle = centralAngle / 2;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={25} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">圆的性质</text>
      <text x={svgWidth / 2} y={50} fontSize={14} textAnchor="middle" className="fill-current text-muted-foreground">圆心角 = 2 × 圆周角</text>
      {/* Circle */}
      <circle cx={cx} cy={cy} r={r * scale} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-foreground" />
      {/* Center */}
      <circle cx={cx} cy={cy} r={3} fill="var(--emerald)" />
      <text x={cx + 8} y={cy - 8} fontSize={12} className="fill-current">O</text>
      {/* Points */}
      <circle cx={A.x} cy={A.y} r={4} fill="var(--blue)" />
      <circle cx={B.x} cy={B.y} r={4} fill="var(--blue)" />
      <circle cx={C.x} cy={C.y} r={4} fill="var(--pink)" />
      <text x={A.x - 15} y={A.y + 5} fontSize={13} fontWeight={600} style={{ fill: "var(--blue)" }}>A</text>
      <text x={B.x + 8} y={B.y + 5} fontSize={13} fontWeight={600} style={{ fill: "var(--blue)" }}>B</text>
      <text x={C.x + 8} y={C.y + 5} fontSize={13} fontWeight={600} style={{ fill: "var(--pink)" }}>C</text>
      {/* Radii */}
      <line x1={cx} y1={cy} x2={A.x} y2={A.y} stroke="var(--blue)" strokeWidth={1} opacity={0.5} />
      <line x1={cx} y1={cy} x2={B.x} y2={B.y} stroke="var(--blue)" strokeWidth={1} opacity={0.5} />
      {/* Chord */}
      <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="var(--blue)" strokeWidth={1.5} />
      {/* Inscribed angle lines */}
      <line x1={C.x} y1={C.y} x2={A.x} y2={A.y} stroke="var(--pink)" strokeWidth={1.5} />
      <line x1={C.x} y1={C.y} x2={B.x} y2={B.y} stroke="var(--pink)" strokeWidth={1.5} />
      {/* Info */}
      <text x={12} y={svgHeight - 60} fontSize={13} className="fill-current">半径 r = {r.toFixed(1)}</text>
      <text x={12} y={svgHeight - 38} fontSize={13} className="fill-current">圆心角 ∠AOB ≈ {centralAngle.toFixed(1)}°</text>
      <text x={12} y={svgHeight - 16} fontSize={13} className="fill-current">圆周角 ∠ACB ≈ {inscribedAngle.toFixed(1)}°</text>
    </svg>
  );
}

// ── 概率与频率 ──
export function ProbabilityViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const sides = Math.max(2, Math.round(params.sides ?? 6));
  const target = Math.max(1, Math.min(sides, Math.round(params.target ?? 1)));
  const trials = Math.min(1000, Math.max(10, Math.round(params.trials ?? 100)));

  const p = 1 / sides;
  const frequencies: number[] = [];
  let count = 0;
  for (let i = 0; i < trials; i++) {
    if (Math.floor(Math.random() * sides) + 1 === target) count++;
    frequencies.push(count / (i + 1));
  }

  const xMax = trials;
  const yMax = Math.max(0.5, p * 2);

  const pathPoints = frequencies.map((f, i) => {
    const px = ((i + 1) / xMax) * (svgWidth - 120) + 60;
    const py = svgHeight - 60 - (f / yMax) * (svgHeight - 140);
    return `${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`;
  });

  const theoryY = svgHeight - 60 - (p / yMax) * (svgHeight - 140);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={30} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">概率与频率</text>
      <text x={svgWidth / 2} y={55} fontSize={14} textAnchor="middle" className="fill-current text-muted-foreground">
        掷 {sides} 面骰，目标: {target}，理论概率 = 1/{sides} = {p.toFixed(4)}
      </text>
      <path d={pathPoints.join(" ")} fill="none" stroke="var(--blue)" strokeWidth={1.5} />
      <line x1={60} y1={theoryY} x2={svgWidth - 60} y2={theoryY} stroke="var(--pink)" strokeWidth={1.5} strokeDasharray="6 4" />
      <text x={svgWidth - 60} y={theoryY - 8} fontSize={12} textAnchor="end" style={{ fill: "var(--pink)" }}>理论值 {p.toFixed(4)}</text>
      <text x={svgWidth / 2} y={svgHeight - 15} fontSize={12} textAnchor="middle" className="fill-current text-muted-foreground">试验次数 (共 {trials} 次)</text>
      <text x={12} y={svgHeight - 60} fontSize={12} className="fill-current text-muted-foreground">频率</text>
    </svg>
  );
}

export const absoluteValueSpec: VisSpec = { component: AbsoluteValueViz, supportsAnimation: false };
export const linearSystemSpec: VisSpec = { component: LinearSystemViz, supportsAnimation: false };
export const inequalitySpec: VisSpec = { component: InequalityViz, supportsAnimation: false };
export const pythagoreanSpec: VisSpec = { component: PythagoreanViz, supportsAnimation: false };
export const similarSpec: VisSpec = { component: SimilarViz, supportsAnimation: false };
export const circleSpec: VisSpec = { component: CircleViz, supportsAnimation: false };
export const probabilitySpec: VisSpec = { component: ProbabilityViz, supportsAnimation: false };
