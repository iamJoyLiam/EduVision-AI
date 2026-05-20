import { type VizProps, type VisSpec } from "./helpers";

// ── 物质的量浓度 ──
export function ConcentrationViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const nB = params.nB ?? 0.5;
  const V = params.V ?? 0.25;
  const c = V > 0 ? nB / V : 0;

  const beakerH = 200;
  const beakerW = 160;
  const fillH = beakerH * Math.min(1, V / 1);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={40} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">物质的量浓度</text>
      <text x={svgWidth / 2} y={68} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">c = n / V</text>
      {/* Beaker */}
      <rect x={280} y={280 - beakerH} width={beakerW} height={beakerH} fill="none" stroke="currentColor" strokeWidth={2} rx={4} className="text-foreground" />
      {/* Solution */}
      <rect x={282} y={280 - fillH} width={beakerW - 4} height={fillH - 2} fill="var(--blue)" opacity={0.2} rx={2} />
      {/* Labels */}
      <text x={360} y={280 - beakerH - 15} fontSize={12} textAnchor="middle" className="fill-current text-muted-foreground">V = {V.toFixed(3)} L</text>
      <text x={360} y={300} fontSize={12} textAnchor="middle" className="fill-current text-muted-foreground">n = {nB.toFixed(3)} mol</text>
      {/* Result */}
      <rect x={480} y={120} width={200} height={120} rx={12} fill="var(--surface)" stroke="var(--border)" />
      <text x={580} y={155} fontSize={15} textAnchor="middle" fontWeight={600} className="fill-current">计算结果</text>
      <text x={580} y={185} fontSize={14} textAnchor="middle" className="fill-current">c = n/V</text>
      <text x={580} y={215} fontSize={14} textAnchor="middle" className="fill-current">= {nB.toFixed(3)}/{V.toFixed(3)}</text>
      <text x={580} y={240} fontSize={16} textAnchor="middle" fontWeight={600} style={{ fill: "var(--blue)" }}>= {c.toFixed(3)} mol/L</text>
    </svg>
  );
}

// ── 理想气体状态方程 ──
export function GasLawViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const P = params.P ?? 101325;
  const V = params.V ?? 0.0224;
  const n = params.n ?? 1;
  const T = params.T ?? 273.15;
  const R = 8.314;
  const PV = P * V;
  const nRT = n * R * T;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={40} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">理想气体状态方程</text>
      <text x={svgWidth / 2} y={68} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">PV = nRT</text>
      {/* Equation display */}
      <rect x={100} y={120} width={520} height={280} rx={16} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={160} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">各参量</text>
      <text x={160} y={200} fontSize={14} className="fill-current">压强 P = <tspan fontWeight={600}>{P.toExponential(2)} Pa</tspan></text>
      <text x={160} y={230} fontSize={14} className="fill-current">体积 V = <tspan fontWeight={600}>{V.toExponential(2)} m³</tspan></text>
      <text x={160} y={260} fontSize={14} className="fill-current">物质的量 n = <tspan fontWeight={600}>{n.toFixed(2)} mol</tspan></text>
      <text x={160} y={290} fontSize={14} className="fill-current">温度 T = <tspan fontWeight={600}>{T.toFixed(1)} K</tspan></text>
      <text x={160} y={320} fontSize={14} className="fill-current">气体常量 R = <tspan fontWeight={600}>8.314 J/(mol·K)</tspan></text>
      <text x={160} y={360} fontSize={14} className="fill-current">PV = {PV.toExponential(2)}，nRT = {nRT.toExponential(2)}</text>
      <text x={160} y={385} fontSize={14} className="fill-current">
        偏差: {Math.abs(PV - nRT) / nRT * 100 < 1 ? "✓ 符合理想气体" : "⚠ 偏差较大"}
      </text>
    </svg>
  );
}

