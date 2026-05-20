import { toSvgPixel, Axes, type VizProps, type VisSpec } from "./helpers";

// ── 冲量与动量定理 ──
export function MomentumViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const F = params.F ?? 10;
  const dt = params.dt ?? 2;
  const m = params.m ?? 5;
  const v0 = params.v0 ?? 0;

  const impulse = F * dt;
  const dv = impulse / m;
  const v1 = v0 + dv;

  const barW = 80;
  const barMax = 300;
  const scale = barMax / Math.max(Math.abs(v0), Math.abs(v1), 10);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={40} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">冲量与动量定理</text>
      <text x={svgWidth / 2} y={70} fontSize={16} textAnchor="middle" className="fill-current text-muted-foreground">Δp = F·Δt = m·Δv</text>
      {/* Before */}
      <text x={200} y={140} fontSize={14} textAnchor="middle" className="fill-current">初状态</text>
      <rect x={200 - barW / 2} y={160} width={barW} height={Math.abs(v0) * scale} fill="var(--blue)" opacity={0.7} rx={4} />
      <text x={200} y={155 + Math.abs(v0) * scale + 20} fontSize={12} textAnchor="middle" className="fill-current text-muted-foreground">v₀ = {v0.toFixed(1)} m/s</text>
      <text x={200} y={155 + Math.abs(v0) * scale + 38} fontSize={12} textAnchor="middle" className="fill-current text-muted-foreground">p₀ = {(m * v0).toFixed(1)} kg·m/s</text>
      {/* After */}
      <text x={520} y={140} fontSize={14} textAnchor="middle" className="fill-current">末状态</text>
      <rect x={520 - barW / 2} y={160} width={barW} height={Math.abs(v1) * scale} fill="var(--pink)" opacity={0.7} rx={4} />
      <text x={520} y={155 + Math.abs(v1) * scale + 20} fontSize={12} textAnchor="middle" className="fill-current text-muted-foreground">v = {v1.toFixed(1)} m/s</text>
      <text x={520} y={155 + Math.abs(v1) * scale + 38} fontSize={12} textAnchor="middle" className="fill-current text-muted-foreground">p = {(m * v1).toFixed(1)} kg·m/s</text>
      {/* Arrow */}
      <defs>
        <marker id="mom-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--emerald)" />
        </marker>
      </defs>
      <line x1={280} y1={200} x2={440} y2={200} stroke="var(--emerald)" strokeWidth={2} markerEnd="url(#mom-arrow)" />
      <text x={360} y={190} fontSize={12} textAnchor="middle" style={{ fill: "var(--emerald)" }}>F={F.toFixed(0)}N · Δt={dt.toFixed(1)}s</text>
      {/* Summary */}
      <rect x={60} y={340} width={600} height={120} rx={12} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={375} fontSize={15} textAnchor="middle" fontWeight={600} className="fill-current">计算结果</text>
      <text x={120} y={405} fontSize={14} className="fill-current">冲量 I = F·Δt = {F.toFixed(0)} × {dt.toFixed(1)} = <tspan fontWeight={600}>{impulse.toFixed(1)} N·s</tspan></text>
      <text x={120} y={430} fontSize={14} className="fill-current">动量变化 Δp = m·Δv = {m.toFixed(0)} × {dv.toFixed(2)} = <tspan fontWeight={600}>{impulse.toFixed(1)} kg·m/s</tspan></text>
    </svg>
  );
}

