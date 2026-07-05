"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Flame, History, LayoutDashboard, Trophy, User, ShieldCheck, LogOut } from "lucide-react";

export default function Navbar({ name, role }: { name: string; role: "PLAYER" | "ADMIN" }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/history", label: "History", icon: History },
    { href: "/profile", label: "Profile", icon: User },
    ...(role === "ADMIN" ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-navy-700 bg-gradient-to-r from-navy-900 to-navy-700 shadow-md">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2 font-display text-base font-semibold text-white">
          <Flame className="h-6 w-6 shrink-0 text-ember-400" />
          <span className="hidden md:inline">Sun Country Q3 Bonfire Challenge</span>
          <span className="md:hidden">Bonfire Challenge</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "border-ember-400 text-white" : "border-transparent text-navy-200 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-navy-200 sm:inline">{name}</span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-navy-400 px-3 py-1.5 text-sm text-navy-100 transition-colors hover:border-ember-400 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
