import type { VizProps, VisSpec } from "./helpers";

// ── 二项式定理 ──
export function BinomialViz({ params }: VizProps) {
  const n = Math.round(params.n ?? 4);
  const a = params.a ?? 1;
  const b = params.b ?? 1;

  const comb = (n: number, k: number) => {
    let r = 1;
    for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1);
    return Math.round(r);
  };

  const terms: string[] = [];
  for (let r = 0; r <= n; r++) {
    const coeff = comb(n, r);
    const ap = n - r;
    const bp = r;
    let term = coeff === 1 && (ap > 0 || bp > 0) ? "" : `${coeff}`;
    if (ap > 0) term += ap === 1 ? "a" : `a${ap > 1 ? `^${ap}` : ""}`;
    if (bp > 0) term += bp === 1 ? "b" : `b${bp > 1 ? `^${bp}` : ""}`;
    terms.push(term || "1");
  }

  const result = Math.pow(a + b, n);

  return (
    <svg viewBox="0 0 720 480" className="w-full h-full">
      <text x={360} y={40} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">二项式定理</text>
      <text x={360} y={68} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">(a+b)ⁿ = Σ C(n,r)·a^(n-r)·b^r</text>
      <rect x={80} y={100} width={560} height={350} rx={16} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={135} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">展开式 (n={n})</text>
      <text x={360} y={170} fontSize={14} textAnchor="middle" className="fill-current">(a+b)^{n} = {terms.join(" + ")}</text>
      <line x1={120} y1={185} x2={600} y2={185} stroke="var(--border)" strokeWidth={1} />
      <text x={120} y={220} fontSize={14} className="fill-current">代入 a={a.toFixed(1)}, b={b.toFixed(1)}:</text>
      <text x={120} y={250} fontSize={14} className="fill-current">({a.toFixed(1)} + {b.toFixed(1)})^{n} = ({(a + b).toFixed(1)})^{n} = <tspan fontWeight={600}>{result.toFixed(2)}</tspan></text>
      <line x1={120} y1={270} x2={600} y2={270} stroke="var(--border)" strokeWidth={1} />
      <text x={120} y={300} fontSize={14} className="fill-current text-muted-foreground">各项系数 C({n},r):</text>
      {Array.from({ length: n + 1 }, (_, r) => (
        <text key={r} x={120 + (r % 4) * 130} y={330 + Math.floor(r / 4) * 25} fontSize={13} className="fill-current">
          C({n},{r}) = {comb(n, r)}
        </text>
      ))}
    </svg>
  );
}

// ── 复数 ──
export function ComplexNumberViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const a = params.a ?? 3;
  const b = params.b ?? 4;
  const mod = Math.sqrt(a * a + b * b);
  const arg = Math.atan2(b, a) * 180 / Math.PI;

  const origin = { x: svgWidth / 2, y: svgHeight / 2 };
  const scale = 50;
  const px = origin.x + a * scale;
  const py = origin.y - b * scale;
  const conjY = origin.y + b * scale;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      {/* Axes */}
      <line x1={40} y1={origin.y} x2={svgWidth - 40} y2={origin.y} stroke="currentColor" strokeWidth={1.2} className="text-foreground" />
      <line x1={origin.x} y1={40} x2={origin.x} y2={svgHeight - 40} stroke="currentColor" strokeWidth={1.2} className="text-foreground" />
      <text x={svgWidth - 20} y={origin.y - 8} fontSize={12} className="fill-current text-muted-foreground">Re</text>
      <text x={origin.x + 8} y={50} fontSize={12} className="fill-current text-muted-foreground">Im</text>
      {/* Grid */}
      {[-4, -2, 2, 4].map(v => (
        <g key={v}>
          <text x={origin.x + v * scale} y={origin.y + 18} fontSize={10} textAnchor="middle" className="fill-current text-muted-foreground">{v}</text>
          <text x={origin.x + 12} y={origin.y - v * scale + 4} fontSize={10} className="fill-current text-muted-foreground">{v}i</text>
        </g>
      ))}
      {/* Vector z */}
      <line x1={origin.x} y1={origin.y} x2={px} y2={py} stroke="var(--blue)" strokeWidth={2.5} markerEnd="url(#cz-arrow)" />
      <circle cx={px} cy={py} r={5} fill="var(--blue)" />
      {/* Conjugate */}
      <line x1={origin.x} y1={origin.y} x2={px} y2={conjY} stroke="var(--pink)" strokeWidth={1.5} strokeDasharray="5 3" />
      <circle cx={px} cy={conjY} r={4} fill="var(--pink)" opacity={0.6} />
      {/* Modulus circle */}
      <circle cx={origin.x} cy={origin.y} r={mod * scale} fill="none" stroke="var(--emerald)" strokeWidth={0.8} strokeDasharray="4 3" opacity={0.5} />
      <defs>
        <marker id="cz-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--blue)" />
        </marker>
      </defs>
      {/* Labels */}
      <text x={px + 10} y={py - 8} fontSize={13} fontWeight={600} style={{ fill: "var(--blue)" }}>z = {a}+{b}i</text>
      <text x={px + 10} y={conjY + 16} fontSize={12} style={{ fill: "var(--pink)" }}>z̄ = {a}-{b}i</text>
      <text x={12} y={20} fontSize={13} className="fill-current text-muted-foreground">
        |z| = √({a}²+{b}²) = {mod.toFixed(2)}，arg = {arg.toFixed(1)}°
      </text>
    </svg>
  );
}

