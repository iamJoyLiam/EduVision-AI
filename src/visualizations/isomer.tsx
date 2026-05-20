import type { VizProps, VisSpec } from "./helpers";

function IsomerViz({ params }: VizProps) {
  const isomerType = Math.round(params.type);
  const svgWidth = 720;
  const svgHeight = 480;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2 + 20;

  const renderCarbon = (cx: number, cy: number, label = "C") => (
    <g>
      <circle cx={cx} cy={cy} r={22} fill="var(--blue)" />
      <text x={cx} y={cy + 5} fontSize={14} textAnchor="middle" fill="white" fontWeight={600}>{label}</text>
    </g>
  );

  const renderBond = (x1: number, y1: number, x2: number, y2: number) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={2.5} className="text-foreground" />
  );

  const renderHydrogens = (cx: number, cy: number, count: number, angles: number[]) =>
    angles.slice(0, count).map((angle, idx) => {
      const bondLength = 42;
      const hx = cx + bondLength * Math.cos(angle);
      const hy = cy + bondLength * Math.sin(angle);
      return (
        <g key={idx}>
          <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="currentColor" strokeWidth={1.5} className="text-muted-foreground" />
          <circle cx={hx} cy={hy} r={11} fill="oklch(0.93 0.005 90)" stroke="currentColor" className="text-muted-foreground" />
          <text x={hx} y={hy + 4} fontSize={11} textAnchor="middle" className="fill-current text-muted-foreground">H</text>
        </g>
      );
    });

  const isomerInfo = isomerType === 0
    ? { name: "正丁烷", en: "n-butane", bp: "-0.5°C", struct: "直链结构", formula: "CH₃-CH₂-CH₂-CH₃" }
    : { name: "异丁烷", en: "isobutane", bp: "-11.7°C", struct: "支链结构", formula: "CH₃-CH(CH₃)-CH₃" };

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      <text x={20} y={28} fontSize={15} fontWeight={600} className="fill-current">
        {isomerInfo.name}（{isomerInfo.en}）
      </text>
      <text x={20} y={48} fontSize={12} className="fill-current text-muted-foreground">
        分子式 C₄H₁₀ · 结构简式 {isomerInfo.formula}
      </text>
      <text x={20} y={66} fontSize={12} className="fill-current text-muted-foreground">
        沸点 {isomerInfo.bp} · {isomerInfo.struct}
      </text>
      {isomerType === 0 ? (
        <g>
          {[0, 1, 2, 3].map((idx) => {
            const cx = centerX - 180 + idx * 120;
            const cy = centerY + (idx % 2 === 0 ? -20 : 20);
            return <g key={idx}>{renderCarbon(cx, cy)}</g>;
          })}
          {[0, 1, 2].map((idx) => {
            const x1 = centerX - 180 + idx * 120;
            const y1 = centerY + (idx % 2 === 0 ? -20 : 20);
            const x2 = centerX - 180 + (idx + 1) * 120;
            const y2 = centerY + ((idx + 1) % 2 === 0 ? -20 : 20);
            return <g key={idx}>{renderBond(x1, y1, x2, y2)}</g>;
          })}
          {[0, 1, 2, 3].map((idx) => {
            const cx = centerX - 180 + idx * 120;
            const cy = centerY + (idx % 2 === 0 ? -20 : 20);
            const isEnd = idx === 0 || idx === 3;
            const hydrogenCount = isEnd ? 3 : 2;
            const hydrogenAngles = isEnd
              ? [-Math.PI / 2, -Math.PI * 0.85, -Math.PI * 0.15]
              : [Math.PI / 2, -Math.PI / 2];
            return <g key={idx}>{renderHydrogens(cx, cy, hydrogenCount, hydrogenAngles)}</g>;
          })}
        </g>
      ) : (
        <g>
          {renderCarbon(centerX, centerY + 30)}
          {[
            [centerX, centerY - 90],
            [centerX - 130, centerY + 70],
            [centerX + 130, centerY + 70],
          ].map(([branchX, branchY], idx) => (
            <g key={idx}>
              {renderBond(centerX, centerY + 30, branchX, branchY)}
              {renderCarbon(branchX, branchY)}
              {renderHydrogens(branchX, branchY, 3, [-Math.PI / 2, -Math.PI * 0.85, -Math.PI * 0.15])}
            </g>
          ))}
          {renderHydrogens(centerX, centerY + 30, 1, [Math.PI / 2])}
        </g>
      )}
    </svg>
  );
}

export const isomerSpec: VisSpec = {
  component: IsomerViz,
  supportsAnimation: false,
};

export default IsomerViz;
