import { type VizProps, type VisSpec } from "./helpers";

export function DensityViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const m = params.m ?? 270;
  const V = params.V ?? 100;
  const rho = V > 0 ? m / V : 0;

  const barMax = 300;
  const mScale = barMax / Math.max(m, 1);
  const vScale = barMax / Math.max(V, 1);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={30} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">密度</text>
      <text x={svgWidth / 2} y={58} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">ρ = m / V</text>
      {/* Bars */}
      <text x={160} y={120} fontSize={14} textAnchor="middle" fontWeight={600} className="fill-current">质量 m</text>
      <rect x={110} y={140} width={100} height={Math.max(10, m * mScale)} fill="var(--blue)" opacity={0.6} rx={4} />
      <text x={160} y={140 + Math.max(10, m * mScale) + 22} fontSize={13} textAnchor="middle" className="fill-current">{m.toFixed(1)} g</text>

      <text x={360} y={120} fontSize={14} textAnchor="middle" fontWeight={600} className="fill-current">体积 V</text>
      <rect x={310} y={140} width={100} height={Math.max(10, V * vScale)} fill="var(--emerald)" opacity={0.6} rx={4} />
      <text x={360} y={140 + Math.max(10, V * vScale) + 22} fontSize={13} textAnchor="middle" className="fill-current">{V.toFixed(1)} cm³</text>

      <text x={560} y={120} fontSize={14} textAnchor="middle" fontWeight={600} className="fill-current">密度 ρ</text>
      <rect x={510} y={140} width={100} height={Math.max(10, rho * 15)} fill="var(--pink)" opacity={0.6} rx={4} />
      <text x={560} y={140 + Math.max(10, rho * 15) + 22} fontSize={13} textAnchor="middle" className="fill-current">{rho.toFixed(2)} g/cm³</text>

      {/* Formula */}
      <rect x={80} y={350} width={560} height={100} rx={12} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={385} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">
        ρ = m / V = {m.toFixed(1)} / {V.toFixed(1)} = {rho.toFixed(2)} g/cm³
      </text>
      <text x={360} y={420} fontSize={13} textAnchor="middle" className="fill-current text-muted-foreground">
        密度 = 质量 ÷ 体积
      </text>
    </svg>
  );
}

export function PressureViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const F = params.F ?? 100;
  const S = params.S ?? 0.5;
  const rho = params.rho ?? 1000;
  const h = params.h ?? 5;
  const g = 9.8;

  const p = S > 0 ? F / S : 0;
  const pLiquid = rho * g * h;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={30} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">压强与液体压强</text>
      {/* Solid pressure */}
      <text x={200} y={75} fontSize={15} textAnchor="middle" fontWeight={600} className="fill-current">固体压强</text>
      <text x={200} y={100} fontSize={13} textAnchor="middle" className="fill-current text-muted-foreground">p = F / S</text>
      {/* Surface */}
      <rect x={120} y={240} width={160} height={12} rx={2} fill="var(--blue)" opacity={0.6} />
      {/* Force arrow */}
      <defs>
        <marker id="press-arrow" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="4" markerHeight="4" orient="auto">
          <path d="M0,0 L5,10 L10,0 z" fill="var(--pink)" />
        </marker>
      </defs>
      <line x1={200} y1={120} x2={200} y2={235} stroke="var(--pink)" strokeWidth={2.5} markerEnd="url(#press-arrow)" />
      <text x={215} y={180} fontSize={13} fontWeight={600} style={{ fill: "var(--pink)" }}>F = {F.toFixed(0)} N</text>
      <text x={200} y={270} fontSize={13} textAnchor="middle" className="fill-current">S = {S.toFixed(2)} m²</text>
      <text x={200} y={310} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">
        p = {F.toFixed(0)}/{S.toFixed(2)} = {p.toFixed(1)} Pa
      </text>

      {/* Liquid pressure */}
      <text x={540} y={75} fontSize={15} textAnchor="middle" fontWeight={600} className="fill-current">液体压强</text>
      <text x={540} y={100} fontSize={13} textAnchor="middle" className="fill-current text-muted-foreground">p = ρgh</text>
      {/* Container */}
      <path d="M 460 120 L 460 350 L 620 350 L 620 120" fill="none" stroke="currentColor" strokeWidth={2} className="text-foreground" />
      {/* Water */}
      <rect x={461} y={350 - h * 40} width={158} height={h * 40} fill="var(--blue)" opacity={0.2} />
      <text x={540} y={350 - h * 40 + 20} fontSize={12} textAnchor="middle" className="fill-current">水</text>
      {/* Height indicator */}
      <line x1={635} y1={350 - h * 40} x2={635} y2={350} stroke="var(--emerald)" strokeWidth={1.5} />
      <line x1={630} y1={350 - h * 40} x2={640} y2={350 - h * 40} stroke="var(--emerald)" strokeWidth={1.5} />
      <line x1={630} y1={350} x2={640} y2={350} stroke="var(--emerald)" strokeWidth={1.5} />
      <text x={650} y={350 - h * 20 + 5} fontSize={12} style={{ fill: "var(--emerald)" }}>h={h.toFixed(1)}m</text>
      <text x={540} y={390} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">
        p = {rho}×{g}×{h.toFixed(1)} = {pLiquid.toFixed(0)} Pa
      </text>
    </svg>
  );
}

