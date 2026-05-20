import { type VizProps, type VisSpec } from "./helpers";

export function MassConservationViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const nA = Math.max(1, Math.round(params.nA ?? 2));
  const nB = Math.max(1, Math.round(params.nB ?? 1));
  const mA = params.mA ?? 2;
  const mB = params.mB ?? 32;

  const totalBefore = nA * mA + nB * mB;
  const totalAfter = totalBefore;

  const barMax = 300;
  const scale = barMax / Math.max(totalBefore, 1);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={30} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">质量守恒定律</text>
      <text x={svgWidth / 2} y={58} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">反应前后质量不变</text>
      {/* Reaction equation */}
      <text x={svgWidth / 2} y={95} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">
        {nA}H₂ + {nB}O₂ → H₂O
      </text>
      {/* Before */}
      <text x={200} y={140} fontSize={15} textAnchor="middle" fontWeight={600} className="fill-current">反应前</text>
      <rect x={100} y={160} width={80} height={Math.max(10, nA * mA * scale)} fill="var(--blue)" opacity={0.6} rx={4} />
      <text x={140} y={160 + Math.max(10, nA * mA * scale) + 18} fontSize={12} textAnchor="middle" className="fill-current">{nA}H₂ = {(nA * mA).toFixed(1)}g</text>
      <rect x={200} y={160} width={80} height={Math.max(10, nB * mB * scale)} fill="var(--emerald)" opacity={0.6} rx={4} />
      <text x={240} y={160 + Math.max(10, nB * mB * scale) + 18} fontSize={12} textAnchor="middle" className="fill-current">{nB}O₂ = {(nB * mB).toFixed(1)}g</text>
      <text x={200} y={320} fontSize={16} textAnchor="middle" fontWeight={600} style={{ fill: "var(--blue)" }}>
        总计 = {totalBefore.toFixed(1)} g
      </text>
      {/* Arrow */}
      <defs>
        <marker id="mass-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--pink)" />
        </marker>
      </defs>
      <line x1={310} y1={230} x2={400} y2={230} stroke="var(--pink)" strokeWidth={2.5} markerEnd="url(#mass-arrow)" />
      <text x={355} y={215} fontSize={13} textAnchor="middle" style={{ fill: "var(--pink)" }}>反应</text>
      {/* After */}
      <text x={540} y={140} fontSize={15} textAnchor="middle" fontWeight={600} className="fill-current">反应后</text>
      <rect x={460} y={160} width={160} height={Math.max(10, totalAfter * scale)} fill="var(--pink)" opacity={0.6} rx={4} />
      <text x={540} y={160 + Math.max(10, totalAfter * scale) + 18} fontSize={12} textAnchor="middle" className="fill-current">H₂O = {totalAfter.toFixed(1)}g</text>
      <text x={540} y={320} fontSize={16} textAnchor="middle" fontWeight={600} style={{ fill: "var(--pink)" }}>
        总计 = {totalAfter.toFixed(1)} g
      </text>
      {/* Summary */}
      <rect x={80} y={360} width={560} height={100} rx={12} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={395} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">
        反应前质量 = 反应后质量 = {totalBefore.toFixed(1)} g
      </text>
      <text x={360} y={430} fontSize={14} textAnchor="middle" className="fill-current text-muted-foreground">
        质量守恒：化学反应前后，原子种类和数目不变
      </text>
    </svg>
  );
}

