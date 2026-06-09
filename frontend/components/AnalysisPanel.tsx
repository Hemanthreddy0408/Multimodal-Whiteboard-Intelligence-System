"use client";

import { useState, useEffect } from "react";
import { Code2, FileText, Layers, Search, Database, Copy, Check, Loader2, ArrowRight, Eye, EyeOff, Cpu, Zap, Share2, History, ExternalLink } from "lucide-react";
import { AnalysisResult, PipelineProgress } from "@/types";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

type Tab = "explain" | "code" | "elements" | "similar" | "json" | "diff";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "explain",  label: "Explain",  icon: "💡" },
  { id: "code",     label: "Code",     icon: "🖥️" },
  { id: "diff",     label: "Diff",     icon: "🔄" },
  { id: "elements", label: "Elements", icon: "🧩" },
  { id: "similar",  label: "Similar",  icon: "🔍" },
  { id: "json",     label: "JSON",     icon: "{ }" },
];

interface Props {
  result: AnalysisResult | null;
  progress: PipelineProgress | null;
  analyzing: boolean;
  previewUrl: string | null;
}

export default function AnalysisPanel({ result, progress, analyzing, previewUrl }: Props) {
  const [tab, setTab] = useState<Tab>("explain");
  const [copied, setCopied] = useState(false);
  const [showAttn, setShowAttn] = useState(false);
  
  const [previousCode, setPreviousCode] = useState<string | null>(null);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [exportingGist, setExportingGist] = useState(false);
  const [gistUrl, setGistUrl] = useState<string | null>(null);

  useEffect(() => {
    if (result?.generated_code) {
      if (lastCode && lastCode !== result.generated_code) {
        setPreviousCode(lastCode);
      }
      setLastCode(result.generated_code);
    }
  }, [result?.generated_code, lastCode]);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportGist = async () => {
    if (!result?.generated_code) return;
    setExportingGist(true);
    try {
      const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${BACKEND}/api/gist/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: result.generated_code,
          filename: `generated_${result.diagram_type || "code"}.py`,
          description: `Generated ${result.diagram_type} code from Multimodal Whiteboard Intelligence System`
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGistUrl(data.gist_url);
        window.open(data.gist_url, "_blank");
      } else {
        alert("Failed to export Gist");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to export Gist: backend connection issue");
    } finally {
      setExportingGist(false);
    }
  };

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!result && !analyzing) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <Cpu size={15} color="#818cf8" />
          <span className="font-bold text-sm" style={{ color: "var(--text-1)" }}>AI Analysis Results</span>
        </div>

        {/* Hero empty state */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <span className="text-4xl">🧠</span>
          </div>
          <h2 className="text-xl font-bold mb-2 grad-text">Ready to Analyze</h2>
          <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--text-3)", lineHeight: 1.6 }}>
            Upload a diagram, draw on the whiteboard, or use your webcam. Our AI will understand it completely.
          </p>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
            {[
              { icon: "🔧", title: "OpenCV", desc: "Preprocessing" },
              { icon: "🧩", title: "SAM", desc: "Segmentation" },
              { icon: "📝", title: "TrOCR", desc: "Handwriting OCR" },
              { icon: "🔢", title: "DINOv2", desc: "Vision Embeddings" },
              { icon: "🔍", title: "Qdrant", desc: "Semantic Search" },
              { icon: "🤖", title: "LLM", desc: "Code Generation" },
            ].map(f => (
              <div key={f.title} className="glass-sm flex items-center gap-2.5 px-3 py-2.5 rounded-xl">
                <span className="text-lg">{f.icon}</span>
                <div className="text-left">
                  <p className="text-xs font-bold" style={{ color: "var(--text-1)" }}>{f.title}</p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Analyzing state ──────────────────────────────────────────────────────
  if (analyzing && !result) {
    const pct = progress?.progress ?? 0;
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2">
            <Loader2 size={15} color="#818cf8" className="spin" />
            <span className="font-bold text-sm" style={{ color: "var(--text-1)" }}>Analyzing Diagram...</span>
          </div>
          <span className="font-bold text-sm" style={{ color: "#818cf8" }}>{pct}%</span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Image preview */}
          {previewUrl && (
            <div className="relative rounded-2xl overflow-hidden" style={{ background: "var(--bg-2)" }}>
              <img src={previewUrl} alt="Processing" className="w-full object-contain opacity-50" style={{ maxHeight: 200 }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2"
                    style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)" }}>
                    <Loader2 size={20} color="#818cf8" className="spin" />
                  </div>
                  <p className="text-xs font-semibold" style={{ color: "#818cf8" }}>
                    {progress?.message || "Processing..."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mega progress bar */}
          <div>
            <div className="progress-track mb-2" style={{ height: 6 }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Pipeline steps */}
          <div className="space-y-2">
            {[
              { stage: "preprocessing",  label: "OpenCV Preprocessing",  icon: "🔧",  pct: 25 },
              { stage: "segmentation",   label: "SAM Segmentation",      icon: "🧩",  pct: 40 },
              { stage: "ocr",            label: "TrOCR Text Extraction",  icon: "📝",  pct: 55 },
              { stage: "classification", label: "Diagram Classification", icon: "🏷️", pct: 65 },
              { stage: "embedding",      label: "DINOv2 Embedding",       icon: "🔢",  pct: 75 },
              { stage: "vector_search",  label: "Semantic Search",        icon: "🔍",  pct: 80 },
              { stage: "llm_analysis",   label: "LLM Code Generation",    icon: "🤖",  pct: 95 },
            ].map(s => {
              const done = pct >= s.pct;
              const active = progress?.stage === s.stage;
              return (
                <div key={s.stage} className={`step-item ${done ? "done" : active ? "active" : "pending"}`}>
                  <span className="text-base">{done ? "✅" : s.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: done ? "var(--emerald)" : active ? "#818cf8" : "var(--text-3)" }}>
                      {s.label}
                    </p>
                    {active && <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{progress?.message}</p>}
                  </div>
                  {active && <Loader2 size={13} color="#818cf8" className="spin" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Result state ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-0.5">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`tab-item flex-shrink-0 ${tab === t.id ? "active" : ""}`}
              style={{ flexGrow: 0, padding: "6px 12px" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {result && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="badge badge-indigo">{result.diagram_type}</span>
            {result.attention_map_url && (
              <button onClick={() => setShowAttn(v => !v)}
                className="btn btn-ghost px-2 py-1.5 text-xs gap-1"
                style={{ borderRadius: "var(--r-sm)" }}>
                {showAttn ? <EyeOff size={11} /> : <Eye size={11} />}
                Heatmap
              </button>
            )}
            <span className="text-xs" style={{ color: "var(--text-4)" }}>{result.model_used}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {result && (
          <>
            {/* Confidence row */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: "var(--text-3)" }}>AI Confidence</span>
                  <span className="text-xs font-bold" style={{ color: "var(--emerald)" }}>
                    {Math.round((result.confidence || 0.85) * 100)}%
                  </span>
                </div>
                <div className="progress-track" style={{ height: 4 }}>
                  <div style={{ height: "100%", width: `${(result.confidence || 0.85) * 100}%`, background: "linear-gradient(90deg, #10b981, #34d399)", borderRadius: 99, transition: "width 0.8s ease" }} />
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {result.complexity?.time && (
                  <div className="metric-card px-3 py-2">
                    <p className="text-xs font-bold" style={{ color: "var(--amber)" }}>⏱ {result.complexity.time}</p>
                    <p className="text-xs" style={{ color: "var(--text-4)" }}>Time</p>
                  </div>
                )}
                {result.complexity?.space && (
                  <div className="metric-card px-3 py-2">
                    <p className="text-xs font-bold" style={{ color: "var(--cyan)" }}>💾 {result.complexity.space}</p>
                    <p className="text-xs" style={{ color: "var(--text-4)" }}>Space</p>
                  </div>
                )}
              </div>
            </div>

            {/* Image with attention */}
            {previewUrl && tab !== "code" && (
              <div className="relative rounded-2xl overflow-hidden" style={{ background: "var(--bg-2)", maxHeight: 220 }}>
                <img src={previewUrl} alt="Analyzed" className="w-full object-contain" style={{ maxHeight: 220 }} />
                {showAttn && result.attention_map_url && (
                  <img src={`http://localhost:8000${result.attention_map_url}`} alt="Attention"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ mixBlendMode: "overlay", opacity: 0.8 }} />
                )}
              </div>
            )}

            {/* ── Explain tab ── */}
            {tab === "explain" && (
              <div className="space-y-4 slide-up">
                {result.summary && (
                  <div className="p-4 rounded-2xl" style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)" }}>
                    <p className="text-xs font-bold mb-1.5 uppercase tracking-widest" style={{ color: "#818cf8" }}>📋 Summary</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{result.summary}</p>
                  </div>
                )}
                {result.algorithm_pattern && (
                  <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.15)" }}>
                    <span className="text-xl">🏆</span>
                    <div>
                      <p className="text-xs font-bold" style={{ color: "var(--cyan)" }}>Pattern / Algorithm</p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-1)" }}>{result.algorithm_pattern}</p>
                    </div>
                  </div>
                )}
                {result.explanation && (
                  <div>
                    <p className="text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Detailed Explanation</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-2)", lineHeight: 1.7 }}>{result.explanation}</p>
                  </div>
                )}
                {result.relationships?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: "var(--text-3)" }}>Relationships</p>
                    <div className="space-y-1.5">
                      {result.relationships.map((r, i) => (
                        <div key={i} className="relation-row">
                          <span className="font-semibold text-xs" style={{ color: "var(--text-1)" }}>{r.from}</span>
                          <ArrowRight size={11} color="#818cf8" />
                          <span className="font-semibold text-xs" style={{ color: "var(--text-1)" }}>{r.to}</span>
                          {r.relationship && <span className="ml-auto text-xs" style={{ color: "var(--text-3)" }}>{r.relationship}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Code tab ── */}
            {tab === "code" && (
              <div className="space-y-4 slide-up">
                {result.generated_code ? (
                  <>
                    <div className="code-wrap">
                      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
                            <div className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
                            <div className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
                          </div>
                          <span className="text-xs font-medium" style={{ color: "var(--text-3)", fontFamily: "monospace" }}>generated.py</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={handleExportGist} disabled={exportingGist}
                            className="btn btn-ghost text-xs px-2 py-1 gap-1 flex items-center" style={{ borderRadius: "var(--r-sm)" }}>
                            {exportingGist ? (
                              <><Loader2 size={11} className="spin animate-spin" /> Exporting...</>
                            ) : gistUrl ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Check size={11} /> Exported
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Share2 size={11} /> Export Gist
                              </span>
                            )}
                          </button>
                          <button onClick={() => copy(result.generated_code!)}
                            className="btn btn-ghost text-xs px-2 py-1 gap-1" style={{ borderRadius: "var(--r-sm)" }}>
                            {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
                          </button>
                        </div>
                      </div>
                      <div className="overflow-x-auto text-[13px] bg-[#0d1117]/60">
                        <SyntaxHighlighter
                          language={result.language || "python"}
                          style={vscDarkPlus}
                          customStyle={{
                            background: "transparent",
                            padding: "16px",
                            fontSize: "12px",
                            margin: 0,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {result.generated_code}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                    {result.code_explanation && (
                      <div className="p-4 rounded-xl" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
                        <p className="text-xs font-bold mb-2 uppercase tracking-widest" style={{ color: "#818cf8" }}>Code Walkthrough</p>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-3)", lineHeight: 1.7 }}>{result.code_explanation}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Code2 size={40} style={{ color: "var(--text-4)", marginBottom: 12 }} />
                    <p style={{ color: "var(--text-3)", fontSize: 13 }}>No code generated yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Elements tab ── */}
            {tab === "elements" && (
              <div className="space-y-3 slide-up">
                <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: "var(--text-3)" }}>OCR Text</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>{result.ocr_text || "No text detected"}</p>
                </div>
                {result.elements.length === 0 ? (
                  <p className="text-center py-8 text-sm" style={{ color: "var(--text-3)" }}>No elements detected</p>
                ) : (
                  <div className="space-y-2">
                    {result.elements.map(el => (
                      <div key={el.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <span className={`badge ${el.type === "box" ? "badge-indigo" : el.type === "arrow" ? "badge-cyan" : "badge-amber"}`}>
                          {el.type}
                        </span>
                        <span className="text-sm flex-1 font-medium" style={{ color: "var(--text-1)" }}>
                          {el.text || "(no text)"}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-3)" }}>
                          {Math.round(el.confidence * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Similar tab ── */}
            {tab === "similar" && (
              <div className="space-y-3 slide-up">
                {result.similar_diagrams.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <Search size={40} style={{ color: "var(--text-4)", marginBottom: 12 }} />
                    <p className="text-sm" style={{ color: "var(--text-3)" }}>
                      No similar diagrams yet.
                      <br />Analyze more diagrams to build your semantic library.
                    </p>
                  </div>
                ) : (
                  result.similar_diagrams.map((s, i) => (
                    <div key={s.id} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="badge badge-indigo">{s.diagram_type}</span>
                        <span className="text-xs font-bold" style={{ color: s.score > 0.8 ? "var(--emerald)" : "var(--amber)" }}>
                          {Math.round(s.score * 100)}% match
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-3)", lineHeight: 1.6 }}>
                        {(s.explanation || s.ocr_text || "").slice(0, 120)}...
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── JSON tab ── */}
            {tab === "json" && (
              <div className="code-wrap slide-up">
                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                  <span className="text-xs font-medium" style={{ color: "var(--text-3)" }}>Raw JSON Response</span>
                  <button onClick={() => copy(JSON.stringify(result, null, 2))}
                    className="btn btn-ghost text-xs px-2 py-1 gap-1" style={{ borderRadius: "var(--r-sm)" }}>
                    {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
                  </button>
                </div>
                <pre className="p-4 text-xs overflow-x-auto" style={{ color: "#e6edf3", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.7, maxHeight: 500 }}>
                  <code>{JSON.stringify(result, null, 2)}</code>
                </pre>
              </div>
            )}

            {/* ── Diff tab ── */}
            {tab === "diff" && (
              <div className="space-y-4 slide-up">
                {previousCode && result.generated_code ? (
                  <div className="code-wrap">
                    <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                      <span className="text-xs font-semibold text-indigo-400">Code Version Comparison (Diff)</span>
                      <span className="text-[10px] text-slate-400">Green (+) = Added, Red (-) = Removed</span>
                    </div>
                    <div className="overflow-x-auto text-[12px] p-4 bg-[#0d1117]/80 font-mono leading-relaxed max-h-[500px]">
                      {computeSimpleDiff(previousCode, result.generated_code).map((line, idx) => (
                        <div key={idx} className={`px-2 py-0.5 rounded flex ${
                          line.type === "added" ? "bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500" :
                          line.type === "removed" ? "bg-rose-950/40 text-rose-300 border-l-2 border-rose-500 line-through" :
                          "text-slate-300"
                        }`}>
                          <span className="w-6 select-none opacity-30 text-right pr-2">
                            {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                          </span>
                          <span className="whitespace-pre">{line.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <History size={40} className="text-slate-500 mb-3" />
                    <p className="text-xs text-slate-400 max-w-xs">
                      No previous versions detected. Use the chat to request a code modification or language translation to view diffs.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Telemetry HUD Footer */}
      {result && (
        <div className="px-4 py-2.5 border-t border-white/5 bg-black/40 text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-semibold">
            <Cpu size={12} className="text-indigo-400" />
            <span>Telemetry:</span>
            {result.latencies && (
              <span className="flex flex-wrap gap-x-2.5 gap-y-1">
                <span>CV Pre: <strong className="text-slate-200">{(result.latencies.preprocessing ?? 0).toFixed(2)}s</strong></span>
                <span>SAM Seg: <strong className="text-slate-200">{(result.latencies.segmentation ?? 0).toFixed(2)}s</strong></span>
                <span>TrOCR: <strong className="text-slate-200">{(result.latencies.ocr ?? 0).toFixed(2)}s</strong></span>
                <span>DINOv2: <strong className="text-slate-200">{(result.latencies.embedding ?? 0).toFixed(2)}s</strong></span>
                <span>ML Class: <strong className="text-slate-200">{(result.latencies.classification ?? 0).toFixed(2)}s</strong></span>
                {result.latencies.llm !== undefined && (
                  <span>LLM: <strong className="text-slate-200">{(result.latencies.llm ?? 0).toFixed(2)}s</strong></span>
                )}
              </span>
            )}
          </div>
          {result.estimated_cost !== undefined && (
            <div className="flex items-center gap-1 font-semibold text-emerald-400">
              <Zap size={11} />
              <span>Cost: <strong>${(result.estimated_cost ?? 0).toFixed(5)}</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const computeSimpleDiff = (oldStr: string, newStr: string) => {
  const oldLines = oldStr.split("\n");
  const newLines = newStr.split("\n");
  const diff: { type: "added" | "removed" | "unchanged"; text: string }[] = [];
  
  let i = 0, j = 0;
  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length) {
      if (oldLines[i] === newLines[j]) {
        diff.push({ type: "unchanged", text: oldLines[i] });
        i++;
        j++;
      } else {
        if (i + 1 < oldLines.length && oldLines[i + 1] === newLines[j]) {
          diff.push({ type: "removed", text: oldLines[i] });
          i++;
        } else if (j + 1 < newLines.length && oldLines[i] === newLines[j + 1]) {
          diff.push({ type: "added", text: newLines[j] });
          j++;
        } else {
          diff.push({ type: "removed", text: oldLines[i] });
          diff.push({ type: "added", text: newLines[j] });
          i++;
          j++;
        }
      }
    } else if (i < oldLines.length) {
      diff.push({ type: "removed", text: oldLines[i] });
      i++;
    } else {
      diff.push({ type: "added", text: newLines[j] });
      j++;
    }
  }
  return diff;
};