export function BuoyancyViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const rhoLiquid = params.rhoLiquid ?? 1000;
  const V = params.V ?? 0.01;
  const m = params.m ?? 8;
  const g = 9.8;

  const Fb = rhoLiquid * V * g;
  const G = m * g;
  const net = Fb - G;
  const floats = net >= 0;

  const maxForce = Math.max(Fb, G, 1) * 1.2;
  const scale = 200 / maxForce;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={30} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">浮力</text>
      <text x={svgWidth / 2} y={58} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">F浮 = ρ液·g·V排</text>
      {/* Water surface */}
      <rect x={80} y={200} width={560} height={200} fill="var(--blue)" opacity={0.1} />
      <line x1={80} y1={200} x2={640} y2={200} stroke="var(--blue)" strokeWidth={2} />
      <text x={90} y={195} fontSize={12} className="fill-current text-muted-foreground">液面</text>
      {/* Object */}
      <rect x={300} y={200 - (floats ? 30 : -20)} width={80} height={60} rx={6}
        fill={floats ? "var(--emerald)" : "var(--pink)"} opacity={0.6} stroke={floats ? "var(--emerald)" : "var(--pink)"}
        strokeWidth={1.5} />
      <text x={340} y={200 - (floats ? 30 : -20) + 35} fontSize={13} textAnchor="middle" fill="white" fontWeight={600}>物体</text>
      {/* Force arrows */}
      <defs>
        <marker id="buoy-up" viewBox="0 0 10 10" refX="5" refY="0" markerWidth="4" markerHeight="4" orient="auto">
          <path d="M0,10 L5,0 L10,10 z" fill="var(--blue)" />
        </marker>
        <marker id="buoy-down" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="4" markerHeight="4" orient="auto">
          <path d="M0,0 L5,10 L10,0 z" fill="var(--pink)" />
        </marker>
      </defs>
      <line x1={340} y1={200 - (floats ? 30 : -20)} x2={340} y2={200 - (floats ? 30 : -20) - Math.max(20, Fb * scale)}
        stroke="var(--blue)" strokeWidth={3} markerEnd="url(#buoy-up)" />
      <text x={355} y={200 - (floats ? 30 : -20) - Fb * scale / 2} fontSize={12} fontWeight={600} style={{ fill: "var(--blue)" }}>
        F浮={Fb.toFixed(2)}N
      </text>
      <line x1={340} y1={200 - (floats ? 30 : -20) + 60} x2={340} y2={200 - (floats ? 30 : -20) + 60 + Math.max(20, G * scale)}
        stroke="var(--pink)" strokeWidth={3} markerEnd="url(#buoy-down)" />
      <text x={355} y={200 - (floats ? 30 : -20) + 60 + G * scale / 2} fontSize={12} fontWeight={600} style={{ fill: "var(--pink)" }}>
        G={G.toFixed(2)}N
      </text>
      {/* Result */}
      <rect x={80} y={430} width={560} height={40} rx={8} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={455} fontSize={15} textAnchor="middle" fontWeight={600} style={{ fill: floats ? "var(--emerald)" : "var(--pink)" }}>
        {floats ? "上浮" : "下沉"}: F浮={Fb.toFixed(2)}N {'>'} G={G.toFixed(2)}N
      </text>
    </svg>
  );
}

