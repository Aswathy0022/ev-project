import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-muted">{label}</label>}
      <select
        className={cn(
          "w-full rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5 text-sm text-foreground",
          "transition-all duration-200 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/15",
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
