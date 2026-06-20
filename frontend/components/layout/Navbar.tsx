"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Zap, LayoutDashboard, Map, Bolt, History, LogOut, User, Menu, X, ShieldCheck, Lock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { WeatherPill } from "./WeatherPill";
import { NotificationBell } from "./NotificationBell";

const navItems = [
  { href: "/dashboard", label: "Battery Check", icon: LayoutDashboard },
  { href: "/trip-planner", label: "Trip Planner", icon: Map },
  { href: "/charger-finder", label: "Find Chargers", icon: Bolt },
  { href: "/history", label: "History", icon: History, authOnly: true },
  { href: "/admin", label: "Admin", icon: ShieldCheck, adminOnly: true },
];

function NavLink({ href, label, icon: Icon, authOnly, adminOnly, user, onClick }: {
  href: string; label: string; icon: React.ElementType;
  authOnly?: boolean; adminOnly?: boolean;
  user: { id: number; is_admin?: boolean } | null;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  if (adminOnly && !user?.is_admin) return null;

  if (authOnly && !user) {
    return (
      <span className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted/40 cursor-not-allowed select-none">
        <Icon className="h-4 w-4" />
        {label}
        <Lock className="h-3 w-3" />
      </span>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
        active
          ? "bg-green-500/10 text-green-700"
          : "text-muted hover:bg-black/5 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [userMenuOpen]);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    setUserMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-black/8 bg-[var(--surface)]/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/15">
              <Zap className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-base font-bold tracking-tight">VoltIQ</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} user={user} />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden lg:block">
            <WeatherPill />
          </div>
          <NotificationBell />

          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-black/5 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500/15 shrink-0">
                  <User className="h-3.5 w-3.5 text-green-600" />
                </div>
                <span className="hidden sm:block text-sm font-medium">{user.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-black/8 bg-[var(--surface)] p-1.5 shadow-lg z-50">
                  <p className="px-3 py-2 text-xs text-muted truncate">{user.email}</p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-black/5 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 transition-all"
            >
              Get Started
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="md:hidden p-1.5 rounded-lg hover:bg-black/5"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden flex flex-col gap-1 px-4 pb-3 border-t border-black/8 pt-3">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} user={user} onClick={() => setOpen(false)} />
          ))}
          <div className="pt-2">
            <WeatherPill />
          </div>
        </nav>
      )}
    </header>
  );
}