export function LeverViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const F1 = params.F1 ?? 20;
  const d1 = params.d1 ?? 2;
  const F2 = params.F2 ?? 10;
  const d2 = params.d2 ?? 4;

  const tau1 = F1 * d1;
  const tau2 = F2 * d2;
  const balanced = Math.abs(tau1 - tau2) < 0.5;

  const fulcrumX = 360;
  const fulcrumY = 280;
  const beamLen = 500;
  const angle = balanced ? 0 : Math.atan2(tau1 - tau2, 500) * 0.3;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={30} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">杠杆平衡</text>
      <text x={svgWidth / 2} y={58} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">F₁·d₁ = F₂·d₂</text>
      {/* Fulcrum */}
      <polygon points={`${fulcrumX - 20},${fulcrumY + 50} ${fulcrumX + 20},${fulcrumY + 50} ${fulcrumX},${fulcrumY}`}
        fill="var(--emerald)" opacity={0.6} />
      {/* Beam */}
      <line
        x1={fulcrumX - beamLen / 2 * Math.cos(angle)} y1={fulcrumY - beamLen / 2 * Math.sin(angle)}
        x2={fulcrumX + beamLen / 2 * Math.cos(angle)} y2={fulcrumY + beamLen / 2 * Math.sin(angle)}
        stroke="currentColor" strokeWidth={4} strokeLinecap="round" className="text-foreground" />
      {/* F1 side */}
      {(() => {
        const px = fulcrumX - d1 * 60;
        const py = fulcrumY - d1 * 60 * Math.tan(angle);
        return (
          <g>
            <line x1={px} y1={py} x2={px} y2={py + 50} stroke="var(--blue)" strokeWidth={3} markerEnd="url(#lever-down)" />
            <text x={px} y={py + 70} fontSize={13} textAnchor="middle" fontWeight={600} style={{ fill: "var(--blue)" }}>
              F₁={F1.toFixed(0)}N
            </text>
            <text x={px} y={py + 88} fontSize={12} textAnchor="middle" className="fill-current text-muted-foreground">
              d₁={d1.toFixed(1)}m
            </text>
          </g>
        );
      })()}
      {/* F2 side */}
      {(() => {
        const px = fulcrumX + d2 * 60;
        const py = fulcrumY + d2 * 60 * Math.tan(angle);
        return (
          <g>
            <line x1={px} y1={py} x2={px} y2={py + 50} stroke="var(--pink)" strokeWidth={3} markerEnd="url(#lever-down)" />
            <text x={px} y={py + 70} fontSize={13} textAnchor="middle" fontWeight={600} style={{ fill: "var(--pink)" }}>
              F₂={F2.toFixed(0)}N
            </text>
            <text x={px} y={py + 88} fontSize={12} textAnchor="middle" className="fill-current text-muted-foreground">
              d₂={d2.toFixed(1)}m
            </text>
          </g>
        );
      })()}
      <defs>
        <marker id="lever-down" viewBox="0 0 10 10" refX="5" refY="10" markerWidth="4" markerHeight="4" orient="auto">
          <path d="M0,0 L5,10 L10,0 z" fill="currentColor" />
        </marker>
      </defs>
      {/* Balance check */}
      <rect x={80} y={410} width={560} height={50} rx={10} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={440} fontSize={15} textAnchor="middle" fontWeight={600} style={{ fill: balanced ? "var(--emerald)" : "var(--pink)" }}>
        F₁×d₁ = {tau1.toFixed(1)} N·m，F₂×d₂ = {tau2.toFixed(1)} N·m {balanced ? "✓ 平衡" : "✗ 不平衡"}
      </text>
    </svg>
  );
}

