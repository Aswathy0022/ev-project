"use client";

import Link from "next/link";
import Image from "next/image";
import { Map, Bolt, TrendingUp, ArrowRight, Gauge, Clock, Search, Leaf, Sun, ShieldCheck, Navigation } from "lucide-react";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { useWeather } from "@/hooks/useWeather";
import { useAuth } from "@/hooks/useAuth";

const features = [
  {
    icon: Map,
    title: "Plan Trips",
    description: "Plan safe and efficient trips with accurate range prediction and smart charging stops.",
    href: "/trip-planner",
    cta: "Plan Now",
    chart: true,
  },
  {
    icon: Bolt,
    title: "Find Chargers",
    description: "Discover nearby EV charging stations ranked by distance, speed, and availability.",
    href: "/charger-finder",
    cta: "Find Chargers",
  },
  {
    icon: TrendingUp,
    title: "Smart Insights",
    description: "Get data-driven insights to improve your ride times and extend your real-world range.",
    href: "/dashboard",
    cta: "Explore Insights",
    chart: true,
    stat: { label: "Predicted Range", value: "66.9 km" },
  },
];

const trust = [
  { icon: Gauge, label: "Accurate Predictions" },
  { icon: Clock, label: "Save Time" },
  { icon: Search, label: "Find Faster" },
  { icon: Leaf, label: "Eco Friendly" },
];

function Sparkline() {
  return (
    <svg viewBox="0 0 100 30" className="h-8 w-full text-green-500" fill="none">
      <path
        d="M0 24 L15 18 L30 22 L45 10 L60 14 L75 4 L100 8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LandingPage() {
  const { data: weather } = useWeather();
  const { user } = useAuth();
  const roadCondition = weather
    ? weather.condition === "Storm" || weather.condition === "Snow"
      ? "Caution"
      : weather.condition === "Rain"
        ? "Wet"
        : "Good"
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[26rem] md:min-h-[30rem] flex items-center">
        <div className="absolute inset-0">
          <Image
            src="/hero.png"
            alt="Mint-green electric scooter parked on a winding mountain road"
            fill
            className="object-cover"
            priority
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(to right, var(--background) 0%, var(--background) 30%, transparent 70%)",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 70% at center, transparent 0%, transparent 25%, var(--background) 85%, var(--background) 100%)",
            }}
          />
        </div>

        {weather && (
          <div className="absolute top-6 right-6 z-10 glass rounded-2xl px-5 py-4 w-full max-w-xs">
            <p className="mb-3 text-xs text-muted">Weather in {weather.location_label ?? "your area"}</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <Sun className="mx-auto mb-1 h-4 w-4 text-green-600" />
                <p className="text-sm font-semibold">{weather.temperature_c}°C</p>
                <p className="text-[11px] text-muted">{weather.condition_label}</p>
              </div>
              <div>
                <ShieldCheck className="mx-auto mb-1 h-4 w-4 text-green-600" />
                <p className="text-sm font-semibold">{roadCondition}</p>
                <p className="text-[11px] text-muted">Road</p>
              </div>
              <div>
                <Navigation className="mx-auto mb-1 h-4 w-4 text-green-600" />
                <p className="text-sm font-semibold">Light</p>
                <p className="text-[11px] text-muted">Traffic</p>
              </div>
            </div>
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-16 md:py-20 w-full">
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/8 px-4 py-1.5 text-xs font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
              Smart EV Bike Assistant
            </div>

            <h1 className="text-4xl font-bold tracking-tight leading-tight md:text-5xl">
              Know your range.{" "}
              <span className="text-green-600">Plan smarter.</span>
            </h1>

            <p className="mt-5 max-w-lg text-base text-muted leading-relaxed">
              VoltIQ predicts your EV bike&apos;s real-world range using weather, terrain, and riding style.
              Find chargers, plan trips, and never get stranded again.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/trip-planner"
                className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-500 transition-all"
              >
                Plan Your Trip <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/charger-finder"
                className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-6 py-3 font-medium hover:bg-black/3 transition-all"
              >
                Find Chargers
              </Link>
            </div>

            <p className="mt-4 text-xs text-muted">No account needed · Free to use</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 pb-16">
        <div className="mx-auto max-w-6xl grid gap-5 sm:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="group glass rounded-2xl p-6 hover:shadow-[0_0_24px_rgba(22,163,74,0.1)] transition-all duration-300"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                <f.icon className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.description}</p>

              {f.stat && (
                <p className="mt-3 text-xs text-muted">
                  {f.stat.label} <span className="font-semibold text-foreground">{f.stat.value}</span>
                </p>
              )}
              {f.chart && <Sparkline />}

              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-green-600">
                {f.cta} <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-black/8 pt-8">
          {trust.map((t) => (
            <div key={t.label} className="flex items-center gap-2 justify-center text-xs font-medium text-muted">
              <t.icon className="h-4 w-4 text-green-600" />
              {t.label}
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
