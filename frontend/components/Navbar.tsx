"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Zap, Bell, User, LogOut, Settings, CreditCard, LayoutDashboard, Cpu, History, Menu, X, ChevronDown, Keyboard, Sun, Moon } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const activeTheme = (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "dark";
    setTheme(activeTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const isActive = (path: string) => pathname === path;

  const publicLinks = [
    { label: "Features", href: "/landing#features" },
    { label: "How it Works", href: "/about" },
    { label: "Pricing", href: "/pricing" }
  ];

  const authLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Workspace", href: "/", icon: Cpu },
    { label: "History", href: "/history", icon: History },
    { label: "Settings", href: "/settings", icon: Settings }
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#1E1E2E] bg-[#0A0A0F]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href={session ? "/dashboard" : "/landing"} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] shadow-md shadow-[#7C3AED]/20">
                <Zap size={16} className="text-white fill-white/10" />
              </div>
              <span className="font-bold text-sm text-slate-100 tracking-tight">
                Whiteboard<span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {status === "authenticated" ? (
              // Authenticated links
              authLinks.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-1.5 text-xs font-semibold tracking-wide transition-all ${
                    isActive(l.href) 
                      ? "text-[#7C3AED]" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <l.icon size={13} />
                  {l.label}
                </Link>
              ))
            ) : (
              // Public links
              publicLinks.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
                >
                  {l.label}
                </Link>
              ))
            )}
          </div>

          {/* Right Action side */}
          <div className="hidden md:flex items-center gap-4">
            {status === "authenticated" ? (
              <div className="flex items-center gap-4">
                
                {/* Usage Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-slate-300">
                  <Zap size={10} className="text-amber-400" />
                  <span>12 / 50 analyses this month</span>
                </div>

                {/* Theme Toggle */}
                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all"
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                </button>

                {/* Notifications */}
                <button className="relative p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all">
                  <Bell size={16} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-slate-900" />
                </button>

                {/* Avatar User Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setUserDropdownOpen(p => !p)}
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-400">
                      {session.user?.name ? session.user.name.split(" ").map(n => n[0]).join("") : "U"}
                    </div>
                    <ChevronDown size={12} className="text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#1E1E2E] bg-[#13131A] p-1 shadow-2xl z-50">
                      <div className="px-3 py-2 border-b border-[#1E1E2E]">
                        <p className="text-xs font-bold text-slate-100">{session.user?.name || "User"}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{session.user?.email || ""}</p>
                      </div>
                      
                      <div className="p-1 space-y-0.5">
                        <Link 
                          href="/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-slate-100 hover:bg-white/5 transition-all"
                        >
                          <span className="flex items-center gap-2"><LayoutDashboard size={13} /> Dashboard</span>
                          <span className="text-[9px] text-slate-500"><Keyboard size={10} className="inline mr-1" />⌘D</span>
                        </Link>
                        <Link 
                          href="/settings"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-slate-100 hover:bg-white/5 transition-all"
                        >
                          <span className="flex items-center gap-2"><Settings size={13} /> Settings</span>
                          <span className="text-[9px] text-slate-500"><Keyboard size={10} className="inline mr-1" />⌘S</span>
                        </Link>
                        <Link 
                          href="/settings?tab=billing"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-slate-100 hover:bg-white/5 transition-all"
                        >
                          <span className="flex items-center gap-2"><CreditCard size={13} /> Billing</span>
                          <span className="text-[9px] text-slate-500"><Keyboard size={10} className="inline mr-1" />⌘B</span>
                        </Link>
                      </div>

                      <div className="p-1 border-t border-[#1E1E2E]">
                        <button
                          onClick={() => { setUserDropdownOpen(false); signOut({ callbackUrl: "/landing" }); }}
                          className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-all font-semibold"
                        >
                          <LogOut size={13} />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              // Public buttons
              <div className="flex items-center gap-3">
                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-all"
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                </button>
                <Link href="/login" className="btn border border-theme bg-transparent text-xs font-semibold px-4 py-2 hover:bg-white/5 rounded-xl">
                  Log in
                </Link>
                <Link href="/register" className="btn bg-gradient-to-tr from-[#7C3AED] to-[#8B5CF6] text-white text-xs font-semibold px-4 py-2 shadow-lg shadow-[#7C3AED]/20 hover:shadow-indigo-500/30 rounded-xl">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger Menu (Mobile) */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(p => !p)}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#1E1E2E] bg-[#0A0A0F] px-4 py-4 space-y-3">
          {status === "authenticated" ? (
            authLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${
                  isActive(l.href) ? "bg-[#7C3AED]/10 text-[#7C3AED]" : "text-slate-400"
                }`}
              >
                <l.icon size={15} />
                {l.label}
              </Link>
            ))
          ) : (
            publicLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200"
              >
                {l.label}
              </Link>
            ))
          )}
          
          <div className="border-t border-[#1E1E2E] pt-3">
            {status === "authenticated" ? (
              <button
                onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: "/landing" }); }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 font-semibold"
              >
                <LogOut size={15} /> Sign out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="btn text-center border border-[#1E1E2E] py-2.5 rounded-xl text-xs font-semibold">
                  Log in
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="btn text-center bg-[#7C3AED] py-2.5 rounded-xl text-xs font-semibold text-white">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
