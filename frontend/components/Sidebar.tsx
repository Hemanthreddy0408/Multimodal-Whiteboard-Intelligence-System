"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Cpu, History, Settings, Zap, BarChart2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
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
      console.error("Error loading usage in sidebar:", e);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchUsage();
      window.addEventListener("usage-updated", fetchUsage);
      return () => {
        window.removeEventListener("usage-updated", fetchUsage);
      };
    }
  }, [status]);

  const userPlan = (session?.user as any)?.plan || "free";
  const userName = session?.user?.name || "User";
  const initials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase();

  const items = [
    { label: "Dashboard",  href: "/dashboard", icon: LayoutDashboard, color: "#8b5cf6" },
    { label: "Workspace",  href: "/",           icon: Cpu,             color: "#22d3ee" },
    { label: "History",    href: "/history",    icon: History,          color: "#10b981" },
    { label: "Settings",   href: "/settings",   icon: Settings,         color: "#f59e0b" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <aside
      className="w-60 border-r flex flex-col h-full flex-shrink-0 z-30 relative"
      style={{
        background: "rgba(6,6,17,0.7)",
        borderColor: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Decorative gradient top edge */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)" }}
      />

      {/* User Profile Section */}
      <div
        className="p-4 flex items-center gap-3 relative overflow-hidden"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        {/* Subtle glow behind avatar */}
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(139,92,246,0.15), transparent 70%)" }}
        />

        {/* Avatar */}
        <div
          className="relative w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #6366f1, #22d3ee)",
            backgroundSize: "200%",
            animation: "gradient-shift 5s ease infinite",
            boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
          }}
        >
          {initials}
          {/* Online indicator */}
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 flex items-center justify-center"
            style={{ background: "#10b981", borderColor: "rgba(6,6,17,0.9)" }}
          />
        </div>

        <div className="min-w-0 relative z-10">
          <p className="text-xs font-bold text-white truncate leading-tight">{userName}</p>
          <span
            className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-1 uppercase tracking-wider"
            style={
              userPlan === "free"
                ? { background: "rgba(255,255,255,0.06)", color: "#64748b", border: "1px solid rgba(255,255,255,0.08)" }
                : { background: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)" }
            }
          >
            {userPlan !== "free" && <Zap size={7} className="fill-current" />}
            {userPlan} Plan
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Section Label */}
        <p
          className="text-[9px] font-extrabold uppercase tracking-widest px-3 mb-3 mt-1"
          style={{ color: "rgba(100,116,139,0.6)" }}
        >
          Navigation
        </p>

        {items.map((item, i) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide relative overflow-hidden group"
              style={{
                color: active ? item.color : "rgba(100,116,139,0.9)",
                background: active ? `${item.color}15` : "transparent",
                border: `1px solid ${active ? `${item.color}25` : "transparent"}`,
                boxShadow: active ? `0 2px 16px ${item.color}18` : "none",
                transform: mounted ? "translateX(0)" : "translateX(-8px)",
                opacity: mounted ? 1 : 0,
                transition: `all 0.2s ease ${i * 0.05}s`,
              }}
            >
              {/* Active left bar */}
              {active && (
                <span
                  className="absolute left-0 top-[20%] bottom-[20%] w-0.5 rounded-r"
                  style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }}
                />
              )}

              {/* Icon with animated background */}
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={{
                  background: active ? `${item.color}22` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${active ? `${item.color}30` : "rgba(255,255,255,0.06)"}`,
                  color: active ? item.color : "inherit",
                }}
              >
                <item.icon size={13} />
              </span>

              <span>{item.label}</span>

              {/* Hover shimmer effect */}
              {!active && (
                <span
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                />
              )}
            </Link>
          );
        })}

        {/* Upgrade CTA */}
        {userPlan === "free" && (
          <Link
            href="/pricing"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold relative overflow-hidden group mt-4"
            style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(234,88,12,0.08))",
              border: "1px solid rgba(245,158,11,0.22)",
              color: "#fbbf24",
              transition: "all 0.2s ease",
            }}
          >
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.25)" }}
            >
              <Zap size={13} className="fill-current" />
            </span>
            Upgrade to Pro

            {/* Shimmer sweep */}
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.08), transparent)",
              }}
            />
          </Link>
        )}
      </nav>

      {/* Usage Meter */}
      <div
        className="p-4 space-y-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: "#64748b" }}>
            <BarChart2 size={11} style={{ color: "#8b5cf6" }} />
            Monthly Usage
          </span>
          <span className="text-[10px] font-bold" style={{ color: "var(--violet)" }}>{usage}/{limit === 99999 ? "∞" : limit}</span>
        </div>

        {/* Animated progress */}
        <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div
            className="h-full rounded-full relative overflow-hidden"
            style={{
              width: limit > 0 ? `${Math.min(100, (usage / limit) * 100)}%` : "0%",
              background: "linear-gradient(90deg, var(--indigo), var(--violet), var(--cyan))",
              backgroundSize: "200%",
              animation: "gradient-shift 3s ease infinite",
            }}
          >
            {/* Shine sweep */}
            <span
              className="absolute inset-0 opacity-60"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                animation: "shimmer 2s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        <p className="text-[9px] font-medium" style={{ color: "var(--text-3)" }}>
          {limit === 99999 ? "Unlimited analyses" : `${Math.max(0, limit - usage)} analyses remaining this cycle`}
        </p>
      </div>
    </aside>
  );
}
