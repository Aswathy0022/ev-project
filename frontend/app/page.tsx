import Link from "next/link";
import { Zap, Map, Bolt, ChevronRight, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Battery Check",
    description: "Real-time range prediction based on weather, terrain, and riding conditions.",
    href: "/dashboard",
    color: "cyan",
  },
  {
    icon: Map,
    title: "Trip Planner",
    description: "Plan routes and verify your battery can make it — with safety buffer analysis.",
    href: "/trip-planner",
    color: "green",
  },
  {
    icon: Bolt,
    title: "Find Charger",
    description: "Discover nearby charging stations ranked by distance, speed, and availability.",
    href: "/charger-finder",
    color: "yellow",
  },
];

const colorMap: Record<string, { icon: string; bg: string }> = {
  cyan: { icon: "text-cyan-400", bg: "bg-cyan-500/10" },
  green: { icon: "text-green-400", bg: "bg-green-500/10" },
  yellow: { icon: "text-yellow-400", bg: "bg-yellow-500/10" },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 shadow-[0_0_12px_rgba(0,212,255,0.3)]">
            <Zap className="h-4 w-4 text-cyan-400" />
          </div>
          <span className="font-bold text-lg tracking-tight">VoltIQ</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400 transition-all shadow-[0_0_16px_rgba(0,212,255,0.3)]"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/8 px-4 py-1.5 text-xs font-medium text-cyan-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Smart EV Bike Assistant
        </div>

        <h1 className="max-w-3xl text-5xl font-bold tracking-tight leading-tight md:text-6xl">
          Know your range.{" "}
          <span className="text-cyan-400">Plan smarter.</span>
        </h1>

        <p className="mt-6 max-w-xl text-base text-[var(--muted)] leading-relaxed">
          VoltIQ predicts your EV bike&apos;s real-world range using weather, terrain, and riding style.
          Find chargers, plan trips, and never get stranded again.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-black hover:bg-cyan-400 transition-all shadow-[0_0_24px_rgba(0,212,255,0.4)]"
          >
            Check my battery <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium hover:bg-white/8 transition-all"
          >
            Sign in
          </Link>
        </div>

        <p className="mt-4 text-xs text-[var(--muted)]">No account needed · Works as guest</p>
      </section>

      {/* Features */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl grid gap-4 sm:grid-cols-3">
          {features.map((f) => {
            const c = colorMap[f.color];
            return (
              <Link
                key={f.title}
                href={f.href}
                className="group glass rounded-2xl p-6 hover:shadow-[0_0_24px_rgba(0,212,255,0.1)] transition-all duration-300"
              >
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${c.bg}`}>
                  <f.icon className={`h-5 w-5 ${c.icon}`} />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{f.description}</p>
                <div className={`mt-4 flex items-center gap-1 text-xs font-medium ${c.icon}`}>
                  Try it <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
