"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Cpu, History, Settings, Zap, BarChart2 } from "lucide-react";

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const userPlan = (session?.user as any)?.plan || "free";
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";

  const items = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Workspace", href: "/", icon: Cpu },
    { label: "History", href: "/history", icon: History },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-60 border-r border-theme bg-theme-panel flex flex-col h-full flex-shrink-0 z-30">
      
      {/* User profile segment */}
      <div className="p-4 border-b border-theme flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] flex items-center justify-center font-bold text-sm text-white">
          {userName.split(" ").map(n => n[0]).join("")}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-100 truncate">{userName}</p>
          <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-1 uppercase ${
            userPlan === "free" ? "bg-slate-800 text-slate-400 border border-slate-700" : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30"
          }`}>
            {userPlan} Plan
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1">
        {items.map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all border-l-2 ${
                active 
                  ? "bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]" 
                  : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <item.icon size={14} />
              {item.label}
            </Link>
          );
        })}

        {/* Upgrade link */}
        {userPlan === "free" && (
          <Link
            href="/pricing"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-400 border-l-2 border-transparent bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/30 transition-all mt-4"
          >
            <Zap size={14} className="fill-amber-400/20" />
            Upgrade to Pro
          </Link>
        )}
      </nav>

      {/* Usage Meter */}
      <div className="p-4 border-t border-theme space-y-3">
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
          <span className="flex items-center gap-1.5"><BarChart2 size={12} /> Usage</span>
          <span>12 / 50 analyses</span>
        </div>
        <div className="progress-track" style={{ height: 6 }}>
          <div className="h-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] rounded-full" style={{ width: "24%" }} />
        </div>
        <p className="text-[10px] text-slate-500">12 / 50 analyses used this month</p>
      </div>

    </aside>
  );
}
