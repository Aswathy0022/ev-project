import { cn, decisionColor } from "@/lib/utils";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const config = {
  success: {
    icon: CheckCircle,
    border: "border-green-500/40",
    bg: "bg-green-500/10",
    text: "text-green-400",
    glow: "shadow-[0_0_32px_rgba(34,197,94,0.12)]",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-yellow-500/40",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    glow: "shadow-[0_0_32px_rgba(234,179,8,0.12)]",
  },
  danger: {
    icon: XCircle,
    border: "border-red-500/40",
    bg: "bg-red-500/10",
    text: "text-red-400",
    glow: "shadow-[0_0_32px_rgba(239,68,68,0.12)]",
  },
};

export function DecisionBanner({ decision, detail }: { decision: string; detail: string }) {
  const variant = decisionColor(decision);
  const { icon: Icon, border, bg, text, glow } = config[variant];

  return (
    <div className={cn("flex items-start gap-4 rounded-2xl border p-5", bg, border, glow)}>
      <Icon className={cn("h-6 w-6 mt-0.5 shrink-0", text)} />
      <div>
        <p className={cn("font-semibold text-base", text)}>{decision}</p>
        <p className="mt-1 text-sm text-muted">{detail}</p>
      </div>
    </div>
  );
}
