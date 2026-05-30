"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  User, Key, Eye, Bell, CreditCard, AlertTriangle,
  Upload, Copy, Trash2, Check, Shield, Zap,
  Sun, Moon, Monitor, Lock
} from "lucide-react";
import { toast } from "react-hot-toast";

type Tab = "profile" | "keys" | "appearance" | "notifications" | "billing" | "danger";

const navItems: { id: Tab; label: string; icon: any; color: string }[] = [
  { id: "profile",       label: "Profile",       icon: User,          color: "#8b5cf6" },
  { id: "keys",          label: "API Keys",       icon: Key,           color: "#22d3ee" },
  { id: "appearance",    label: "Appearance",     icon: Eye,           color: "#10b981" },
  { id: "notifications", label: "Notifications",  icon: Bell,          color: "#f59e0b" },
  { id: "billing",       label: "Billing",        icon: CreditCard,    color: "#6366f1" },
  { id: "danger",        label: "Danger Zone",    icon: AlertTriangle, color: "#f87171" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [mounted, setMounted] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  // Profile
  const [name, setName] = useState(session?.user?.name || "John Doe");
  const [email] = useState(session?.user?.email || "john.doe@company.com");

  // API Keys
  const [apiKeys, setApiKeys] = useState<any[]>([
    { id: "1", name: "Production Compiler Head", created: "2026-05-10", lastUsed: "2026-05-28", hash: "wh_••••••••••••e42a" },
    { id: "2", name: "VS Code Extension Token",  created: "2026-05-18", lastUsed: "Never",      hash: "wh_••••••••••••d93b" },
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Appearance
  const [theme, setTheme] = useState("dark");
  const [codeTheme, setCodeTheme] = useState("vscDarkPlus");

  // Notifications
  const [notifs, setNotifs] = useState({ complete: true, weekly: false, updates: true });

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setAnimKey((k) => k + 1);
    setGeneratedKey(null);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile saved successfully!");
  };

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) { toast.error("Enter a name for the API key."); return; }
    const token = `wh_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setApiKeys((p) => [...p, {
      id: Math.random().toString(),
      name: newKeyName,
      created: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
      hash: `wh_••••••••••••${token.slice(-4)}`,
    }]);
    setGeneratedKey(token);
    setNewKeyName("");
    toast.success("API key generated!");
  };

  const handleCopyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopiedKey(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const activeNav = navItems.find((n) => n.id === activeTab);

  return (
    <div className="min-h-screen text-theme-primary flex flex-col font-sans overflow-hidden h-screen" style={{ background: "var(--bg)" }}>

      {/* Animated background orbs */}
      <div className="mesh-bg">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
      </div>

      <Navbar />

      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar />

        <main className="flex-grow overflow-y-auto">
          <div className="max-w-5xl mx-auto p-6 lg:p-8 flex gap-7 min-h-full">

            {/* ── Left sub-nav ── */}
            <aside className="w-52 flex-shrink-0 pt-1">
              <div className="sticky top-6">
                <p
                  className="text-[9px] font-extrabold uppercase tracking-widest px-3 mb-4"
                  style={{ color: "rgba(100,116,139,0.6)" }}
                >
                  Settings
                </p>
                <div className="space-y-1">
                  {navItems.map((item, i) => {
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => switchTab(item.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all relative group overflow-hidden"
                        style={{
                          color: active ? item.color : "#64748b",
                          background: active ? `${item.color}14` : "transparent",
                          border: `1px solid ${active ? `${item.color}28` : "transparent"}`,
                          boxShadow: active ? `0 2px 12px ${item.color}15` : "none",
                          transform: mounted ? "none" : "translateX(-8px)",
                          opacity: mounted ? 1 : 0,
                          animation: mounted ? `slide-right 0.35s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.04}s both` : "none",
                        }}
                      >
                        {/* Active bar */}
                        {active && (
                          <span
                            className="absolute left-0 top-[18%] bottom-[18%] w-0.5 rounded-r"
                            style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }}
                          />
                        )}

                        {/* Icon */}
                        <span
                          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            background: active ? `${item.color}20` : "rgba(255,255,255,0.05)",
                            color: active ? item.color : "#64748b",
                          }}
                        >
                          <item.icon size={12} />
                        </span>

                        {item.label}

                        {/* Hover overlay */}
                        {!active && (
                          <span className="absolute inset-0 rounded-xl bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* ── Content Panel ── */}
            <div className="flex-1 min-w-0">
              <div
                key={animKey}
                className="rounded-2xl p-7 slide-up"
                style={{
                  background: "rgba(12,12,26,0.7)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                }}
              >
                {/* Panel Header */}
                <div className="flex items-center gap-3 mb-6 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: `${activeNav?.color}18`,
                      border: `1px solid ${activeNav?.color}30`,
                      boxShadow: `0 0 20px ${activeNav?.color}15`,
                    }}
                  >
                    {activeNav && <activeNav.icon size={16} style={{ color: activeNav.color }} />}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: "#f1f5f9" }}>{activeNav?.label}</h2>
                    <p className="text-[10px] mt-0.5" style={{ color: "#475569" }}>
                      {activeTab === "profile" && "Manage your identity and avatar details"}
                      {activeTab === "keys" && "Authenticate requests programmatically"}
                      {activeTab === "appearance" && "Configure visual themes and preferences"}
                      {activeTab === "notifications" && "Manage email and system alerts"}
                      {activeTab === "billing" && "Manage plans and payment details"}
                      {activeTab === "danger" && "Irreversible destructive actions"}
                    </p>
                  </div>
                </div>

                {/* ═══ PROFILE ═══ */}
                {activeTab === "profile" && (
                  <form onSubmit={handleSaveProfile} className="space-y-6 fade-in">
                    {/* Avatar row */}
                    <div
                      className="flex items-center gap-4 p-4 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg text-white flex-shrink-0"
                        style={{
                          background: "linear-gradient(135deg, #7c3aed, #6366f1, #22d3ee)",
                          backgroundSize: "200%",
                          animation: "gradient-shift 4s ease infinite",
                          boxShadow: "0 6px 24px rgba(124,58,237,0.4)",
                        }}
                      >
                        {name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold" style={{ color: "#f1f5f9" }}>{name}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>{email}</p>
                      </div>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "#94a3b8",
                        }}
                      >
                        <Upload size={12} /> Change avatar
                      </button>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: "#475569" }}>
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="input w-full px-4 py-2.5 rounded-xl"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: "#475569" }}>
                          Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={email}
                            readOnly
                            className="input w-full px-4 py-2.5 rounded-xl cursor-not-allowed pr-10"
                            style={{ opacity: 0.6 }}
                          />
                          <Lock size={12} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#64748b" }} />
                        </div>
                        <p className="text-[9px] font-medium" style={{ color: "#475569" }}>
                          Email cannot be changed while a session is active
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="btn btn-primary px-5 py-2.5 rounded-xl text-xs"
                      >
                        Save changes
                      </button>
                    </div>
                  </form>
                )}

                {/* ═══ API KEYS ═══ */}
                {activeTab === "keys" && (
                  <div className="space-y-5 fade-in">
                    {/* Generate row */}
                    <div className="flex gap-2.5">
                      <input
                        type="text"
                        placeholder="Key name (e.g. VS Code Extension)"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleGenerateKey(); }}
                        className="input flex-1 px-4 py-2.5 rounded-xl text-xs"
                      />
                      <button
                        onClick={handleGenerateKey}
                        className="btn btn-primary px-4 py-2.5 rounded-xl text-xs flex-shrink-0"
                      >
                        <Key size={12} /> Generate key
                      </button>
                    </div>

                    {/* New key alert */}
                    {generatedKey && (
                      <div
                        className="rounded-xl p-4 space-y-3 scale-in"
                        style={{
                          background: "rgba(245,158,11,0.06)",
                          border: "1px solid rgba(245,158,11,0.22)",
                          boxShadow: "0 0 20px rgba(245,158,11,0.06)",
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={13} style={{ color: "#f59e0b" }} />
                          <span className="text-xs font-bold" style={{ color: "#fbbf24" }}>
                            Copy this key now — it won't be shown again!
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 p-3 rounded-xl"
                          style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <code className="flex-1 text-xs font-mono break-all select-all" style={{ color: "#e2e8f0" }}>
                            {generatedKey}
                          </code>
                          <button
                            onClick={handleCopyKey}
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:scale-110"
                            style={{
                              background: copiedKey ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)",
                              border: `1px solid ${copiedKey ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`,
                              color: copiedKey ? "#10b981" : "#94a3b8",
                            }}
                          >
                            {copiedKey ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Keys table */}
                    <div
                      className="rounded-xl overflow-hidden"
                      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <div
                        className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-0"
                        style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        {["Name", "Token", "Created", "Last Used", ""].map((h) => (
                          <div key={h} className="px-4 py-3 text-[9px] font-extrabold uppercase tracking-wider" style={{ color: "#475569" }}>
                            {h}
                          </div>
                        ))}
                      </div>
                      {apiKeys.map((k, i) => (
                        <div
                          key={k.id}
                          className="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center transition-all"
                          style={{
                            borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                          }}
                        >
                          <div className="px-4 py-3.5 text-xs font-bold" style={{ color: "#f1f5f9" }}>{k.name}</div>
                          <div className="px-4 py-3.5 font-mono text-[10px]" style={{ color: "#64748b" }}>{k.hash}</div>
                          <div className="px-4 py-3.5 text-[10px]" style={{ color: "#64748b" }}>{k.created}</div>
                          <div className="px-4 py-3.5 text-[10px]" style={{ color: "#64748b" }}>{k.lastUsed}</div>
                          <div className="px-4 py-3.5">
                            <button
                              onClick={() => { setApiKeys((p) => p.filter((x) => x.id !== k.id)); toast.success("Key revoked."); }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                              style={{ color: "#f87171", background: "rgba(248,113,113,0.08)" }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {apiKeys.length === 0 && (
                        <div className="py-8 text-center text-xs" style={{ color: "#64748b" }}>
                          No API keys yet. Generate one above.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ═══ APPEARANCE ═══ */}
                {activeTab === "appearance" && (
                  <div className="space-y-6 fade-in">
                    <div className="space-y-3">
                      <label className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: "#475569" }}>
                        Interface Theme
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: "light",  label: "Light",  icon: Sun,     preview: "#f4f6fb" },
                          { id: "dark",   label: "Dark",   icon: Moon,    preview: "#060611" },
                          { id: "system", label: "System", icon: Monitor, preview: "linear-gradient(to right, #f4f6fb 50%, #060611 50%)" },
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className="p-4 rounded-xl flex flex-col items-center gap-3 transition-all hover:scale-105 active:scale-95"
                            style={{
                              border: `1px solid ${theme === t.id ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.06)"}`,
                              background: theme === t.id ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.025)",
                              boxShadow: theme === t.id ? "0 4px 20px rgba(139,92,246,0.15)" : "none",
                            }}
                          >
                            <div
                              className="w-10 h-10 rounded-xl border"
                              style={{
                                background: t.preview,
                                borderColor: "rgba(255,255,255,0.1)",
                                boxShadow: theme === t.id ? "0 2px 8px rgba(139,92,246,0.3)" : "none",
                              }}
                            />
                            <span
                              className="text-xs font-bold capitalize"
                              style={{ color: theme === t.id ? "#a78bfa" : "#64748b" }}
                            >
                              {t.label}
                            </span>
                            {theme === t.id && (
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#8b5cf6", boxShadow: "0 0 6px #8b5cf6" }} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: "#475569" }}>
                        Code Editor Theme
                      </label>
                      <select
                        value={codeTheme}
                        onChange={(e) => setCodeTheme(e.target.value)}
                        className="input w-full px-4 py-2.5 rounded-xl text-xs"
                      >
                        <option value="vscDarkPlus">Visual Studio Dark+</option>
                        <option value="dracula">Dracula</option>
                        <option value="monokai">Monokai</option>
                        <option value="githubDark">GitHub Dark</option>
                        <option value="catppuccin">Catppuccin Mocha</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* ═══ NOTIFICATIONS ═══ */}
                {activeTab === "notifications" && (
                  <div className="space-y-4 fade-in">
                    {[
                      { id: "complete", label: "Analysis complete",   desc: "Get notified when a whiteboard analysis finishes processing." },
                      { id: "weekly",   label: "Weekly usage digest",  desc: "Receive a visual summary of your monthly analyses and usage trends." },
                      { id: "updates",  label: "Product changelog",    desc: "Stay informed on new features, patches, and IDE plugin updates." },
                    ].map((n) => {
                      const enabled = notifs[n.id as keyof typeof notifs];
                      return (
                        <div
                          key={n.id}
                          className="flex items-center justify-between p-4 rounded-xl transition-all"
                          style={{
                            background: "rgba(255,255,255,0.025)",
                            border: `1px solid ${enabled ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.06)"}`,
                          }}
                        >
                          <div className="space-y-0.5 flex-1 mr-4">
                            <p className="text-xs font-bold" style={{ color: enabled ? "#e2e8f0" : "#94a3b8" }}>{n.label}</p>
                            <p className="text-[10px] leading-relaxed" style={{ color: "#475569" }}>{n.desc}</p>
                          </div>
                          {/* Toggle */}
                          <button
                            onClick={() => setNotifs((p) => ({ ...p, [n.id]: !p[n.id as keyof typeof p] }))}
                            className="relative flex-shrink-0 transition-all"
                            style={{
                              width: 42,
                              height: 24,
                              borderRadius: 99,
                              background: enabled
                                ? "linear-gradient(135deg, #7c3aed, #8b5cf6)"
                                : "rgba(255,255,255,0.08)",
                              border: `1px solid ${enabled ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.1)"}`,
                              boxShadow: enabled ? "0 2px 12px rgba(139,92,246,0.3)" : "none",
                              transition: "all 0.25s ease",
                            }}
                          >
                            <span
                              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
                              style={{
                                left: enabled ? "calc(100% - 22px)" : "2px",
                                transition: "left 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                              }}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ═══ BILLING ═══ */}
                {activeTab === "billing" && (
                  <div className="space-y-5 fade-in">
                    {/* Plan card */}
                    <div
                      className="p-5 rounded-xl flex items-center justify-between gap-4 relative overflow-hidden"
                      style={{
                        background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(234,88,12,0.05))",
                        border: "1px solid rgba(245,158,11,0.22)",
                        boxShadow: "0 4px 24px rgba(245,158,11,0.06)",
                      }}
                    >
                      {/* Decorative orb */}
                      <div
                        className="absolute right-0 top-0 w-40 h-40 rounded-full opacity-20"
                        style={{
                          background: "radial-gradient(circle, rgba(245,158,11,0.4), transparent 70%)",
                          transform: "translate(30%, -30%)",
                          filter: "blur(20px)",
                        }}
                      />
                      <div className="relative z-10 space-y-2">
                        <span
                          className="inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest"
                          style={{ background: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)" }}
                        >
                          <Zap size={8} /> Active Plan
                        </span>
                        <h4 className="text-base font-black" style={{ color: "#f1f5f9" }}>Free Sandbox</h4>
                        <p className="text-[10px]" style={{ color: "#94a3b8" }}>50 analyses/month · No API keys · No priority processing</p>
                      </div>
                      <button
                        onClick={() => toast.success("Redirecting to Stripe...")}
                        className="btn px-4 py-2.5 rounded-xl text-xs font-bold text-white flex-shrink-0 relative z-10 transition-all hover:scale-105 active:scale-95"
                        style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", boxShadow: "0 4px 16px rgba(245,158,11,0.3)" }}
                      >
                        Upgrade Plan
                      </button>
                    </div>

                    {/* Usage meter */}
                    <div
                      className="p-4 rounded-xl space-y-3"
                      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#64748b" }}>Monthly Usage</span>
                        <span className="text-xs font-bold" style={{ color: "#f59e0b" }}>12 / 50</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: "24%",
                            background: "linear-gradient(90deg, #f59e0b, #fb923c)",
                            boxShadow: "0 0 10px rgba(245,158,11,0.4)",
                            transition: "width 1s ease",
                          }}
                        />
                      </div>
                      <p className="text-[9px]" style={{ color: "#475569" }}>38 analyses remaining this billing cycle</p>
                    </div>

                    {/* Invoice */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#475569" }}>Invoice History</h4>
                      <div
                        className="py-8 text-center rounded-xl"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.06)", color: "#475569", fontSize: 11 }}
                      >
                        No invoices on the Free Sandbox tier.
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ DANGER ZONE ═══ */}
                {activeTab === "danger" && (
                  <div className="space-y-4 fade-in">
                    <div
                      className="flex items-center gap-2 p-3 rounded-xl mb-2"
                      style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)" }}
                    >
                      <Shield size={13} style={{ color: "#f87171", flexShrink: 0 }} />
                      <p className="text-[10px] font-semibold" style={{ color: "#fca5a5" }}>
                        These actions are permanent and cannot be reversed.
                      </p>
                    </div>

                    {[
                      {
                        title: "Delete all sessions",
                        desc: "Permanently wipe all whiteboard capture sessions from the inference database.",
                        action: "Delete all sessions",
                        confirm: "Delete all whiteboard captures? This is irreversible.",
                        msg: "All session data wiped.",
                        variant: "ghost" as const,
                      },
                      {
                        title: "Delete account",
                        desc: "Permanently delete your user account, credentials, API keys, and all workspace data.",
                        action: "Delete account",
                        confirm: "This permanently deletes your account and ALL data. Are you absolutely sure?",
                        msg: "Account deleted.",
                        variant: "solid" as const,
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="flex items-center justify-between p-4 rounded-xl gap-4"
                        style={{
                          background: "rgba(248,113,113,0.04)",
                          border: "1px solid rgba(248,113,113,0.14)",
                        }}
                      >
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold" style={{ color: "#f1f5f9" }}>{item.title}</h4>
                          <p className="text-[10px] leading-relaxed" style={{ color: "#64748b" }}>{item.desc}</p>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm(item.confirm)) toast.success(item.msg);
                          }}
                          className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                          style={
                            item.variant === "solid"
                              ? {
                                  background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                                  color: "#fff",
                                  boxShadow: "0 4px 16px rgba(220,38,38,0.25)",
                                }
                              : {
                                  background: "rgba(248,113,113,0.08)",
                                  border: "1px solid rgba(248,113,113,0.22)",
                                  color: "#f87171",
                                }
                          }
                        >
                          {item.action}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