export function MassFractionViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const solute = params.solute ?? 20;
  const solvent = params.solvent ?? 80;
  const solution = solute + solvent;
  const fraction = solution > 0 ? (solute / solution) * 100 : 0;

  const pieCx = 250;
  const pieCy = 250;
  const pieR = 120;
  const filledAngle = (fraction / 100) * 2 * Math.PI;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={30} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">溶液质量分数</text>
      <text x={svgWidth / 2} y={58} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">ω = 溶质质量 / 溶液质量 × 100%</text>
      {/* Pie chart */}
      <circle cx={pieCx} cy={pieCy} r={pieR} fill="var(--blue)" opacity={0.15} />
      <path
        d={`M ${pieCx} ${pieCy} L ${pieCx} ${pieCy - pieR} A ${pieR} ${pieR} 0 ${fraction > 50 ? 1 : 0} 1 ${pieCx + pieR * Math.sin(filledAngle)} ${pieCy - pieR * Math.cos(filledAngle)} Z`}
        fill="var(--pink)" opacity={0.5}
      />
      <circle cx={pieCx} cy={pieCy} r={pieR} fill="none" stroke="currentColor" strokeWidth={2} className="text-foreground" />
      <text x={pieCx} y={pieCy - 10} fontSize={20} textAnchor="middle" fontWeight={700} style={{ fill: "var(--pink)" }}>
        {fraction.toFixed(1)}%
      </text>
      <text x={pieCx} y={pieCy + 15} fontSize={13} textAnchor="middle" className="fill-current text-muted-foreground">质量分数</text>
      {/* Legend */}
      <text x={480} y={120} fontSize={15} fontWeight={600} className="fill-current">溶液组成</text>
      <rect x={480} y={140} width={16} height={16} fill="var(--pink)" opacity={0.5} rx={3} />
      <text x={502} y={153} fontSize={13} className="fill-current">溶质: {solute.toFixed(1)} g</text>
      <rect x={480} y={170} width={16} height={16} fill="var(--blue)" opacity={0.15} stroke="currentColor" strokeWidth={1} className="text-foreground" rx={3} />
      <text x={502} y={183} fontSize={13} className="fill-current">溶剂: {solvent.toFixed(1)} g</text>
      <text x={480} y={215} fontSize={14} fontWeight={600} className="fill-current">溶液: {solution.toFixed(1)} g</text>
      {/* Formula */}
      <rect x={80} y={400} width={560} height={60} rx={10} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={435} fontSize={16} textAnchor="middle" fontWeight={600} className="fill-current">
        ω = {solute.toFixed(1)} / {solution.toFixed(1)} × 100% = {fraction.toFixed(2)}%
      </text>
    </svg>
  );
}