// ── 动能定理 ──
export function KineticEnergyViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const F = params.F ?? 20;
  const s = params.s ?? 5;
  const m = params.m ?? 2;
  const v0 = params.v0 ?? 3;

  const W = F * s;
  const Ek0 = 0.5 * m * v0 * v0;
  const Ek1 = Ek0 + W;
  const v1 = Math.sqrt(2 * Ek1 / m);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={40} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">动能定理</text>
      <text x={svgWidth / 2} y={70} fontSize={16} textAnchor="middle" className="fill-current text-muted-foreground">W合 = ½mv² - ½mv₀²</text>
      {/* Energy bars */}
      <text x={120} y={140} fontSize={13} textAnchor="middle" className="fill-current text-muted-foreground">初动能</text>
      <rect x={60} y={155} width={120} height={Math.max(10, Ek0 * 3)} fill="var(--blue)" opacity={0.6} rx={4} />
      <text x={120} y={155 + Math.max(10, Ek0 * 3) + 20} fontSize={12} textAnchor="middle" className="fill-current">½mv₀² = {Ek0.toFixed(1)} J</text>

      <text x={360} y={140} fontSize={13} textAnchor="middle" className="fill-current text-muted-foreground">合外力做功</text>
      <rect x={300} y={155} width={120} height={Math.max(10, W * 3)} fill="var(--emerald)" opacity={0.6} rx={4} />
      <text x={360} y={155 + Math.max(10, W * 3) + 20} fontSize={12} textAnchor="middle" className="fill-current">W = F·s = {W.toFixed(1)} J</text>

      <text x={600} y={140} fontSize={13} textAnchor="middle" className="fill-current text-muted-foreground">末动能</text>
      <rect x={540} y={155} width={120} height={Math.max(10, Ek1 * 3)} fill="var(--pink)" opacity={0.6} rx={4} />
      <text x={600} y={155 + Math.max(10, Ek1 * 3) + 20} fontSize={12} textAnchor="middle" className="fill-current">½mv² = {Ek1.toFixed(1)} J</text>

      {/* Summary */}
      <rect x={60} y={340} width={600} height={120} rx={12} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={375} fontSize={15} textAnchor="middle" fontWeight={600} className="fill-current">计算结果</text>
      <text x={120} y={405} fontSize={14} className="fill-current">W合 = F×s = {F.toFixed(0)}×{s.toFixed(0)} = <tspan fontWeight={600}>{W.toFixed(1)} J</tspan></text>
      <text x={120} y={430} fontSize={14} className="fill-current">v = √(2×{Ek1.toFixed(1)}/{m.toFixed(0)}) = <tspan fontWeight={600}>{v1.toFixed(2)} m/s</tspan></text>
    </svg>
  );
}

// ── 万有引力定律 ──
export function GravitationViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const M = params.M ?? 5.97e24;
  const m = params.m ?? 7.35e22;
  const r = params.r ?? 3.84e8;
  const G = 6.674e-11;
  const F = G * M * m / (r * r);

  const m1Scale = Math.cbrt(M / 1e24) * 20;
  const m2Scale = Math.cbrt(m / 1e22) * 15;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={40} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">万有引力定律</text>
      <text x={svgWidth / 2} y={68} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">F = GMm/r²</text>
      {/* M */}
      <circle cx={200} cy={240} r={m1Scale} fill="var(--blue)" opacity={0.8} />
      <text x={200} y={245} fontSize={12} textAnchor="middle" fill="white" fontWeight={600}>M</text>
      {/* m */}
      <circle cx={520} cy={240} r={m2Scale} fill="var(--pink)" opacity={0.8} />
      <text x={520} y={245} fontSize={12} textAnchor="middle" fill="white" fontWeight={600}>m</text>
      {/* Distance line */}
      <line x1={200 + m1Scale + 10} y1={240} x2={520 - m2Scale - 10} y2={240} stroke="currentColor" strokeWidth={1} strokeDasharray="4 3" className="text-muted-foreground" />
      <text x={360} y={225} fontSize={12} textAnchor="middle" className="fill-current text-muted-foreground">r = {r.toExponential(2)} m</text>
      {/* Force arrows */}
      <defs>
        <marker id="grav-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--emerald)" />
        </marker>
      </defs>
      <line x1={200 + m1Scale + 15} y1={280} x2={350} y2={280} stroke="var(--emerald)" strokeWidth={2} markerEnd="url(#grav-arrow)" />
      <line x1={520 - m2Scale - 15} y1={280} x2={370} y2={280} stroke="var(--emerald)" strokeWidth={2} markerEnd="url(#grav-arrow)" />
      <text x={360} y={305} fontSize={12} textAnchor="middle" style={{ fill: "var(--emerald)" }}>F = {F.toExponential(2)} N</text>
      {/* Values */}
      <rect x={60} y={340} width={600} height={120} rx={12} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={375} fontSize={15} textAnchor="middle" fontWeight={600} className="fill-current">已知量</text>
      <text x={120} y={405} fontSize={13} className="fill-current">M = {M.toExponential(2)} kg</text>
      <text x={120} y={428} fontSize={13} className="fill-current">m = {m.toExponential(2)} kg</text>
      <text x={400} y={405} fontSize={13} className="fill-current">r = {r.toExponential(2)} m</text>
      <text x={400} y={428} fontSize={13} className="fill-current">G = 6.674×10⁻¹¹ N·m²/kg²</text>
    </svg>
  );
}

