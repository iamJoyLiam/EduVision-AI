import type { ParamDef } from "@/lib/topics";

interface ParamSliderProps {
  def: ParamDef;
  value: number;
  onChange: (v: number) => void;
}

export function ParamSlider({ def, value, onChange }: ParamSliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{def.label}</span>
        <span className="font-mono tabular-nums text-foreground">
          {Number.isInteger(def.step) ? value.toFixed(0) : value.toFixed(2)}
          {def.unit ? <span className="text-muted-foreground ml-1">{def.unit}</span> : null}
        </span>
      </div>
      <input
        type="range"
        min={def.min}
        max={def.max}
        step={def.step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--blue)]"
      />
    </div>
  );
}
