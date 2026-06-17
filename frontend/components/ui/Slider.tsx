import { cn } from "@/lib/utils";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  hint?: string;
  onChange: (v: number) => void;
  className?: string;
}

export function Slider({ label, value, min, max, step = 1, unit = "", hint, onChange, className }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const sliderId = label.toLowerCase().replace(/\s+/g, "-") + "-slider";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <label htmlFor={sliderId} className="text-sm font-medium text-muted flex items-center gap-1.5">
          {label}
          {hint && (
            <span title={hint} className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 text-xs text-muted cursor-help leading-none select-none">?</span>
          )}
        </label>
        <span className="text-base font-semibold text-foreground font-mono">
          {value}{unit}
        </span>
      </div>
      <div className="relative">
        <input
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #00d4ff ${pct}%, rgba(255,255,255,0.12) ${pct}%)`,
          }}
        />
      </div>
    </div>
  );
}
