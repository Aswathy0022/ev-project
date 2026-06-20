import type { Metadata } from "next";
import { Bolt, TrendingUp, ArrowRight } from "lucide-react";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "For Partners | VoltIQ",
  description: "Charging networks and EV bike makers — partner with VoltIQ to get in front of riders actively planning their next trip.",
};

const tracks = [
  {
    icon: Bolt,
    title: "Charging Networks",
    description:
      "VoltIQ riders already see nearby stations ranked by distance, wait time, and charging speed. If you operate a charging network, we'd like to talk about getting your stations' live status — availability, queue, rate — in front of riders actively planning a trip through your area.",
  },
  {
    icon: TrendingUp,
    title: "EV Bike Manufacturers",
    description:
      "Every range prediction VoltIQ makes is only as good as the vehicle data behind it. If you build EV bikes or scooters, we're interested in partnering to model your vehicles' real-world range more precisely — so your riders get an accurate number from day one, not a generic estimate.",
  },
];

const possibilities = [
  "Live station data feeds for charging networks",
  "Verified vehicle profiles for accurate range modeling",
  "Co-branded trip planning for your app or fleet",
];

export default function ForPartnersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />

      <main className="flex-1">
        <section className="px-6 pt-16 pb-12">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight leading-tight md:text-5xl">
              Bring your chargers and bikes into riders&apos;{" "}
              <span className="text-green-600">trip plans.</span>
            </h1>
            <p className="mt-5 text-base text-muted leading-relaxed">
              VoltIQ helps riders decide where to charge and how far they can go. We&apos;re looking
              for charging networks and EV bike makers who want to be part of that decision.
            </p>
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="mx-auto max-w-4xl grid gap-5 sm:grid-cols-2">
            {tracks.map((track) => (
              <Card key={track.title}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                  <track.icon className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">{track.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{track.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-semibold mb-3">What partnering could look like</h2>
            <p className="text-sm text-muted leading-relaxed mb-4">
              Depending on what makes sense for your fleet or network, this could include:
            </p>
            <ul className="space-y-2">
              {possibilities.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-600 flex-shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="mx-auto max-w-3xl glass rounded-2xl p-8 text-center">
            <h2 className="text-xl font-semibold">Let&apos;s talk</h2>
            <p className="mt-2 text-sm text-muted">
              Tell us about your network or fleet and what you&apos;re hoping to build together.
            </p>
            <a
              href="mailto:partners@voltiq.app?subject=Partnership%20inquiry"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-500 transition-all"
            >
              Get in touch <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