// ── 化学平衡常数 ──
export function EquilibriumConstViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const A0 = params.A0 ?? 1;
  const B0 = params.B0 ?? 1;
  const K = params.K ?? 2;

  const solveEquilibrium = () => {
    let low = 0, high = Math.min(A0, B0);
    for (let i = 0; i < 100; i++) {
      const mid = (low + high) / 2;
      const Keq = mid / ((A0 - mid) * (B0 - mid));
      if (Keq < K) low = mid; else high = mid;
    }
    return (low + high) / 2;
  };

  const x = solveEquilibrium();
  const Aeq = A0 - x;
  const Beq = B0 - x;
  const Ceq = x;
  const Kcalc = Ceq / (Aeq * Beq);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={40} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">化学平衡常数</text>
      <text x={svgWidth / 2} y={68} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">A + B ⇌ C，K = [C]/([A][B])</text>
      <rect x={80} y={110} width={560} height={340} rx={16} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={145} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">平衡计算</text>
      <text x={120} y={185} fontSize={14} className="fill-current">初始浓度: [A]₀ = {A0.toFixed(2)} M, [B]₀ = {B0.toFixed(2)} M, [C]₀ = 0</text>
      <text x={120} y={215} fontSize={14} className="fill-current">设反应进度为 x: [A]={A0.toFixed(2)}-x, [B]={B0.toFixed(2)}-x, [C]=x</text>
      <text x={120} y={255} fontSize={14} className="fill-current">K = x / ({A0.toFixed(2)}-x)({B0.toFixed(2)}-x) = {K.toFixed(2)}</text>
      <line x1={120} y1={270} x2={600} y2={270} stroke="var(--border)" strokeWidth={1} />
      <text x={120} y={300} fontSize={15} fontWeight={600} className="fill-current">解得 x = {x.toFixed(4)}</text>
      <text x={120} y={330} fontSize={14} className="fill-current">[A] = {Aeq.toFixed(4)} M, [B] = {Beq.toFixed(4)} M, [C] = {Ceq.toFixed(4)} M</text>
      <text x={120} y={360} fontSize={14} className="fill-current">验证: K = {Ceq.toFixed(4)} / ({Aeq.toFixed(4)}×{Beq.toFixed(4)}) = {Kcalc.toFixed(2)}</text>
      <text x={120} y={395} fontSize={14} style={{ fill: "var(--emerald)" }}>
        {K > 1 ? "K > 1: 正反应占优势" : K < 1 ? "K < 1: 逆反应占优势" : "K = 1: 正逆反应相当"}
      </text>
    </svg>
  );
}

// ── 滴定反应计算 ──
export function TitrationViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const Ca = params.Ca ?? 0.1;
  const Va = params.Va ?? 25;
  const Cb = params.Cb ?? 0.1;
  const Vb = params.Vb ?? 25;
  const n_acid = params.n_acid ?? 1;
  const n_base = params.n_base ?? 1;

  const equivVb = (Ca * Va * n_base) / (Cb * n_acid);
  const isEquivalence = Math.abs(Vb - equivVb) < 0.5;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={40} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">滴定反应计算</text>
      <text x={svgWidth / 2} y={68} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">C₁V₁n₁ = C₂V₂n₂</text>
      <rect x={80} y={110} width={560} height={340} rx={16} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={145} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">酸碱滴定</text>
      <text x={120} y={180} fontSize={14} className="fill-current">酸: Cₐ = {Ca.toFixed(3)} M, Vₐ = {Va.toFixed(1)} mL, nₐ = {n_acid}</text>
      <text x={120} y={210} fontSize={14} className="fill-current">碱: Cᵦ = {Cb.toFixed(3)} M, Vᵦ = {Vb.toFixed(1)} mL, nᵦ = {n_base}</text>
      <line x1={120} y1={225} x2={600} y2={225} stroke="var(--border)" strokeWidth={1} />
      <text x={120} y={260} fontSize={14} className="fill-current">酸的物质的量: n(酸) = Cₐ×Vₐ = {Ca.toFixed(3)}×{(Va / 1000).toFixed(4)} = {(Ca * Va / 1000).toExponential(3)} mol</text>
      <text x={120} y={290} fontSize={14} className="fill-current">碱的物质的量: n(碱) = Cᵦ×Vᵦ = {Cb.toFixed(3)}×{(Vb / 1000).toFixed(4)} = {(Cb * Vb / 1000).toExponential(3)} mol</text>
      <text x={120} y={330} fontSize={15} fontWeight={600} className="fill-current">
        完全中和需要 Vᵦ = {equivVb.toFixed(2)} mL
      </text>
      <text x={120} y={365} fontSize={14} style={{ fill: isEquivalence ? "var(--emerald)" : "var(--pink)" }}>
        {isEquivalence ? "✓ 恰好完全中和" : Vb < equivVb ? "酸过量" : "碱过量"}
      </text>
    </svg>
  );
}

export const concentrationSpec: VisSpec = { component: ConcentrationViz, supportsAnimation: false };
export const gasLawSpec: VisSpec = { component: GasLawViz, supportsAnimation: false };
export const equilibriumConstSpec: VisSpec = { component: EquilibriumConstViz, supportsAnimation: false };
export const titrationSpec: VisSpec = { component: TitrationViz, supportsAnimation: false };