export function AcidBasePHViz({ params }: VizProps) {
  const svgWidth = 720;
  const svgHeight = 480;
  const pH = Math.max(0, Math.min(14, params.pH ?? 7));

  const barX = 100;
  const barY = 100;
  const barW = 520;
  const barH = 40;

  const markerX = barX + (pH / 14) * barW;

  const getLabel = () => {
    if (pH < 3) return "强酸性";
    if (pH < 5) return "弱酸性";
    if (pH < 6.5) return "弱酸性";
    if (pH <= 7.5) return "中性";
    if (pH < 9) return "弱碱性";
    if (pH < 12) return "弱碱性";
    return "强碱性";
  };

  const getColor = () => {
    if (pH < 7) return "var(--pink)";
    if (pH > 7) return "var(--blue)";
    return "var(--emerald)";
  };

  const commonExamples: { pH: number; label: string }[] = [
    { pH: 1, label: "胃酸" },
    { pH: 3, label: "醋" },
    { pH: 5.5, label: "雨水" },
    { pH: 7, label: "纯水" },
    { pH: 8.5, label: "海水" },
    { pH: 10, label: "肥皂水" },
    { pH: 13, label: "漂白剂" },
  ];

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={svgWidth / 2} y={30} fontSize={18} textAnchor="middle" fontWeight={600} className="fill-current">酸碱与pH</text>
      <text x={svgWidth / 2} y={58} fontSize={15} textAnchor="middle" className="fill-current text-muted-foreground">pH = -lg[H⁺]</text>
      {/* pH bar - gradient */}
      <defs>
        <linearGradient id="ph-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--pink)" />
          <stop offset="50%" stopColor="var(--emerald)" />
          <stop offset="100%" stopColor="var(--blue)" />
        </linearGradient>
      </defs>
      <rect x={barX} y={barY} width={barW} height={barH} rx={6} fill="url(#ph-grad)" opacity={0.3} />
      <rect x={barX} y={barY} width={barW} height={barH} rx={6} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-foreground" />
      {/* Scale marks */}
      {Array.from({ length: 15 }, (_, i) => {
        const x = barX + (i / 14) * barW;
        return (
          <g key={i}>
            <line x1={x} y1={barY + barH} x2={x} y2={barY + barH + 8} stroke="currentColor" strokeWidth={1} className="text-foreground" />
            <text x={x} y={barY + barH + 22} fontSize={11} textAnchor="middle" className="fill-current text-muted-foreground">{i}</text>
          </g>
        );
      })}
      {/* Marker */}
      <line x1={markerX} y1={barY - 10} x2={markerX} y2={barY + barH + 10} stroke={getColor()} strokeWidth={3} />
      <circle cx={markerX} cy={barY - 10} r={6} fill={getColor()} />
      <text x={markerX} y={barY - 22} fontSize={16} textAnchor="middle" fontWeight={700} style={{ fill: getColor() }}>
        pH = {pH.toFixed(1)}
      </text>
      {/* Labels */}
      <text x={barX} y={barY - 15} fontSize={14} textAnchor="start" fontWeight={600} style={{ fill: "var(--pink)" }}>酸性</text>
      <text x={barX + barW / 2} y={barY - 15} fontSize={14} textAnchor="middle" fontWeight={600} style={{ fill: "var(--emerald)" }}>中性</text>
      <text x={barX + barW} y={barY - 15} fontSize={14} textAnchor="end" fontWeight={600} style={{ fill: "var(--blue)" }}>碱性</text>
      {/* Result */}
      <text x={svgWidth / 2} y={200} fontSize={22} textAnchor="middle" fontWeight={700} style={{ fill: getColor() }}>
        {getLabel()}
      </text>
      <text x={svgWidth / 2} y={230} fontSize={14} textAnchor="middle" className="fill-current text-muted-foreground">
        [H⁺] = 10^(-{pH.toFixed(1)}) = {Math.pow(10, -pH).toExponential(2)} mol/L
      </text>
      {/* Common examples */}
      <text x={svgWidth / 2} y={275} fontSize={15} textAnchor="middle" fontWeight={600} className="fill-current">常见物质的pH</text>
      {commonExamples.map((ex) => {
        const exX = barX + (ex.pH / 14) * barW;
        return (
          <g key={ex.pH}>
            <line x1={exX} y1={barY + barH + 30} x2={exX} y2={barY + barH + 55} stroke="currentColor" strokeWidth={0.8} className="text-muted-foreground" />
            <circle cx={exX} cy={barY + barH + 60} r={4} fill={ex.pH < 7 ? "var(--pink)" : ex.pH > 7 ? "var(--blue)" : "var(--emerald)"} />
            <text x={exX} y={barY + barH + 78} fontSize={10} textAnchor="middle" className="fill-current text-muted-foreground">{ex.label}</text>
          </g>
        );
      })}
      {/* Summary */}
      <rect x={80} y={400} width={560} height={60} rx={10} fill="var(--surface)" stroke="var(--border)" />
      <text x={360} y={435} fontSize={14} textAnchor="middle" className="fill-current">
        pH {'<'} 7 为酸性，pH = 7 为中性，pH {'>'} 7 为碱性
      </text>
    </svg>
  );
}

export const massConservationSpec: VisSpec = { component: MassConservationViz, supportsAnimation: false };
export const massFractionSpec: VisSpec = { component: MassFractionViz, supportsAnimation: false };
export const acidBasePHSpec: VisSpec = { component: AcidBasePHViz, supportsAnimation: false };