export function ElectricPowerViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const U = params.U ?? 220;
  const I = params.I ?? 0.5;
  const t = params.t ?? 60;

  const P = U * I;
  const W = P * t;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={30} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">电功与电功率</text>
      <text x={svgWidth / 2} y={58} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">W = UIt, P = UI</text>
      {/* Circuit diagram */}
      <rect x={200} y={120} width={300} height={180} rx={12} fill="var(--surface)" stroke="var(--border)" />
      {/* Battery */}
      <line x1={240} y1={200} x2={240} y2={160} stroke="currentColor" strokeWidth={2} className="text-foreground" />
      <text x={240} y={145} fontSize={13} textAnchor="middle" fontWeight={600} className="fill-current">电源</text>
      <text x={240} y={230} fontSize={12} textAnchor="middle" className="fill-current text-muted-foreground">U = {U.toFixed(0)} V</text>
      {/* Resistor */}
      <rect x={330} y={170} width={80} height={40} rx={6} fill="var(--blue)" opacity={0.3} stroke="var(--blue)" strokeWidth={1.5} />
      <text x={370} y={195} fontSize={13} textAnchor="middle" fontWeight={600} className="fill-current">R</text>
      {/* Wires */}
      <line x1={240} y1={160} x2={240} y2={130} stroke="currentColor" strokeWidth={1.5} className="text-foreground" />
      <line x1={240} y1={130} x2={460} y2={130} stroke="currentColor" strokeWidth={1.5} className="text-foreground" />
      <line x1={460} y1={130} x2={460} y2={190} stroke="currentColor" strokeWidth={1.5} className="text-foreground" />
      <line x1={460} y1={190} x2={410} y2={190} stroke="currentColor" strokeWidth={1.5} className="text-foreground" />
      <line x1={330} y1={190} x2={240} y2={190} stroke="currentColor" strokeWidth={1.5} className="text-foreground" />
      <line x1={240} y1={200} x2={240} y2={230} stroke="currentColor" strokeWidth={1.5} className="text-foreground" />
      {/* Current arrow */}
      <text x={350} y={122} fontSize={12} textAnchor="middle" style={{ fill: "var(--emerald)" }}>I = {I.toFixed(2)} A</text>
      {/* Results */}
      <rect x={80} y={330} width={560} height={130} rx={12} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={365} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">计算结果</text>
      <text x={140} y={395} fontSize={14} className="fill-current">电功率 P = UI = {U.toFixed(0)}×{I.toFixed(2)} = <tspan fontWeight={600}>{P.toFixed(1)} W</tspan></text>
      <text x={140} y={420} fontSize={14} className="fill-current">电功 W = UIt = {U.toFixed(0)}×{I.toFixed(2)}×{t.toFixed(0)} = <tspan fontWeight={600}>{W.toFixed(1)} J</tspan></text>
      <text x={140} y={445} fontSize={13} className="fill-current text-muted-foreground">即 {(W / 3600000).toFixed(4)} kWh（度）</text>
    </svg>
  );
}

export const densitySpec: VisSpec = { component: DensityViz, supportsAnimation: false };
export const pressureSpec: VisSpec = { component: PressureViz, supportsAnimation: false };
export const buoyancySpec: VisSpec = { component: BuoyancyViz, supportsAnimation: false };
export const leverSpec: VisSpec = { component: LeverViz, supportsAnimation: false };
export const electricPowerSpec: VisSpec = { component: ElectricPowerViz, supportsAnimation: false };
