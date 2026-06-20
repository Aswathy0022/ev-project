import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "danger" | "accent" | "default";

const variants: Record<Variant, string> = {
  success: "bg-green-500/15 text-green-400 border-green-500/30",
  warning: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  danger: "bg-red-500/15 text-red-400 border-red-500/30",
  accent: "bg-green-500/15 text-green-700 border-green-500/30",
  default: "bg-black/5 text-slate-500 border-black/10",
};

export function Badge({
  variant = "default",
  className,
  children,
}: {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
