"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, AlertTriangle, BellOff } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const alerts = useAlerts();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5 text-muted" />
        {alerts.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {alerts.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-black/8 bg-[var(--surface)] p-2 shadow-lg z-50">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <BellOff className="h-5 w-5 text-muted" />
              <p className="text-xs text-muted">No alerts right now</p>
            </div>
          ) : (
            <div className="space-y-1">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    "flex items-start gap-2 rounded-lg p-2.5 text-xs",
                    a.severity === "danger" ? "bg-red-500/8 text-red-700" : "bg-yellow-500/8 text-yellow-700"
                  )}
                >
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{a.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