// ── 交流电有效值 ──
export function ACEffectiveViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const Im = params.Im ?? 10;
  const xMin = 0;
  const xMax = 4 * Math.PI;
  const yMax = 15;
  const Ieff = Im / Math.sqrt(2);

  const wavePath: string[] = [];
  for (let x = xMin; x <= xMax; x += 0.05) {
    const y = Im * Math.sin(x);
    const px = ((x - xMin) / (xMax - xMin)) * svgWidth;
    const py = svgHeight / 2 - (y / yMax) * (svgHeight / 2 - 20);
    wavePath.push(wavePath.length === 0 ? `M ${px.toFixed(1)} ${py.toFixed(1)}` : `L ${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  const effY = svgHeight / 2 - (Ieff / yMax) * (svgHeight / 2 - 20);
  const negEffY = svgHeight / 2 + (Ieff / yMax) * (svgHeight / 2 - 20);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <line x1={0} y1={svgHeight / 2} x2={svgWidth} y2={svgHeight / 2} stroke="currentColor" strokeWidth={0.8} className="text-muted-foreground" />
      {wavePath.length > 0 && <path d={wavePath.join(" ")} fill="none" stroke="var(--blue)" strokeWidth={2.5} />}
      <line x1={0} y1={effY} x2={svgWidth} y2={effY} stroke="var(--pink)" strokeWidth={1.5} strokeDasharray="6 4" />
      <line x1={0} y1={negEffY} x2={svgWidth} y2={negEffY} stroke="var(--pink)" strokeWidth={1.5} strokeDasharray="6 4" />
      <text x={svgWidth - 10} y={effY - 8} fontSize={12} textAnchor="end" style={{ fill: "var(--pink)" }}>I_eff = {Ieff.toFixed(2)} A</text>
      <text x={12} y={20} fontSize={13} className="fill-current text-muted-foreground">I = I_m·sin(ωt)，I_m = {Im.toFixed(1)} A</text>
      <text x={12} y={40} fontSize={12} className="fill-current text-muted-foreground">I_eff = I_m/√2 = {Im.toFixed(1)}/1.414 = {Ieff.toFixed(2)} A</text>
    </svg>
  );
}

// ── 法拉第电磁感应定律 ──
export function FaradayViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const n = params.n ?? 100;
  const dPhi = params.dPhi ?? 0.02;
  const dt = params.dt ?? 0.1;
  const E = n * dPhi / dt;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={360} y={40} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">法拉第电磁感应定律</text>
      <text x={360} y={68} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">E = n·ΔΦ/Δt</text>
      <rect x={100} y={110} width={520} height={300} rx={16} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={150} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">计算</text>
      <text x={160} y={190} fontSize={14} className="fill-current">线圈匝数 n = <tspan fontWeight={600}>{n}</tspan></text>
      <text x={160} y={220} fontSize={14} className="fill-current">磁通量变化 ΔΦ = <tspan fontWeight={600}>{dPhi.toFixed(4)} Wb</tspan></text>
      <text x={160} y={250} fontSize={14} className="fill-current">时间变化 Δt = <tspan fontWeight={600}>{dt.toFixed(3)} s</tspan></text>
      <line x1={160} y1={270} x2={560} y2={270} stroke="var(--border)" strokeWidth={1} />
      <text x={160} y={305} fontSize={15} className="fill-current">E = n × ΔΦ / Δt</text>
      <text x={160} y={335} fontSize={15} className="fill-current">= {n} × {dPhi.toFixed(4)} / {dt.toFixed(3)}</text>
      <text x={160} y={370} fontSize={18} fontWeight={600} style={{ fill: "var(--blue)" }}>= {E.toFixed(2)} V</text>
    </svg>
  );
}

// ── 机械能守恒 ──
export function MechanicalEnergyViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const m = params.m ?? 2;
  const h = params.h ?? 10;
  const v = params.v ?? 0;
  const g = 9.8;

  const Ep = m * g * h;
  const Ek = 0.5 * m * v * v;
  const E = Ep + Ek;
  const hMax = E / (m * g);
  const vMax = Math.sqrt(2 * E / m);

  const barW = 80;
  const scale = 300 / Math.max(E, 1);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={360} y={40} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">机械能守恒定律</text>
      <text x={360} y={68} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">E_k + E_p = 常量</text>
      {/* Current state */}
      <text x={180} y={140} fontSize={14} textAnchor="middle" fontWeight={600} className="fill-current">当前状态</text>
      <rect x={180 - barW / 2} y={155} width={barW} height={Math.max(5, Ep * scale)} fill="var(--blue)" opacity={0.6} rx={4} />
      <text x={180} y={155 + Math.max(5, Ep * scale) + 20} fontSize={12} textAnchor="middle" className="fill-current">E_p = {Ep.toFixed(1)} J</text>
      <rect x={180 - barW / 2} y={155 + Math.max(5, Ep * scale) + 5} width={barW} height={Math.max(5, Ek * scale)} fill="var(--pink)" opacity={0.6} rx={4} />
      <text x={180} y={155 + Math.max(5, Ep * scale) + Math.max(5, Ek * scale) + 30} fontSize={12} textAnchor="middle" className="fill-current">E_k = {Ek.toFixed(1)} J</text>
      <text x={180} y={420} fontSize={14} textAnchor="middle" fontWeight={600} style={{ fill: "var(--emerald)" }}>E = {E.toFixed(1)} J</text>
      {/* Max height state */}
      <text x={540} y={140} fontSize={14} textAnchor="middle" fontWeight={600} className="fill-current">最高点</text>
      <rect x={540 - barW / 2} y={155} width={barW} height={Math.max(5, E * scale)} fill="var(--blue)" opacity={0.6} rx={4} />
      <text x={540} y={155 + Math.max(5, E * scale) + 20} fontSize={12} textAnchor="middle" className="fill-current">E_p = {E.toFixed(1)} J</text>
      <text x={540} y={420} fontSize={14} textAnchor="middle" fontWeight={600} className="fill-current">h_max = {hMax.toFixed(2)} m</text>
      {/* Summary */}
      <rect x={60} y={440} width={600} height={30} rx={8} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={460} fontSize={13} textAnchor="middle" className="fill-current">
        m={m.toFixed(1)}kg, h={h.toFixed(1)}m, v={v.toFixed(1)}m/s, g=9.8m/s² → v_max={vMax.toFixed(2)}m/s
      </text>
    </svg>
  );
}

// ── 溶度积常数 ──
export function KspViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const Ksp = params.Ksp ?? 1.8e-10;
  const s = Math.pow(Ksp / 4, 1 / 3);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={360} y={40} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">溶度积常数</text>
      <text x={360} y={68} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">Ksp = [Aᵐ⁺]ⁿ[Bⁿ⁻]ᵐ</text>
      <rect x={100} y={110} width={520} height={320} rx={16} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={150} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">难溶电解质溶解平衡</text>
      <text x={160} y={190} fontSize={14} className="fill-current">以 AB₂ 型为例: AB₂(s) ⇌ A²⁺(aq) + 2B⁻(aq)</text>
      <text x={160} y={220} fontSize={14} className="fill-current">Ksp = [A²⁺][B⁻]² = s × (2s)² = 4s³</text>
      <line x1={160} y1={240} x2={560} y2={240} stroke="var(--border)" strokeWidth={1} />
      <text x={160} y={275} fontSize={14} className="fill-current">给定 Ksp = {Ksp.toExponential(2)}</text>
      <text x={160} y={305} fontSize={14} className="fill-current">s = (Ksp/4)^(1/3) = ({Ksp.toExponential(2)}/4)^(1/3)</text>
      <text x={160} y={340} fontSize={18} fontWeight={600} style={{ fill: "var(--blue)" }}>= {s.toExponential(3)} mol/L</text>
      <text x={160} y={380} fontSize={13} className="fill-current text-muted-foreground">Ksp 越小，溶解度越低，沉淀越难溶</text>
    </svg>
  );
}

// ── 水的离子积 ──
export function KwViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const H = params.H ?? 1e-7;
  const Kw = 1e-14;
  const OH = Kw / H;
  const pH = -Math.log10(H);
  const pOH = -Math.log10(OH);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={360} y={40} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">水的离子积常数</text>
      <text x={360} y={68} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">Kw = [H⁺][OH⁻] = 10⁻¹⁴ (25°C)</text>
      <rect x={100} y={110} width={520} height={320} rx={16} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={150} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">计算</text>
      <text x={160} y={190} fontSize={14} className="fill-current">[H⁺] = {H.toExponential(2)} mol/L</text>
      <text x={160} y={220} fontSize={14} className="fill-current">[OH⁻] = Kw/[H⁺] = {OH.toExponential(2)} mol/L</text>
      <line x1={160} y1={240} x2={560} y2={240} stroke="var(--border)" strokeWidth={1} />
      <text x={160} y={275} fontSize={14} className="fill-current">pH = -lg[H⁺] = <tspan fontWeight={600}>{pH.toFixed(2)}</tspan></text>
      <text x={160} y={305} fontSize={14} className="fill-current">pOH = -lg[OH⁻] = <tspan fontWeight={600}>{pOH.toFixed(2)}</tspan></text>
      <text x={160} y={335} fontSize={14} className="fill-current">pH + pOH = {(pH + pOH).toFixed(2)}</text>
      <text x={160} y={370} fontSize={14} style={{ fill: pH < 7 ? "var(--pink)" : pH > 7 ? "var(--blue)" : "var(--emerald)" }}>
        {pH < 7 ? "酸性" : pH > 7 ? "碱性" : "中性"}溶液
      </text>
    </svg>
  );
}

// ── 电离平衡常数 ──
export function KaViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const Ka = params.Ka ?? 1.8e-5;
  const C0 = params.C0 ?? 0.1;
  const H = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * C0)) / 2;
  const pH = -Math.log10(H);
  const degree = H / C0 * 100;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={360} y={40} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">电离平衡常数</text>
      <text x={360} y={68} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">Ka = [H⁺][A⁻]/[HA]</text>
      <rect x={100} y={110} width={520} height={320} rx={16} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={150} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">弱酸电离</text>
      <text x={160} y={190} fontSize={14} className="fill-current">HA ⇌ H⁺ + A⁻</text>
      <text x={160} y={220} fontSize={14} className="fill-current">初始浓度 C₀ = {C0.toFixed(3)} mol/L</text>
      <text x={160} y={250} fontSize={14} className="fill-current">Ka = {Ka.toExponential(2)}</text>
      <line x1={160} y1={270} x2={560} y2={270} stroke="var(--border)" strokeWidth={1} />
      <text x={160} y={305} fontSize={14} className="fill-current">[H⁺] = {H.toExponential(3)} mol/L</text>
      <text x={160} y={335} fontSize={14} className="fill-current">pH = {pH.toFixed(2)}</text>
      <text x={160} y={365} fontSize={14} className="fill-current">电离度 α = {degree.toFixed(2)}%</text>
      <text x={160} y={395} fontSize={13} className="fill-current text-muted-foreground">Ka 越大，弱酸电离程度越高</text>
    </svg>
  );
}

export const binomialSpec: VisSpec = { component: BinomialViz, supportsAnimation: false };
export const complexNumberSpec: VisSpec = { component: ComplexNumberViz, supportsAnimation: false };
export const acEffectiveSpec: VisSpec = { component: ACEffectiveViz, supportsAnimation: false };
export const faradaySpec: VisSpec = { component: FaradayViz, supportsAnimation: false };
export const mechanicalEnergySpec: VisSpec = { component: MechanicalEnergyViz, supportsAnimation: false };
export const kspSpec: VisSpec = { component: KspViz, supportsAnimation: false };
export const kwSpec: VisSpec = { component: KwViz, supportsAnimation: false };
export const kaSpec: VisSpec = { component: KaViz, supportsAnimation: false };
