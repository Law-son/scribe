"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  CrossIcon,
  Sunrise,
  Quote,
  Megaphone,
  Users,
  Sprout,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const sections = [
  {
    label: "Overview",
    links: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    links: [
      { href: "/admin/sermons", label: "Sermons", icon: BookOpen },
      { href: "/admin/bible-study", label: "Bible Study", icon: CrossIcon },
      { href: "/admin/devotionals", label: "Devotionals", icon: Sunrise },
      { href: "/admin/quotes", label: "Quotes", icon: Quote },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  {
    label: "People",
    links: [
      { href: "/admin/users", label: "Members", icon: Users },
      { href: "/admin/evangelism", label: "Evangelism", icon: Sprout },
    ],
  },
  {
    label: "Analytics",
    links: [{ href: "/admin/reports", label: "Reports", icon: BarChart3 }],
  },
  {
    label: "System",
    links: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

interface AdminNavProps {
  userName: string;
}

export function AdminNav({ userName }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  const navContent = (
    <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide">
      {sections.map((section) => (
        <div key={section.label} className="mb-5">
          <p className="px-3 mb-1.5 text-[10px] font-body font-bold text-cream/30 uppercase tracking-widest">
            {section.label}
          </p>
          {section.links.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-body transition-all duration-150 ${
                  active
                    ? "bg-gold/15 text-gold font-semibold border border-gold/20"
                    : "text-cream/60 hover:text-cream hover:bg-white/5"
                }`}
              >
                <Icon
                  size={16}
                  strokeWidth={active ? 2.5 : 1.75}
                  className={active ? "text-gold" : "text-cream/50"}
                />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-[#0D1B2E] text-cream z-40 border-r border-white/5">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-body font-medium text-cream/60 hover:text-gold hover:bg-white/5 transition-colors mb-4 px-2 py-1 rounded-md -ml-2"
          >
            <ChevronLeft size={14} />
            Member View
          </Link>
          <div className="flex items-center gap-3">
            <Logo size={32} />
            <div>
              <p className="font-heading text-sm font-bold text-cream">Admin Portal</p>
              <p className="text-[10px] text-cream/40 font-body">UCM Scribe</p>
            </div>
          </div>
        </div>

        {navContent}

        {/* User footer */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-heading font-bold text-gold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-cream font-body font-medium truncate">{userName}</p>
              <p className="text-[10px] text-cream/40 font-body">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-cream/40 hover:text-cream font-body transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0D1B2E] flex items-center justify-between px-4 z-40 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <Logo size={28} />
          <span className="font-heading text-sm text-cream font-bold">Admin Portal</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-cream/70 hover:text-cream p-1.5 rounded-md hover:bg-white/10 transition-colors"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* ── Mobile drawer ── */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <div className="lg:hidden fixed top-0 left-0 bottom-0 w-72 z-50 bg-[#0D1B2E] flex flex-col border-r border-white/5">
            {/* Drawer header with close */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-gold/20 flex items-center justify-center">
                  <span className="text-gold text-[10px] font-heading font-bold">UC</span>
                </div>
                <span className="font-heading text-sm text-cream font-bold">Admin Portal</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-cream/50 hover:text-cream p-1.5 rounded-md hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {navContent}

            <div className="px-4 py-4 border-t border-white/5 space-y-3">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-xs text-cream/40 hover:text-cream font-body transition-colors"
              >
                <ChevronLeft size={13} />
                Member View
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center">
                  <span className="text-xs font-heading font-bold text-gold">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-cream font-body font-medium truncate">{userName}</p>
                  <p className="text-[10px] text-cream/40 font-body">Administrator</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs text-cream/40 hover:text-cream font-body transition-colors"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
