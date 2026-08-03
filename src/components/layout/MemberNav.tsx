"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Home", icon: "⛪" },
  { href: "/attendance", label: "Attendance", icon: "📍" },
  { href: "/sermons", label: "Sermons", icon: "📖" },
  { href: "/bible-study", label: "Bible Study", icon: "✝️" },
  { href: "/devotionals", label: "Devotionals", icon: "🕊️" },
  { href: "/quotes", label: "Quotes", icon: "💬" },
  { href: "/announcements", label: "Announcements", icon: "📣" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/evangelism", label: "Evangelism", icon: "🌱" },
];

interface MemberNavProps {
  userName: string;
  totalPoints: number;
  role: string;
}

export function MemberNav({ userName, totalPoints, role }: MemberNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-navy text-cream z-40">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-navy-light/30">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <h1 className="font-heading text-lg text-gold font-bold leading-tight">UCM Scribe</h1>
              <p className="text-[10px] text-cream/60 font-body">Digital Faith Platform</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide">
          {links.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-body transition-colors ${
                  active
                    ? "bg-gold/20 text-gold font-semibold"
                    : "text-cream/70 hover:text-cream hover:bg-white/5"
                }`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            );
          })}
          {role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-body font-medium text-amber bg-amber/10 hover:bg-amber/15 mt-3 border border-amber/20 transition-colors"
            >
              <span className="text-base">⚙️</span>
              Admin Portal
            </Link>
          )}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-navy-light/30">
          <Link href="/profile" className="flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity">
            <Avatar name={userName} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-body font-medium text-cream truncate">{userName}</p>
              <p className="text-xs text-gold font-body">{totalPoints.toLocaleString()} pts</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs text-cream/50 hover:text-cream font-body transition-colors"
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-navy flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2.5">
          <Logo size={28} />
          <h1 className="font-heading text-base text-gold font-bold">UCM Scribe</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gold font-body">{totalPoints} pts</span>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-cream p-1"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-navy pt-14">
          <nav className="px-4 py-4">
            {links.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 text-sm font-body ${
                  pathname === href ? "bg-gold/20 text-gold font-semibold" : "text-cream/70"
                }`}
              >
                <span>{icon}</span> {label}
              </Link>
            ))}
            {role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg mb-1 text-sm font-body text-amber border-t border-navy-light/30 pt-3 mt-2"
              >
                <span>⚙️</span> Admin Portal
              </Link>
            )}
            <div className="mt-6 pt-4 border-t border-navy-light/30 flex items-center justify-between">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Avatar name={userName} size="sm" />
                <span className="text-sm text-cream font-body">{userName}</span>
              </Link>
              <button onClick={handleLogout} className="text-sm text-cream/50 font-body">
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
