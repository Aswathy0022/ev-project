"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Zap, LayoutDashboard, Map, Bolt, History, LogOut, User, Menu, X, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trip-planner", label: "Trip Planner", icon: Map },
  { href: "/charger-finder", label: "Find Charger", icon: Bolt },
  { href: "/history", label: "History", icon: History, authOnly: true },
  { href: "/admin", label: "Admin", icon: ShieldCheck, adminOnly: true },
];

function NavLink({ href, label, icon: Icon, authOnly, adminOnly, user }: {
  href: string; label: string; icon: React.ElementType;
  authOnly?: boolean; adminOnly?: boolean;
  user: { id: number; is_admin?: boolean } | null;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  if (authOnly && !user) return null;
  if (adminOnly && !user?.is_admin) return null;

  const isAdmin = adminOnly;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? isAdmin
            ? "bg-yellow-500/15 text-yellow-400"
            : "bg-cyan-500/15 text-cyan-400 shadow-[inset_0_0_12px_rgba(0,212,255,0.08)]"
          : isAdmin
            ? "text-yellow-500/70 hover:bg-yellow-500/8 hover:text-yellow-400"
            : "text-muted hover:bg-white/5 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    router.push("/");
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-5 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 shadow-[0_0_12px_rgba(0,212,255,0.3)]">
          <Zap className="h-4 w-4 text-cyan-400" />
        </div>
        <span className="text-base font-bold tracking-tight">VoltIQ</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} user={user} />
        ))}
      </nav>

      {/* User / Auth */}
      <div className="border-t border-white/8 pt-4 mt-4">
        {user ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/4">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 shrink-0">
                <User className="h-3.5 w-3.5 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-foreground transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-black hover:bg-cyan-400 transition-all shadow-[0_0_16px_rgba(0,212,255,0.3)]"
            >
              Sign in
            </Link>
            <p className="text-center text-xs text-muted">Browsing as guest</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-white/8 bg-[#0d1521] p-4 min-h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-white/8 bg-[#0d1521]/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-cyan-400" />
          <span className="font-bold text-sm">VoltIQ</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg hover:bg-white/8">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative w-64 bg-[#0d1521] p-4 min-h-full border-r border-white/8">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
