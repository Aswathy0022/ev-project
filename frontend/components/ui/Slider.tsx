import { cn } from "@/lib/utils";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  className?: string;
}

export function Slider({ label, value, min, max, step = 1, unit = "", onChange, className }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted">{label}</label>
        <span className="text-sm font-semibold text-foreground font-mono">
          {value}{unit}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #00d4ff ${pct}%, rgba(255,255,255,0.12) ${pct}%)`,
          }}
        />
      </div>
    </div>
  );
}
