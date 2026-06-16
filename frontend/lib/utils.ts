import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatKm(km: number): string {
  return `${km.toFixed(1)} km`;
}

export function decisionColor(decision: string): "success" | "warning" | "danger" {
  const d = decision.toLowerCase();
  if (d.includes("safe") || d.includes("comfortable")) return "success";
  if (d.includes("possible") || d.includes("soon") || d.includes("manageable")) return "warning";
  return "danger";
}
