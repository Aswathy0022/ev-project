import Link from "next/link";
import type { Metadata } from "next";
import { Gauge, Map, Bolt, ArrowRight } from "lucide-react";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "How It Works | VoltIQ",
  description: "How VoltIQ predicts your EV bike's real-world range, checks it against your trip, and finds the right charger.",
};

const steps = [
  {
    number: "01",
    icon: Gauge,
    title: "Predict your real-world range",
    points: [
      "We don't use the number on the spec sheet. VoltIQ's range model factors in battery level and battery health, live weather and temperature, your ride mode (Eco/Normal/Sport), terrain (city roads, hills, highway), traffic conditions, and the actual load you're carrying — your weight, passengers, and luggage.",
      "The result is a predicted range in kilometers plus a performance score, so you know not just how far you can go, but how efficiently you're riding.",
    ],
  },
  {
    number: "02",
    icon: Map,
    title: "Check your trip against that range",
    points: [
      "Tell us where you're headed. We calculate the real route distance and elevation profile, then add a safety buffer — extra range held back so you're never cutting it exact — sized to your trip.",
      "We compare what the trip needs against what you've actually got left, and give you a clear verdict: comfortably safe, doable with care, or risky — with the reasoning behind it, not just a red light.",
    ],
  },
  {
    number: "03",
    icon: Bolt,
    title: "Find the right charger before you need one",
    points: [
      "If your trip needs a top-up, we rank nearby charging stations by distance, current wait time, how loaded the station is, and how fast it charges — not just \"closest pin on the map.\"",
      "Sort by nearest, fastest charge rate, or shortest wait, and route your stop into the trip without backtracking.",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />

      <main className="flex-1">
        <section className="px-6 pt-16 pb-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/8 px-4 py-1.5 text-xs font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
              How It Works
            </div>
            <h1 className="text-4xl font-bold tracking-tight leading-tight md:text-5xl">
              From your battery to your next charge —{" "}
              <span className="text-green-600">one prediction pipeline.</span>
            </h1>
            <p className="mt-5 text-base text-muted leading-relaxed">
              VoltIQ turns raw ride conditions into a trustworthy range number, then checks it against
              your trip and the chargers around you — automatically, every time you plan.
            </p>
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="mx-auto max-w-3xl space-y-5">
            {steps.map((step) => (
              <Card key={step.number} className="flex gap-5">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                    <step.icon className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-xs font-mono text-muted">{step.number}</span>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <div className="space-y-2">
                    {step.points.map((p) => (
                      <p key={p} className="text-sm text-muted leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="mx-auto max-w-3xl glass rounded-2xl p-8 text-center">
            <h2 className="text-xl font-semibold">See it on your own ride</h2>
            <p className="mt-2 text-sm text-muted">No account needed to try a prediction.</p>
            <Link
              href="/trip-planner"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-500 transition-all"
            >
              Plan a Trip <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
