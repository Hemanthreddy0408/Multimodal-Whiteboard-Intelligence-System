"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  Zap, Cpu, History, Upload, Edit3, Camera,
  ArrowRight, CheckCircle2, ChevronRight, BarChart2,
  Activity, Terminal, Sparkles, TrendingUp, Eye
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from "recharts";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const userName = session?.user?.name || "User";
  const firstName = userName.split(" ")[0];

  useEffect(() => { setMounted(true); }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/api/history`);
      if (res.ok) setItems(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [BACKEND]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // Use locale-safe date string to avoid hydration mismatch
  const [dateString, setDateString] = useState("");
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const now = new Date();
    const h = now.getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
    // Use en-US locale explicitly to match server rendering
    setDateString(now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
  }, []);

  const totalAnalyses = items.length;
  const monthAnalyses = items.filter((i) => {
    const d = new Date(i.created_at || i.timestamp);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const getMostUsedLang = () => {
    if (!items.length) return "Python";
    const counts: Record<string, number> = {};
    items.forEach((i) => { const l = (i.languages?.[0]) || "python"; counts[l] = (counts[l] || 0) + 1; });
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, "Python");
  };

  const getAvgConfidence = () => {
    if (!items.length) return 88;
    return Math.round(items.reduce((acc, i) => acc + (i.confidence || 0.85), 0) / items.length * 100);
  };

  const chartData = (() => {
    const now = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - i));
      const count = items.filter((item) => {
        const id = new Date(item.created_at || item.timestamp);
        return id.getDate() === d.getDate() && id.getMonth() === d.getMonth();
      }).length;
      return { date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), count };
    });
  })();

  const getBadgeStyle = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("tree") || t.includes("bst")) return { bg: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "rgba(139,92,246,0.25)" };
    if (t.includes("flow") || t.includes("graph"))  return { bg: "rgba(34,211,238,0.12)",  color: "#67e8f9", border: "rgba(34,211,238,0.25)" };
    if (t.includes("list"))                         return { bg: "rgba(245,158,11,0.12)",  color: "#fcd34d", border: "rgba(245,158,11,0.25)" };
    return { bg: "rgba(100,116,139,0.12)", color: "#94a3b8", border: "rgba(100,116,139,0.2)" };
  };

  const stats = [
    { label: "Total Analyses", val: totalAnalyses, sub: "all time", icon: Cpu,          color: "#8b5cf6", trend: "+3 this week",    trendUp: true },
    { label: "This Month",     val: monthAnalyses,  sub: "billing cycle",  icon: Activity,      color: "#22d3ee", trend: "+2 this week",    trendUp: true },
    { label: "Top Language",   val: getMostUsedLang(), sub: "auto-detected", icon: Terminal,      color: "#f59e0b", trend: "Most used",        trendUp: null },
    { label: "Avg Confidence", val: `${getAvgConfidence()}%`, sub: "DINOv2 model",  icon: CheckCircle2,  color: "#10b981", trend: "High accuracy",    trendUp: true },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-hidden h-screen" style={{ background: "var(--bg)" }}>

      {/* Background */}
      <div className="mesh-bg">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
      </div>

      <Navbar />

      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar />

        <main className="flex-grow overflow-y-auto p-6 space-y-6">

          {/* ── Welcome Banner ── */}
          <div
            className="relative rounded-2xl p-6 overflow-hidden slide-up"
            style={{
              background: "linear-gradient(135deg, rgba(12,12,26,0.9), rgba(20,14,40,0.8))",
              border: "1px solid rgba(139,92,246,0.2)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(139,92,246,0.08)",
            }}
          >
            {/* Decorative gradient blob */}
            <div
              className="absolute right-0 top-0 w-72 h-40 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.25), rgba(99,102,241,0.1) 50%, transparent 80%)",
                filter: "blur(20px)",
              }}
            />
            {/* Top edge glow */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), rgba(34,211,238,0.4), transparent)" }}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} style={{ color: "#a78bfa" }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#64748b" }} suppressHydrationWarning>
                    {dateString}
                  </span>
                </div>
                <h1 className="text-xl font-black tracking-tight" style={{ color: "#f1f5f9" }} suppressHydrationWarning>
                  {greeting},{" "}
                  <span
                    style={{
                      background: "linear-gradient(135deg, #818cf8, #a78bfa, #22d3ee)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {firstName}
                  </span>
                </h1>
                <p className="text-xs font-medium" style={{ color: "#64748b" }}>
                  {totalAnalyses > 0
                    ? `You've run ${totalAnalyses} total analyses. Keep going!`
                    : "Upload a diagram to begin your first analysis."}
                </p>
              </div>

              <Link
                href="/"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
                  boxShadow: "0 6px 24px rgba(124,58,237,0.4)",
                }}
              >
                Analyze diagram <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="stat-card p-5 rounded-2xl space-y-3 cursor-default"
                style={{
                  background: "rgba(12,12,26,0.7)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  backdropFilter: "blur(12px)",
                  animation: `slide-up 0.4s cubic-bezier(0.34,1.56,0.64,1) ${0.05 + i * 0.07}s both`,
                }}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#475569" }}>
                    {stat.label}
                  </span>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}
                  >
                    <stat.icon size={13} style={{ color: stat.color }} />
                  </div>
                </div>
                <div>
                  <p
                    className="text-2xl font-black tracking-tight count-up"
                    style={{ color: "#f1f5f9" }}
                  >
                    {stat.val}
                  </p>
                  <p className="text-[9px] mt-1 font-semibold" style={{ color: "#334155" }}>{stat.sub}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {stat.trendUp !== null && (
                    <TrendingUp size={9} style={{ color: stat.trendUp ? "#10b981" : "#f87171" }} />
                  )}
                  <span className="text-[9px] font-bold" style={{ color: stat.trendUp ? "#10b981" : stat.trendUp === false ? "#f87171" : "#64748b" }}>
                    {stat.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Chart + Quick Actions ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Activity Chart */}
            <div
              className="lg:col-span-2 p-5 rounded-2xl space-y-4"
              style={{
                background: "rgba(12,12,26,0.7)",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(12px)",
                animation: "slide-up 0.4s ease 0.3s both",
              }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}
                  >
                    <BarChart2 size={13} style={{ color: "#8b5cf6" }} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold" style={{ color: "#f1f5f9" }}>Activity Overview</h3>
                    <p className="text-[9px]" style={{ color: "#475569" }}>Last 30 days ingestion</p>
                  </div>
                </div>
                <span
                  className="text-[9px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
                >
                  Live
                </span>
              </div>

              <div className="h-52" style={{ minWidth: 0, width: "100%" }}>
                {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" stroke="#334155" fontSize={8} tickLine={false} axisLine={false} />
                    <YAxis stroke="#334155" fontSize={8} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10,10,20,0.95)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 12,
                        fontSize: 10,
                        backdropFilter: "blur(12px)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                      }}
                      labelStyle={{ color: "#f1f5f9", fontWeight: "bold" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fill="url(#areaGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: "#8b5cf6", stroke: "#c4b5fd", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div
              className="p-5 rounded-2xl flex flex-col gap-4"
              style={{
                background: "rgba(12,12,26,0.7)",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(12px)",
                animation: "slide-up 0.4s ease 0.38s both",
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.2)" }}
                >
                  <Zap size={13} style={{ color: "#22d3ee" }} />
                </div>
                <div>
                  <h3 className="text-xs font-bold" style={{ color: "#f1f5f9" }}>Quick Launch</h3>
                  <p className="text-[9px]" style={{ color: "#475569" }}>Jump straight into workspace</p>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                {[
                  { href: "/?tab=upload",     icon: Upload, label: "Upload image file",    sub: "PNG, JPG, WebP",   color: "#8b5cf6" },
                  { href: "/?tab=whiteboard", icon: Edit3,  label: "Live draw board",      sub: "Canvas + AI",      color: "#22d3ee" },
                  { href: "/?tab=webcam",     icon: Camera, label: "Capture with webcam",  sub: "Real-time snap",   color: "#f59e0b" },
                ].map((item, i) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-xl group transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      animation: `slide-right 0.3s ease ${0.4 + i * 0.06}s both`,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
                      style={{ background: `${item.color}15`, border: `1px solid ${item.color}25`, color: item.color }}
                    >
                      <item.icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: "#e2e8f0" }}>{item.label}</p>
                      <p className="text-[9px]" style={{ color: "#475569" }}>{item.sub}</p>
                    </div>
                    <ChevronRight
                      size={12}
                      className="transition-all group-hover:translate-x-1"
                      style={{ color: "#334155" }}
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Recent Sessions ── */}
          <div className="space-y-4" style={{ animation: "slide-up 0.4s ease 0.45s both" }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <History size={13} style={{ color: "#8b5cf6" }} />
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#64748b" }}>
                  Recent Sessions
                </h3>
              </div>
              <Link
                href="/history"
                className="flex items-center gap-1 text-[10px] font-bold transition-all hover:gap-2"
                style={{ color: "#8b5cf6" }}
              >
                View all <ChevronRight size={11} />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-36 rounded-2xl shimmer-wrapper"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div
                className="py-12 rounded-2xl text-center"
                style={{
                  border: "2px dashed rgba(255,255,255,0.07)",
                  background: "rgba(255,255,255,0.01)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center float"
                  style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}
                >
                  <Cpu size={20} style={{ color: "#8b5cf6" }} />
                </div>
                <p className="text-xs font-semibold" style={{ color: "#64748b" }}>No sessions yet</p>
                <p className="text-[10px] mt-1" style={{ color: "#334155" }}>
                  Draw or upload a whiteboard diagram to get started
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {items.slice(0, 4).map((item, idx) => {
                  const badge = getBadgeStyle(item.diagram_type);
                  return (
                    <Link
                      key={item.inference_id || idx}
                      href={`/?restore=${item.inference_id}`}
                      className="group relative rounded-2xl p-4 flex flex-col justify-between overflow-hidden transition-all hover:scale-[1.03] active:scale-[0.98]"
                      style={{
                        background: "rgba(12,12,26,0.8)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        backdropFilter: "blur(10px)",
                        minHeight: 140,
                        animation: `slide-up 0.35s ease ${0.5 + idx * 0.07}s both`,
                      }}
                    >
                      {/* Hover glow */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.12), transparent 70%)" }}
                      />

                      {/* Top row */}
                      <div className="flex justify-between items-start relative z-10">
                        <span
                          className="px-2.5 py-1 rounded-full text-[9px] font-bold capitalize"
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          {item.diagram_type || "diagram"}
                        </span>
                        <span className="text-[9px] font-semibold" style={{ color: "#334155" }}>
                          {new Date(item.created_at || item.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>

                      {/* Content */}
                      <p className="text-[10px] font-mono line-clamp-2 relative z-10 flex-1 my-2" style={{ color: "#64748b" }}>
                        {item.ocr_text || "No text captured"}
                      </p>

                      {/* Bottom row */}
                      <div className="flex justify-between items-center relative z-10" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10 }}>
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-md"
                          style={{ background: "rgba(255,255,255,0.05)", color: "#64748b" }}
                        >
                          {item.languages?.[0] || "python"}
                        </span>
                        <span className="text-[10px] font-black" style={{ color: "#10b981" }}>
                          {Math.round((item.confidence || 0.85) * 100)}%
                        </span>
                      </div>

                      {/* Hover overlay CTA */}
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-2xl"
                        style={{ background: "rgba(6,6,17,0.88)", backdropFilter: "blur(4px)" }}
                      >
                        <span
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold scale-in"
                          style={{
                            background: "rgba(139,92,246,0.15)",
                            border: "1px solid rgba(139,92,246,0.3)",
                            color: "#a78bfa",
                            boxShadow: "0 4px 16px rgba(139,92,246,0.2)",
                          }}
                        >
                          <Eye size={12} /> Restore Workspace
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}
