import Link from "next/link";
import type { Metadata } from "next";
import { Leaf, ShieldCheck, Clock, ArrowRight } from "lucide-react";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";

export const metadata: Metadata = {
  title: "About Us | VoltIQ",
  description: "Why VoltIQ exists: closing the gap between lab-rated EV bike range and what you actually get on the road.",
};

const mission = [
  {
    icon: Leaf,
    title: "Built for real conditions",
    description: "Range estimates that account for weather, hills, and load — not just a spec sheet number.",
  },
  {
    icon: ShieldCheck,
    title: "Safety first",
    description: "Every trip is checked against a safety buffer before we call it \"doable.\"",
  },
  {
    icon: Clock,
    title: "Less time guessing",
    description: "Find a charger and plan a route in the time it takes to glance at your phone.",
  },
];

export default function AboutUsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />

      <main className="flex-1">
        <section className="px-6 pt-16 pb-12">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight leading-tight md:text-5xl">
              We built VoltIQ because range anxiety shouldn&apos;t be part of riding electric.
            </h1>
            <p className="mt-5 text-base text-muted leading-relaxed">
              Most EV bike range numbers come from a lab, not the road. VoltIQ exists to close that
              gap — turning weather, terrain, and how you actually ride into a number you can trust.
            </p>
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="mx-auto max-w-6xl grid gap-5 sm:grid-cols-3">
            {mission.map((m) => (
              <div key={m.title} className="glass rounded-2xl p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                  <m.icon className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">{m.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{m.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-semibold mb-3">Who it&apos;s for</h2>
            <p className="text-sm text-muted leading-relaxed">
              Daily commuters on electric scooters and bikes, delivery riders who need predictable
              range to plan their shift, and anyone who&apos;s been stranded by an optimistic range
              estimate once and doesn&apos;t want to repeat it.
            </p>
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-semibold mb-3">Why we exist</h2>
            <p className="text-sm text-muted leading-relaxed">
              VoltIQ started as a simple frustration: EV bike range estimates rarely match what you
              actually get once weather, hills, and a passenger are factored in. We set out to build
              the range prediction we wished existed — one built from real ride conditions, not a
              marketing spec — and grew it into a full assistant for planning trips and finding
              chargers.
            </p>
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="mx-auto max-w-3xl glass rounded-2xl p-8 text-center">
            <h2 className="text-xl font-semibold">Ready to know your range?</h2>
            <p className="mt-2 text-sm text-muted">No account needed · Free to use</p>
            <Link
              href="/signup"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-500 transition-all"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