// ── 库仑定律 ──
export function CoulombViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const Q1 = params.Q1 ?? 1e-6;
  const Q2 = params.Q2 ?? -2e-6;
  const r = Math.max(0.01, params.r ?? 0.3);
  const k = 8.99e9;
  const F = k * Math.abs(Q1 * Q2) / (r * r);
  const attractive = Q1 * Q2 < 0;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={40} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">库仑定律</text>
      <text x={svgWidth / 2} y={68} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">F = kQ₁Q₂/r²</text>
      {/* Q1 */}
      <circle cx={220} cy={240} r={35} fill={Q1 > 0 ? "var(--blue)" : "var(--pink)"} opacity={0.8} />
      <text x={220} y={245} fontSize={16} textAnchor="middle" fill="white" fontWeight={600}>{Q1 > 0 ? "+" : "−"}Q₁</text>
      {/* Q2 */}
      <circle cx={500} cy={240} r={35} fill={Q2 > 0 ? "var(--blue)" : "var(--pink)"} opacity={0.8} />
      <text x={500} y={245} fontSize={16} textAnchor="middle" fill="white" fontWeight={600}>{Q2 > 0 ? "+" : "−"}Q₂</text>
      {/* Distance */}
      <line x1={255} y1={240} x2={465} y2={240} stroke="currentColor" strokeWidth={1} strokeDasharray="4 3" className="text-muted-foreground" />
      <text x={360} y={225} fontSize={12} textAnchor="middle" className="fill-current text-muted-foreground">r = {r.toFixed(2)} m</text>
      {/* Force arrows */}
      <defs>
        <marker id="coul-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--emerald)" />
        </marker>
      </defs>
      {attractive ? (
        <>
          <line x1={270} y1={290} x2={350} y2={290} stroke="var(--emerald)" strokeWidth={2} markerEnd="url(#coul-arrow)" />
          <line x1={450} y1={290} x2={370} y2={290} stroke="var(--emerald)" strokeWidth={2} markerEnd="url(#coul-arrow)" />
        </>
      ) : (
        <>
          <line x1={220} y1={290} x2={140} y2={290} stroke="var(--emerald)" strokeWidth={2} markerEnd="url(#coul-arrow)" />
          <line x1={500} y1={290} x2={580} y2={290} stroke="var(--emerald)" strokeWidth={2} markerEnd="url(#coul-arrow)" />
        </>
      )}
      <text x={360} y={320} fontSize={13} textAnchor="middle" style={{ fill: "var(--emerald)" }}>
        {attractive ? "引力" : "斥力"} F = {F.toExponential(2)} N
      </text>
      {/* Values */}
      <rect x={60} y={360} width={600} height={100} rx={12} fill="var(--surface)" stroke="var(--border)" />
      <text x={120} y={395} fontSize={13} className="fill-current">Q₁ = {Q1.toExponential(2)} C</text>
      <text x={120} y={418} fontSize={13} className="fill-current">Q₂ = {Q2.toExponential(2)} C</text>
      <text x={400} y={395} fontSize={13} className="fill-current">k = 8.99×10⁹ N·m²/C²</text>
      <text x={400} y={418} fontSize={13} className="fill-current">r = {r.toFixed(2)} m</text>
    </svg>
  );
}

