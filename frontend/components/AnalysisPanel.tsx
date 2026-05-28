"use client";

import { useState } from "react";
import { Code2, FileText, Layers, Search, Database, Copy, Check, Loader2, ArrowRight, Eye, EyeOff, Cpu, Zap } from "lucide-react";
import { AnalysisResult, PipelineProgress } from "@/types";

type Tab = "explain" | "code" | "elements" | "similar" | "json";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "explain",  label: "Explain",  icon: "💡" },
  { id: "code",     label: "Code",     icon: "🖥️" },
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

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                        <button onClick={() => copy(result.generated_code!)}
                          className="btn btn-ghost text-xs px-2 py-1 gap-1" style={{ borderRadius: "var(--r-sm)" }}>
                          {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
                        </button>
                      </div>
                      <pre className="p-4 text-xs overflow-x-auto" style={{ color: "#e6edf3", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.7 }}>
                        <code>{result.generated_code}</code>
                      </pre>
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
          </>
        )}
      </div>
    </div>
  );
}
