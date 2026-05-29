"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { 
  ArrowLeft, Database, Loader2, Search, Filter, RefreshCw, 
  Trash2, ArrowRight, ExternalLink, Calendar, HelpCircle, 
  BookOpen, ChevronLeft, ChevronRight
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function HistoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/history`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error("Error loading history:", e);
      toast.error("Failed to load session history.");
    } finally {
      setLoading(false);
    }
  }, [BACKEND]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDeleteSession = async (id: string) => {
    const confirm = window.confirm("Are you sure you want to permanently delete this capture session?");
    if (!confirm) return;

    try {
      const res = await fetch(`${BACKEND}/api/inference/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems(prev => prev.filter(item => item.inference_id !== id));
        toast.success("Session deleted successfully.");
      } else {
        toast.error("Failed to delete session.");
      }
    } catch {
      toast.error("Endpoint unreachable.");
    }
  };

  // Metrics calculations
  const totalSessions = items.length;
  const thisMonthCount = items.filter(item => {
    const d = new Date(item.created_at || item.timestamp);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const getMostUsedLang = () => {
    if (items.length === 0) return "None";
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const lang = (item.languages && item.languages[0]) || "python";
      counts[lang] = (counts[lang] || 0) + 1;
    });
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, "Python");
  };

  const getAvgConfidence = () => {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, item) => acc + (item.confidence || 0.85), 0);
    return Math.round((sum / items.length) * 100);
  };

  // Filtering logic
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      (item.ocr_text || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.diagram_type || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === "all" || (item.diagram_type || "").toLowerCase() === typeFilter.toLowerCase();
    const matchesLang = langFilter === "all" || ((item.languages && item.languages[0]) || "python").toLowerCase() === langFilter.toLowerCase();
    
    return matchesSearch && matchesType && matchesLang;
  });

  // Pagination logic (10 rows per page)
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getBadgeColor = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("bst") || t.includes("tree")) return "bg-violet-500/10 text-violet-400 border border-violet-500/20";
    if (t.includes("flowchart") || t.includes("graph")) return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
    if (t.includes("list")) return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
  };

  const getConfidenceColor = (conf: number) => {
    const score = conf * 100;
    if (score >= 85) return "text-emerald-400";
    if (score >= 70) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-primary flex flex-col font-sans overflow-hidden h-screen">
      
      {/* Navbar */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-grow p-6 overflow-y-auto space-y-6">
          
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-theme-primary">Whiteboard Sessions Archive</h1>
              <p className="text-xs text-theme-secondary mt-1">Review previously analyzed diagrams and restore any workspace.</p>
            </div>

            {/* Inputs & Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search OCR or diagrams..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="input pl-8 pr-3 py-1.5 text-xs rounded-xl w-48"
                />
                <Search size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
              </div>

              <select 
                value={typeFilter} 
                onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                className="input py-1.5 px-3 text-xs rounded-xl bg-theme-panel border-theme text-theme-primary"
              >
                <option value="all">All Diagrams</option>
                <option value="bst">Binary Search Tree</option>
                <option value="flowchart">Flowchart</option>
                <option value="dsa">Linked List / Stack / Queue</option>
              </select>

              <select 
                value={langFilter} 
                onChange={e => { setLangFilter(e.target.value); setCurrentPage(1); }}
                className="input py-1.5 px-3 text-xs rounded-xl bg-theme-panel border-theme text-theme-primary"
              >
                <option value="all">All Languages</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="kotlin">Kotlin</option>
              </select>

              <button 
                onClick={fetchHistory}
                className="btn border border-[#1E1E2E] bg-white/5 hover:bg-white/10 p-2 rounded-xl text-slate-300"
              >
                <RefreshCw size={12} />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 p-4 rounded-2xl border border-theme bg-theme-panel/40">
            <div className="text-center border-r border-theme last:border-none py-1">
              <span className="block text-[9px] font-bold text-theme-muted uppercase tracking-widest">Total Sessions</span>
              <span className="text-lg font-black text-theme-primary mt-1 block">{totalSessions}</span>
            </div>
            <div className="text-center border-r border-[#1E1E2E] last:border-none py-1">
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">This Month</span>
              <span className="text-lg font-black text-[#06B6D4] mt-1 block">{thisMonthCount}</span>
            </div>
            <div className="text-center border-r border-[#1E1E2E] last:border-none py-1">
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Most Used Language</span>
              <span className="text-lg font-black text-amber-400 mt-1 block capitalize">{getMostUsedLang()}</span>
            </div>
            <div className="text-center border-r border-[#1E1E2E] last:border-none py-1">
              <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Average Confidence</span>
              <span className="text-lg font-black text-emerald-400 mt-1 block">{getAvgConfidence()}%</span>
            </div>
          </div>

          {/* Table Redesign */}
          <div className="border border-theme bg-theme-panel rounded-2xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={24} className="spin text-[#7C3AED]" />
                <p className="text-xs text-slate-400 font-semibold">Querying PostgreSQL transaction log...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                  <Database size={24} className="text-slate-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-200">No sessions match your search</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">Try altering your language tags or start drawing a new diagram!</p>
                </div>
                <Link href="/" className="btn bg-[#7C3AED] hover:brightness-110 text-white font-bold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1">
                  Go to Workspace <ArrowRight size={12} />
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-theme">
                      <th className="px-5 py-4 font-bold text-theme-secondary uppercase tracking-wider text-[9px]">Capture</th>
                      <th className="px-5 py-4 font-bold text-theme-secondary uppercase tracking-wider text-[9px]">Detected Type</th>
                      <th className="px-5 py-4 font-bold text-theme-secondary uppercase tracking-wider text-[9px]">OCR Text Extracted</th>
                      <th className="px-5 py-4 font-bold text-theme-secondary uppercase tracking-wider text-[9px]">Language</th>
                      <th className="px-5 py-4 font-bold text-theme-secondary uppercase tracking-wider text-[9px]">Confidence</th>
                      <th className="px-5 py-4 font-bold text-slate-400 uppercase tracking-wider text-[9px]">Timestamp</th>
                      <th className="px-5 py-4 font-bold text-slate-400 uppercase tracking-wider text-[9px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme">
                    {paginatedItems.map((item) => (
                      <tr key={item.inference_id} className="hover:bg-white/5 transition-all">
                        <td className="px-5 py-4">
                          <div className="w-12 h-12 rounded-lg border border-theme bg-theme-bg overflow-hidden flex items-center justify-center font-bold text-lg select-none">
                            {item.diagram_type === "bst" || item.diagram_type === "dsa" ? "🌳" : "⚙️"}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-200 capitalize">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getBadgeColor(item.diagram_type)}`}>
                            {item.diagram_type || "general"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-300 max-w-[200px] truncate" title={item.ocr_text}>
                          {item.ocr_text || "No handwritten labels detected"}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/5 text-slate-300 capitalize">
                            {(item.languages && item.languages[0]) || "python"}
                          </span>
                        </td>
                        <td className={`px-5 py-4 font-bold ${getConfidenceColor(item.confidence || 0.85)}`}>
                          {Math.round((item.confidence || 0.85) * 100)}%
                        </td>
                        <td className="px-5 py-4 text-slate-400 font-medium" title={new Date(item.created_at || item.timestamp).toString()}>
                          {new Date(item.created_at || item.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right space-x-2">
                          <Link 
                            href={`/?restore=${item.inference_id}`}
                            className="btn border border-[#1E1E2E] hover:bg-white/5 px-3 py-1.5 text-[10px] font-bold rounded-lg inline-flex items-center gap-1"
                          >
                            Load Workspace <ExternalLink size={10} />
                          </Link>
                          <button 
                            onClick={() => handleDeleteSession(item.inference_id)}
                            className="p-2 rounded hover:bg-red-500/10 text-red-400 inline-block align-middle"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-[#1E1E2E] bg-white/5">
                    <span className="text-[10px] text-slate-400">
                      Showing Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="btn border border-[#1E1E2E] bg-white/5 p-1.5 rounded-lg disabled:opacity-50 text-slate-400 hover:text-slate-200"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="btn border border-[#1E1E2E] bg-white/5 p-1.5 rounded-lg disabled:opacity-50 text-slate-400 hover:text-slate-200"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </main>
      </div>

    </div>
  );
}