// ── 欧姆定律 ──
export function OhmViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const xMin = 0;
  const xMax = 12;
  const yMin = 0;
  const yMax = 30;
  const R = Math.max(0.1, params.R ?? 5);
  const U = params.U ?? 12;
  const I = U / R;

  const curvePath: string[] = [];
  for (let x = 0; x <= xMax; x += 0.1) {
    const y = R * x;
    if (y > yMax) break;
    const px = toSvgPixel(x, y, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
    curvePath.push(curvePath.length === 0 ? `M ${px.x.toFixed(1)} ${px.y.toFixed(1)}` : `L ${px.x.toFixed(1)} ${px.y.toFixed(1)}`);
  }

  const op = toSvgPixel(I, U, xMin, xMax, yMin, yMax, svgWidth, svgHeight);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <Axes svgWidth={svgWidth} svgHeight={svgHeight} xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} />
      {curvePath.length > 0 && <path d={curvePath.join(" ")} fill="none" stroke="var(--blue)" strokeWidth={2.5} />}
      <circle cx={op.x} cy={op.y} r={6} fill="var(--pink)" />
      <text x={op.x + 12} y={op.y - 8} fontSize={13} fontWeight={600} style={{ fill: "var(--pink)" }}>
        ({I.toFixed(2)}A, {U.toFixed(1)}V)
      </text>
      <text x={12} y={20} fontSize={13} className="fill-current text-muted-foreground">
        U = IR，R = {R.toFixed(1)} Ω
      </text>
      <text x={12} y={40} fontSize={12} className="fill-current text-muted-foreground">
        I = U/R = {U.toFixed(1)}/{R.toFixed(1)} = {I.toFixed(2)} A
      </text>
      {/* Axis labels */}
      <text x={svgWidth / 2} y={svgHeight - 8} fontSize={12} textAnchor="middle" className="fill-current text-muted-foreground">I (A)</text>
      <text x={12} y={svgHeight / 2} fontSize={12} textAnchor="middle" className="fill-current text-muted-foreground" transform={`rotate(-90, 12, ${svgHeight / 2})`}>U (V)</text>
    </svg>
  );
}

// ── 波速公式 ──
export function WaveViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const lambda = params.lambda ?? 4;
  const f = params.f ?? 2;
  const v = lambda * f;
  const omega = 2 * Math.PI * f;
  const k = 2 * Math.PI / lambda;

  const xMin = 0;
  const xMax = 20;
  const yMin = -2;
  const yMax = 2;

  const wavePath: string[] = [];
  for (let x = xMin; x <= xMax; x += 0.05) {
    const y = Math.sin(k * x);
    const px = toSvgPixel(x, y, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
    wavePath.push(wavePath.length === 0 ? `M ${px.x.toFixed(1)} ${px.y.toFixed(1)}` : `L ${px.x.toFixed(1)} ${px.y.toFixed(1)}`);
  }

  const lamStart = toSvgPixel(0, -1.5, xMin, xMax, yMin, yMax, svgWidth, svgHeight);
  const lamEnd = toSvgPixel(lambda, -1.5, xMin, xMax, yMin, yMax, svgWidth, svgHeight);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <Axes svgWidth={svgWidth} svgHeight={svgHeight} xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} />
      {wavePath.length > 0 && <path d={wavePath.join(" ")} fill="none" stroke="var(--blue)" strokeWidth={2.5} />}
      {/* Lambda indicator */}
      <line x1={lamStart.x} y1={lamStart.y} x2={lamEnd.x} y2={lamEnd.y} stroke="var(--pink)" strokeWidth={1.5} />
      <line x1={lamStart.x} y1={lamStart.y - 5} x2={lamStart.x} y2={lamStart.y + 5} stroke="var(--pink)" strokeWidth={1.5} />
      <line x1={lamEnd.x} y1={lamEnd.y - 5} x2={lamEnd.x} y2={lamEnd.y + 5} stroke="var(--pink)" strokeWidth={1.5} />
      <text x={(lamStart.x + lamEnd.x) / 2} y={lamStart.y + 20} fontSize={13} textAnchor="middle" style={{ fill: "var(--pink)" }}>λ = {lambda.toFixed(1)} m</text>
      <text x={12} y={20} fontSize={13} className="fill-current text-muted-foreground">v = λf = {lambda.toFixed(1)} × {f.toFixed(1)} = {v.toFixed(1)} m/s</text>
      <text x={12} y={40} fontSize={12} className="fill-current text-muted-foreground">T = 1/f = {(1 / f).toFixed(2)} s，ω = {omega.toFixed(2)} rad/s</text>
    </svg>
  );
}

