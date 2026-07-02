"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Flame, LayoutDashboard, Trophy, User, ShieldCheck, LogOut } from "lucide-react";

export default function Navbar({ name, role }: { name: string; role: "PLAYER" | "ADMIN" }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/profile", label: "Profile", icon: User },
    ...(role === "ADMIN" ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-ash-900 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-display text-lg font-bold text-ember-200">
          <Flame className="h-6 w-6 text-ember-400" />
          Bonfire
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-ember-500/15 text-ember-200" : "text-ash-300 hover:bg-ash-900 hover:text-ash-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-ash-300 sm:inline">{name}</span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-ash-700 px-3 py-1.5 text-sm text-ash-300 transition-colors hover:border-ember-500 hover:text-ember-200"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
