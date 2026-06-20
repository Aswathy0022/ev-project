"use client";

import Link from "next/link";
import { Bolt } from "lucide-react";
import { WeatherPill } from "@/components/layout/WeatherPill";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about-us", label: "About Us" },
  { href: "/for-partners", label: "For Partners" },
];

export function MarketingHeader() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-black/8 bg-[var(--surface)]/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
            <Bolt className="h-4 w-4 text-green-600" />
          </div>
          <span className="text-base font-bold tracking-tight">VoltIQ</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-black/5 hover:text-foreground transition-all"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden lg:block">
            <WeatherPill />
          </div>
          <Link
            href={user ? "/dashboard" : "/signup"}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 transition-all"
          >
            {user ? "Go to Dashboard" : "Get Started"}
          </Link>
        </div>
      </div>
    </header>
  );
}