// ── 折射定律 ──
export function RefractionViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const n1 = params.n1 ?? 1;
  const n2 = params.n2 ?? 1.5;
  const theta1Deg = params.theta1 ?? 30;
  const theta1 = (theta1Deg * Math.PI) / 180;
  const sinTheta2 = (n1 / n2) * Math.sin(theta1);
  const totalReflect = Math.abs(sinTheta2) > 1;
  const theta2 = totalReflect ? Math.PI / 2 : Math.asin(sinTheta2);

  const cx = svgWidth / 2;
  const cy = svgHeight / 2;
  const len = 200;

  const incident = { x: cx - len * Math.sin(theta1), y: cy - len * Math.cos(theta1) };
  const refracted = totalReflect
    ? { x: cx + len * Math.sin(theta1), y: cy - len * Math.cos(theta1) }
    : { x: cx + len * Math.sin(theta2), y: cy + len * Math.cos(theta2) };

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      {/* Media */}
      <rect x={0} y={0} width={svgWidth} height={cy} fill="var(--blue)" opacity={0.05} />
      <rect x={0} y={cy} width={svgWidth} height={cy} fill="var(--pink)" opacity={0.05} />
      {/* Interface */}
      <line x1={0} y1={cy} x2={svgWidth} y2={cy} stroke="currentColor" strokeWidth={2} className="text-foreground" />
      {/* Normal */}
      <line x1={cx} y1={cy - len} x2={cx} y2={cy + len} stroke="currentColor" strokeWidth={0.8} strokeDasharray="4 3" className="text-muted-foreground" />
      {/* Incident ray */}
      <line x1={incident.x} y1={incident.y} x2={cx} y2={cy} stroke="var(--blue)" strokeWidth={2.5} />
      {/* Refracted/Reflected ray */}
      <line x1={cx} y1={cy} x2={refracted.x} y2={refracted.y} stroke="var(--pink)" strokeWidth={2.5} />
      {/* Labels */}
      <text x={20} y={30} fontSize={14} className="fill-current text-muted-foreground">介质 1: n₁ = {n1.toFixed(2)}</text>
      <text x={20} y={svgHeight - 20} fontSize={14} className="fill-current text-muted-foreground">介质 2: n₂ = {n2.toFixed(2)}</text>
      <text x={12} y={20} fontSize={13} className="fill-current text-muted-foreground">
        n₁sinθ₁ = {n1.toFixed(2)}×sin{theta1Deg.toFixed(0)}° = {(n1 * Math.sin(theta1)).toFixed(3)}
      </text>
      {totalReflect ? (
        <text x={svgWidth - 12} y={30} fontSize={14} textAnchor="end" fontWeight={600} style={{ fill: "var(--pink)" }}>全反射！</text>
      ) : (
        <text x={svgWidth - 12} y={30} fontSize={14} textAnchor="end" style={{ fill: "var(--pink)" }}>
          θ₂ = {(theta2 * 180 / Math.PI).toFixed(1)}°
        </text>
      )}
    </svg>
  );
}

export const momentumSpec: VisSpec = { component: MomentumViz, supportsAnimation: false };
export const kineticEnergySpec: VisSpec = { component: KineticEnergyViz, supportsAnimation: false };
export const gravitationSpec: VisSpec = { component: GravitationViz, supportsAnimation: false };
export const coulombSpec: VisSpec = { component: CoulombViz, supportsAnimation: false };
export const ohmSpec: VisSpec = { component: OhmViz, supportsAnimation: false };
export const waveSpec: VisSpec = { component: WaveViz, supportsAnimation: false };
export const refractionSpec: VisSpec = { component: RefractionViz, supportsAnimation: false };
