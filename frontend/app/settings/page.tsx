"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { 
  User, Key, Eye, Bell, CreditCard, AlertTriangle, 
  Upload, Copy, Trash2, EyeOff, Check, CheckCircle2, Shield
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile State
  const [name, setName] = useState(session?.user?.name || "John Doe");
  const [email] = useState(session?.user?.email || "john.doe@company.com");

  // API Key State
  const [apiKeys, setApiKeys] = useState<any[]>([
    { id: "1", name: "Production Compiler Head", created: "2026-05-10", lastUsed: "2026-05-28", hash: "wh_••••••••••••e42a" },
    { id: "2", name: "VS Code Extension Token", created: "2026-05-18", lastUsed: "Never", hash: "wh_••••••••••••d93b" }
  ]);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  // Appearance State
  const [theme, setTheme] = useState("dark");
  const [codeTheme, setCodeTheme] = useState("vscDarkPlus");

  // Notification State
  const [notifs, setNotifs] = useState({
    complete: true,
    weekly: false,
    updates: true
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile changes saved successfully.");
  };

  const handleGenerateKey = () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key.");
      return;
    }
    const token = `wh_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const newKey = {
      id: Math.random().toString(),
      name: newKeyName,
      created: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
      hash: `wh_••••••••••••${token.substring(token.length - 4)}`
    };
    setApiKeys(prev => [...prev, newKey]);
    setGeneratedKey(token);
    setNewKeyName("");
    toast.success("API key generated successfully.");
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
    toast.success("API key has been revoked.");
  };

  const handleCopyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      toast.success("API key copied to clipboard!");
    }
  };

  const navs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "keys", label: "API Keys", icon: Key },
    { id: "appearance", label: "Appearance", icon: Eye },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle }
  ];

  return (
    <div className="min-h-screen bg-theme-bg text-theme-primary flex flex-col font-sans overflow-hidden h-screen">
      
      {/* Navbar */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-grow p-6 overflow-y-auto flex gap-8">
          
          {/* Sub Navigation Sidebar */}
          <div className="w-48 flex-shrink-0 flex flex-col gap-1">
            <h2 className="text-sm font-extrabold text-theme-secondary uppercase tracking-widest px-3 mb-3">Settings</h2>
            {navs.map(nav => (
              <button
                key={nav.id}
                onClick={() => { setActiveTab(nav.id); setGeneratedKey(null); }}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                  activeTab === nav.id 
                    ? "bg-[#7C3AED]/15 text-[#7C3AED]" 
                    : "text-theme-secondary hover:text-theme-primary hover:bg-white/5"
                }`}
              >
                <nav.icon size={13} />
                {nav.label}
              </button>
            ))}
          </div>

          {/* Form Content Area */}
          <div className="flex-1 max-w-2xl bg-theme-panel border border-theme rounded-2xl p-8 h-fit shadow-xl">
            
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-theme-primary">User Profile</h3>
                  <p className="text-[10px] text-theme-muted">Manage your avatar and identity details.</p>
                </div>

                <div className="flex items-center gap-4 border-b border-theme pb-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] flex items-center justify-center font-bold text-lg text-white">
                    {name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <button type="button" className="btn border border-theme bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <Upload size={12} /> Upload avatar
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)}
                      className="input w-full px-3.5 py-2.5 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      value={email} 
                      readOnly
                      className="input w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-800/40 text-slate-400 border-dashed cursor-not-allowed"
                    />
                    <p className="text-[9px] text-slate-500 font-semibold">Account email cannot be modified while authentication session is active.</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1E1E2E]">
                  <button type="submit" className="btn bg-[#7C3AED] hover:brightness-110 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-[#7C3AED]/20">
                    Save changes
                  </button>
                </div>
              </form>
            )}

            {activeTab === "keys" && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-100">Your API Keys</h3>
                  <p className="text-[10px] text-slate-500">Authenticate requests programmatically from external IDE plugins or scripts.</p>
                </div>

                {/* Key generation input */}
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="API Key Name (e.g. VS Code Token)"
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    className="input flex-grow px-3.5 py-2 text-xs rounded-xl"
                  />
                  <button 
                    onClick={handleGenerateKey}
                    className="btn bg-[#7C3AED] hover:brightness-110 text-white font-bold text-xs px-4 py-2 rounded-xl flex-shrink-0"
                  >
                    Generate new key
                  </button>
                </div>

                {/* Newly generated display key warning */}
                {generatedKey && (
                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                      <AlertTriangle size={14} /> Make sure to copy this key now!
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">For security purposes, you will not be able to view this token again after closing this settings pane.</p>
                    <div className="flex gap-2 bg-theme-bg border border-theme p-2 rounded-lg items-center">
                      <code className="text-xs text-theme-primary font-mono flex-grow select-all break-all">{generatedKey}</code>
                      <button onClick={handleCopyKey} className="p-1.5 rounded hover:bg-white/5 text-theme-secondary hover:text-theme-primary">
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Keys list */}
                <div className="border border-theme rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-theme">
                        <th className="px-4 py-3 font-bold text-theme-secondary uppercase tracking-wider text-[9px]">Name</th>
                        <th className="px-4 py-3 font-bold text-theme-secondary uppercase tracking-wider text-[9px]">Token Hash</th>
                        <th className="px-4 py-3 font-bold text-theme-secondary uppercase tracking-wider text-[9px]">Created</th>
                        <th className="px-4 py-3 font-bold text-theme-secondary uppercase tracking-wider text-[9px]">Last Used</th>
                        <th className="px-4 py-3 font-bold text-theme-secondary uppercase tracking-wider text-[9px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme">
                      {apiKeys.map(k => (
                        <tr key={k.id} className="hover:bg-white/5 transition-all">
                          <td className="px-4 py-3 font-bold text-theme-primary">{k.name}</td>
                          <td className="px-4 py-3 font-mono text-theme-secondary text-[10px]">{k.hash}</td>
                          <td className="px-4 py-3 text-theme-secondary">{k.created}</td>
                          <td className="px-4 py-3 text-theme-secondary">{k.lastUsed}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => handleRevokeKey(k.id)} className="p-1 rounded hover:bg-red-500/10 text-red-400">
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-100">Appearance Settings</h3>
                  <p className="text-[10px] text-slate-500">Configure visual themes and default languages preferences.</p>
                </div>

                <div className="space-y-4">
                  {/* Theme toggler mockup */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-theme-secondary uppercase tracking-wider">Interface Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {["light", "dark", "system"].map(t => (
                        <button 
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center gap-2 transition-all capitalize text-xs font-semibold ${
                            theme === t 
                              ? "border-[#7C3AED] bg-[#7C3AED]/5 text-theme-primary" 
                              : "border-theme bg-white/5 text-theme-secondary hover:text-theme-primary"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg ${t === "light" ? "bg-white border border-slate-200" : t === "dark" ? "bg-theme-bg" : "bg-gradient-to-r from-white to-[#0A0A0F]"} border border-theme/5`} />
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Code editor theme */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workspace Code Theme</label>
                    <select 
                      value={codeTheme} 
                      onChange={e => setCodeTheme(e.target.value)}
                      className="input w-full px-3 py-2 text-xs rounded-xl"
                    >
                      <option value="vscDarkPlus">Visual Studio Dark Plus</option>
                      <option value="dracula">Dracula</option>
                      <option value="monokai">Monokai</option>
                      <option value="githubDark">GitHub Dark</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-theme-primary">Notification Preferences</h3>
                  <p className="text-[10px] text-theme-muted">Decide which system updates and transaction alerts are sent to your mailbox.</p>
                </div>

                <div className="space-y-4">
                  {[
                    { id: "complete", label: "Email on analysis complete", desc: "Get an email containing the code outputs and explanation link whenever an analysis finishes." },
                    { id: "weekly", label: "Weekly usage summary", desc: "Receive a visual overview of compile attempts, diagrams solved, and usage meters." },
                    { id: "updates", label: "Product updates and changelog", desc: "Receive brief messages detailing feature updates, releases, and IDE patches." }
                  ].map(n => (
                    <div key={n.id} className="flex items-start justify-between p-4 rounded-xl border border-theme bg-white/5">
                      <div className="space-y-1 max-w-[80%]">
                        <label className="block text-xs font-bold text-theme-primary leading-tight">{n.label}</label>
                        <p className="text-[10px] text-theme-secondary leading-relaxed">{n.desc}</p>
                      </div>
                      <button 
                        onClick={() => setNotifs(prev => ({ ...prev, [n.id]: !prev[n.id as keyof typeof prev] }))}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-all relative ${
                          notifs[n.id as keyof typeof notifs] ? "bg-[#7C3AED]" : "bg-slate-700"
                        }`}
                      >
                        <div className={`w-4.5 h-4.5 rounded-full bg-white transition-all ${
                          notifs[n.id as keyof typeof notifs] ? "translate-x-4.5" : "translate-x-0"
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-theme-primary">Billing & Subscription</h3>
                  <p className="text-[10px] text-theme-muted">Configure plans, update card details, and view payment receipts.</p>
                </div>

                {/* Current plan card */}
                <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex justify-between items-start">
                  <div className="space-y-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[9px] font-bold text-amber-400 uppercase tracking-widest">Active Plan</span>
                    <h4 className="text-base font-black text-theme-primary">Free Sandbox</h4>
                    <p className="text-[10px] text-theme-secondary">Upgrade to unlock 500 monthly compile cycles and programmatic API keys.</p>
                  </div>
                  <button onClick={() => toast.success("Redirecting to Stripe...")} className="btn bg-amber-500 hover:brightness-110 text-white font-bold text-xs px-4 py-2 rounded-xl">
                    Manage billing
                  </button>
                </div>

                {/* Usage meter */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-theme-secondary">
                    <span>analyses usage</span>
                    <span>12 / 50 limit</span>
                  </div>
                  <div className="h-2 w-full progress-track">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" style={{ width: "24%" }} />
                  </div>
                </div>

                {/* Invoice History */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-theme-secondary uppercase tracking-wider">Invoice History</h4>
                  <div className="border border-theme rounded-xl p-4 text-center text-xs text-theme-muted">
                    No transaction invoices available on the Free Sandbox tier.
                  </div>
                </div>
              </div>
            )}

            {activeTab === "danger" && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-red-400">Danger Zone</h3>
                  <p className="text-[10px] text-theme-muted">These actions are permanent and cannot be undone.</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-theme">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-theme-primary">Delete all sessions</h4>
                      <p className="text-[9px] text-theme-secondary">Empty the inferences database table logs of all past capture sessions.</p>
                    </div>
                    <button 
                      onClick={() => {
                        const confirm = window.confirm("Are you sure you want to delete all whiteboard captures?");
                        if (confirm) toast.success("All session inferences wiped from database.");
                      }}
                      className="btn border border-red-500/20 hover:bg-red-500/10 text-red-400 font-bold text-xs px-3.5 py-2 rounded-xl"
                    >
                      Delete all sessions
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-200">Delete user account</h4>
                      <p className="text-[9px] text-slate-400">Delete your account, credential keys, and data records completely.</p>
                    </div>
                    <button 
                      onClick={() => {
                        const confirm = window.confirm("Double check: this deletes your user login keys and workspace history. Proceed?");
                        if (confirm) toast.success("User account deleted.");
                      }}
                      className="btn bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-red-500/10"
                    >
                      Delete account
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </main>
      </div>

    </div>
  );
}
