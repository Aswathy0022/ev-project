import Link from "next/link";
import { Bolt } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/trip-planner", label: "Trip Planner" },
      { href: "/charger-finder", label: "Charger Finder" },
      { href: "/dashboard", label: "Battery Check" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about-us", label: "About Us" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/for-partners", label: "For Partners" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Log In" },
      { href: "/signup", label: "Sign Up" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-black/8 bg-[var(--surface-2)]">
      <div className="mx-auto max-w-6xl px-6 py-10 grid gap-8 sm:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
              <Bolt className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-base font-bold tracking-tight">VoltIQ</span>
          </div>
          <p className="mt-3 text-sm text-muted">Know your range. Plan smarter.</p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold mb-3">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted hover:text-foreground transition-all">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-black/8 px-6 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} VoltIQ. Built for riders who hate guessing.
      </div>
    </footer>
  );
}
