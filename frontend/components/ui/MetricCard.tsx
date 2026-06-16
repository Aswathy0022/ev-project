import { cn } from "@/lib/utils";
import { Card } from "./Card";

type Color = "accent" | "success" | "warning" | "danger" | "default";

const colorMap: Record<Color, { value: string; bg: string }> = {
  accent: { value: "text-cyan-400", bg: "bg-cyan-500/10" },
  success: { value: "text-green-400", bg: "bg-green-500/10" },
  warning: { value: "text-yellow-400", bg: "bg-yellow-500/10" },
  danger: { value: "text-red-400", bg: "bg-red-500/10" },
  default: { value: "text-slate-300", bg: "bg-white/5" },
};

export function MetricCard({
  label,
  value,
  unit,
  subtext,
  icon: Icon,
  color = "default",
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon?: React.ElementType;
  color?: Color;
  className?: string;
}) {
  const c = colorMap[color];
  return (
    <Card glow className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted uppercase tracking-wider">{label}</span>
        {Icon && (
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", c.bg)}>
            <Icon className={cn("h-3.5 w-3.5", c.value)} />
          </span>
        )}
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className={cn("text-2xl font-bold font-mono", c.value)}>{value}</span>
          {unit && <span className="text-sm text-muted">{unit}</span>}
        </div>
        {subtext && <p className="mt-1 text-xs text-muted">{subtext}</p>}
      </div>
    </Card>
  );
}
