"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Zap, Bell, LogOut, Settings, CreditCard,
  LayoutDashboard, Cpu, History, Menu, X,
  ChevronDown, Sun, Moon, Keyboard
} from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [usage, setUsage] = useState<number>(0);
  const [limit, setLimit] = useState<number>(50);

  const fetchUsage = async () => {
    try {
      const res = await fetch("/api/user/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage ?? 0);
        setLimit(data.limit ?? 50);
      }
    } catch (e) {
      console.error("Error loading usage in navbar:", e);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchUsage();
      window.addEventListener("usage-updated", fetchUsage);
      return () => {
        window.removeEventListener("usage-updated", fetchUsage);
      };
    }
  }, [status]);

  useEffect(() => {
    const activeTheme = (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "dark";
    setTheme(activeTheme);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const isActive = (path: string) => pathname === path;

  const authLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Workspace",  href: "/",          icon: Cpu },
    { label: "History",   href: "/history",   icon: History },
    { label: "Settings",  href: "/settings",  icon: Settings },
  ];

  const publicLinks = [
    { label: "Features",     href: "/landing#features" },
    { label: "How it Works", href: "/about" },
    { label: "Pricing",      href: "/pricing" },
  ];

  const userName = session?.user?.name || "User";
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase();

  return (
    <nav
      className="sticky top-0 z-50 w-full transition-all duration-300"
      style={{
        background: scrolled
          ? "var(--bg-2)"
          : "transparent",
        borderBottom: scrolled ? "1px solid var(--card-border)" : "1px solid transparent",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.06)" : "none",
      }}
    >
      {/* Animated top edge line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.5) 30%, rgba(139,92,246,0.8) 50%, rgba(34,211,238,0.5) 70%, transparent 100%)",
          backgroundSize: "200%",
          animation: "gradient-shift 4s ease infinite",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">

          {/* Logo */}
          <Link
            href={session ? "/dashboard" : "/landing"}
            className="flex items-center gap-2.5 group"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center relative"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #6366f1, #22d3ee)",
                backgroundSize: "200%",
                animation: "gradient-shift 4s ease infinite",
                boxShadow: "0 4px 20px rgba(124,58,237,0.45)",
              }}
            >
              <Zap size={15} className="text-white" fill="rgba(255,255,255,0.3)" />
              {/* Pulse ring */}
              <span
                className="absolute inset-0 rounded-xl"
                style={{
                  background: "inherit",
                  animation: "pulse-ring 2.5s ease-out infinite",
                  opacity: 0.4,
                }}
              />
            </div>
            <span
              className="font-black text-sm tracking-tight"
              style={{ color: "var(--text-1)" }}
            >
              Whiteboard
              <span
                style={{
                  background: "linear-gradient(90deg, var(--indigo), var(--cyan))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                AI
              </span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {status === "authenticated" ? (
              authLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative group"
                  style={{
                    color: isActive(l.href) ? "var(--violet)" : "var(--text-3)",
                    background: isActive(l.href) ? "rgba(var(--violet-rgb), 0.1)" : "transparent",
                  }}
                >
                  <l.icon size={12} />
                  {l.label}
                  {isActive(l.href) && (
                    <span
                      className="absolute bottom-0 left-3 right-3 h-px rounded-full"
                      style={{ background: "linear-gradient(90deg, var(--violet), var(--cyan))" }}
                    />
                  )}
                  {/* Hover bg */}
                  <span
                    className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "var(--card-hover)" }}
                  />
                </Link>
              ))
            ) : (
              publicLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:text-[var(--text-1)]"
                  style={{ color: "var(--text-3)" }}
                >
                  {l.label}
                </Link>
              ))
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            {status === "authenticated" ? (
              <>
                {/* Usage pill */}
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--card-border)",
                    color: "var(--text-2)",
                  }}
                >
                  <Zap size={9} style={{ color: "var(--amber)" }} />
                  {usage} / {limit === 99999 ? "∞" : limit} analyses
                </div>

                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  style={{
                    color: "var(--text-3)",
                    background: "var(--card)",
                    border: "1px solid var(--card-border)",
                  }}
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
                </button>

                {/* Bell */}
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all relative hover:scale-110 active:scale-95"
                  style={{
                    color: "var(--text-3)",
                    background: "var(--card)",
                    border: "1px solid var(--card-border)",
                  }}
                >
                  <Bell size={14} />
                  <span
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--cyan)", boxShadow: "0 0 6px var(--cyan)" }}
                  />
                </button>

                {/* Avatar dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen((p) => !p)}
                    className="flex items-center gap-2 p-1 rounded-xl transition-all hover:scale-105 active:scale-95"
                    style={{ border: "1px solid var(--card-border)" }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
                      style={{
                        background: "linear-gradient(135deg, var(--violet), var(--indigo))",
                        boxShadow: "0 2px 10px rgba(var(--violet-rgb), 0.3)",
                      }}
                    >
                      {initials}
                    </div>
                    <ChevronDown
                      size={11}
                      style={{
                        color: "var(--text-3)",
                        transform: userDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    />
                  </button>

                  {/* Dropdown */}
                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-2xl p-1 shadow-2xl scale-in"
                      style={{
                        background: "var(--bg-2)",
                        border: "1px solid var(--card-border)",
                        backdropFilter: "blur(20px)",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(var(--violet-rgb), 0.05)",
                      }}
                    >
                      {/* User info */}
                      <div
                        className="px-3 py-2.5 mb-1 rounded-xl"
                        style={{ background: "var(--card)" }}
                      >
                        <p className="text-xs font-bold text-theme-primary">{session?.user?.name || "User"}</p>
                        <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-3)" }}>{session?.user?.email || ""}</p>
                      </div>

                      <div className="space-y-0.5 p-0.5">
                        {[
                          { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", key: "⌘D" },
                          { href: "/settings",  icon: Settings,        label: "Settings",  key: "⌘S" },
                          { href: "/settings?tab=billing", icon: CreditCard, label: "Billing", key: "⌘B" },
                        ].map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all group"
                            style={{ color: "var(--text-2)" }}
                          >
                            <span className="flex items-center gap-2 group-hover:text-theme-primary transition-colors">
                              <item.icon size={12} />
                              {item.label}
                            </span>
                            <span className="text-[9px] font-mono text-theme-muted">{item.key}</span>
                          </Link>
                        ))}
                      </div>

                      <div className="mt-1 p-0.5" style={{ borderTop: "1px solid var(--card-border)" }}>
                        <button
                          onClick={() => { setUserDropdownOpen(false); signOut({ callbackUrl: "/landing" }); }}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-red-500/10"
                          style={{ color: "var(--red)" }}
                        >
                          <LogOut size={12} />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleTheme} 
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95" 
                  style={{ color: "var(--text-3)", background: "var(--card)", border: "1px solid var(--card-border)" }}
                >
                  {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
                </button>
                <Link
                  href="/login"
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all hover:text-[var(--text-1)] border border-theme"
                  style={{
                    color: "var(--text-2)",
                    background: "var(--card)",
                  }}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-black transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, var(--indigo), var(--violet))",
                    boxShadow: "0 4px 16px rgba(var(--indigo-rgb), 0.3)",
                  }}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
            style={{ color: "var(--text-3)", background: "var(--card)", border: "1px solid var(--card-border)" }}
            onClick={() => setMobileMenuOpen((p) => !p)}
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden px-4 py-4 space-y-2 slide-up"
          style={{
            borderTop: "1px solid var(--card-border)",
            background: "var(--bg-2)",
          }}
        >
          {status === "authenticated" ? (
            authLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  color: isActive(l.href) ? "var(--violet)" : "var(--text-3)",
                  background: isActive(l.href) ? "rgba(var(--violet-rgb), 0.1)" : "transparent",
                }}
              >
                <l.icon size={14} />
                {l.label}
              </Link>
            ))
          ) : (
            publicLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-semibold transition-colors hover:text-[var(--text-1)]"
                style={{ color: "var(--text-3)" }}
              >
                {l.label}
              </Link>
            ))
          )}

          <div className="pt-3" style={{ borderTop: "1px solid var(--card-border)" }}>
            {status === "authenticated" ? (
              <button
                onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: "/landing" }); }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold"
                style={{ color: "#f87171" }}
              >
                <LogOut size={14} /> Sign out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="btn text-center py-2.5 rounded-xl text-xs font-semibold" style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}>Log in</Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="btn text-center py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}>Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
