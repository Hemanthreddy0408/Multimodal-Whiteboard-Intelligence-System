"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Sparkles, Loader2, X, ChevronDown, AlertCircle, CheckCircle2, FileImage } from "lucide-react";
import { PipelineProgress, STAGE_ICONS, STAGE_LABELS, ProgrammingLanguage } from "@/types";

const LANGS: { v: ProgrammingLanguage; label: string }[] = [
  { v: "python", label: "Python" },
  { v: "javascript", label: "JS" },
  { v: "typescript", label: "TS" },
  { v: "java", label: "Java" },
  { v: "cpp", label: "C++" },
  { v: "go", label: "Go" },
  { v: "rust", label: "Rust" },
  { v: "kotlin", label: "Kotlin" },
];

const PIPELINE_STEPS = [
  { stage: "preprocessing", label: "OpenCV Preprocessing", icon: "🔧", pct: 25 },
  { stage: "segmentation",  label: "SAM Segmentation",     icon: "🧩", pct: 40 },
  { stage: "ocr",           label: "TrOCR Extraction",     icon: "📝", pct: 55 },
  { stage: "classification",label: "Classification",        icon: "🏷️", pct: 65 },
  { stage: "embedding",     label: "DINOv2 Embedding",      icon: "🔢", pct: 75 },
  { stage: "llm_analysis",  label: "LLM Reasoning",         icon: "🤖", pct: 90 },
];

interface Props {
  onAnalyze: (blob: Blob, question?: string, language?: string) => void;
  analyzing: boolean;
  progress: PipelineProgress | null;
  previewUrl: string | null;
  backendOnline: boolean;
}

export default function UploadPanel({ onAnalyze, analyzing, progress, previewUrl, backendOnline }: Props) {
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [lang, setLang] = useState<ProgrammingLanguage>("python");
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) return alert("Please upload an image.");
    setFile(f);
    setLocalPreview(URL.createObjectURL(f));
  }, []);

  const clear = () => { setFile(null); setLocalPreview(null); };

  const submit = () => {
    if (!file || analyzing) return;
    onAnalyze(file, question || undefined, lang);
  };

  const pct = progress?.progress ?? 0;
  const isError = progress?.stage === "error";
  const isDone = progress?.stage === "complete";
  const displayUrl = localPreview || previewUrl;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── Language selector ── */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-3)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Target Language
          </p>
          <div className="flex flex-wrap gap-1.5">
            {LANGS.map(l => (
              <button
                key={l.v}
                onClick={() => setLang(l.v)}
                className="btn text-xs px-3 py-1.5"
                style={{
                  background: lang === l.v ? "rgba(99,102,241,0.18)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${lang === l.v ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)"}`,
                  color: lang === l.v ? "#818cf8" : "var(--text-3)",
                  borderRadius: "var(--r-sm)",
                  fontWeight: 600,
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Image area ── */}
        {!displayUrl ? (
          <div
            className={`drop-zone ${drag ? "drag-over" : ""} flex flex-col items-center justify-center py-10 gap-3`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) pick(f); }}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={e => e.target.files?.[0] && pick(e.target.files[0])} />
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <FileImage size={28} color="#818cf8" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-1)" }}>
                Drop diagram here
              </p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>
                PNG · JPG · WEBP · max 50MB
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-4)" }}>
                Flowcharts · DSA · Architecture · Whiteboard
              </p>
            </div>
            <span className="btn btn-ghost text-xs px-4 py-2">Browse Files</span>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl" style={{ background: "var(--bg-2)" }}>
            <img src={displayUrl} alt="diagram" className="w-full object-contain" style={{ maxHeight: 240 }} />
            {analyzing && (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: "rgba(7,7,15,0.65)", backdropFilter: "blur(4px)" }}>
                <Loader2 size={28} color="#818cf8" className="spin" />
              </div>
            )}
            {!analyzing && (
              <button onClick={clear}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <X size={13} color="white" />
              </button>
            )}
          </div>
        )}

        {/* ── File info ── */}
        {file && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
            style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <CheckCircle2 size={14} color="var(--emerald)" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "var(--text-1)" }}>{file.name}</p>
              <p className="text-xs" style={{ color: "var(--text-3)" }}>{(file.size / 1024).toFixed(0)} KB</p>
            </div>
          </div>
        )}

        {/* ── Question input ── */}
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-3)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Ask AI (optional)
          </label>
          <textarea
            className="input w-full px-3 py-2.5 text-sm resize-none"
            rows={3}
            placeholder={`e.g. Generate ${lang} code for this. What algorithm is this? Explain step by step.`}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            disabled={analyzing}
          />
        </div>

        {/* ── Progress ── */}
        {progress && (
          <div className="space-y-3 slide-up">
            {/* Progress bar */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold" style={{ color: isError ? "var(--red)" : isDone ? "var(--emerald)" : "#818cf8" }}>
                  {STAGE_ICONS[progress.stage] || "⚙️"} {STAGE_LABELS[progress.stage] || progress.stage}
                </span>
                <span className="text-xs font-bold" style={{ color: "var(--text-3)" }}>
                  {pct < 0 ? "Failed" : `${pct}%`}
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{
                  width: `${Math.max(0, pct)}%`,
                  background: isError ? "var(--red)" : isDone
                    ? "linear-gradient(90deg, var(--emerald), #34d399)"
                    : "linear-gradient(90deg, #6366f1, #8b5cf6, #22d3ee)",
                }} />
              </div>
              <p className="text-xs mt-1.5" style={{ color: "var(--text-3)" }}>{progress.message}</p>
            </div>

            {/* Pipeline steps */}
            {analyzing && (
              <div className="space-y-1.5">
                {PIPELINE_STEPS.map(s => {
                  const done = pct >= s.pct;
                  const active = progress.stage === s.stage;
                  return (
                    <div key={s.stage} className={`step-item ${done ? "done" : active ? "active" : "pending"}`}>
                      <span>{done ? "✅" : active ? "⚙️" : s.icon}</span>
                      <span className="text-xs font-medium flex-1" style={{
                        color: done ? "var(--emerald)" : active ? "#818cf8" : "var(--text-3)"
                      }}>{s.label}</span>
                      {active && <Loader2 size={12} color="#818cf8" className="spin" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {isError && (
          <div className="alert alert-error slide-up">
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="font-semibold text-xs mb-1">Analysis Failed</p>
              <p className="text-xs opacity-80">{progress?.message}</p>
              {progress?.message?.includes("backend") || progress?.message?.includes("fetch") ? (
                <p className="text-xs mt-1.5 opacity-70">
                  Run: <code className="font-mono">cd backend && uvicorn main:app --reload</code>
                </p>
              ) : null}
            </div>
          </div>
        )}

      </div>

      {/* ── Submit button ── */}
      <div className="p-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        {!backendOnline && (
          <p className="text-center text-xs mb-2" style={{ color: "var(--red)" }}>
            ⚠️ Start the backend server first
          </p>
        )}
        <button
          className="btn btn-primary w-full py-3 text-sm"
          onClick={submit}
          disabled={!file || analyzing || !backendOnline}
          style={{ borderRadius: "var(--r-lg)" }}
        >
          {analyzing
            ? <><Loader2 size={15} className="spin" /> Analyzing with AI...</>
            : <><Sparkles size={15} /> Analyze Diagram</>
          }
        </button>
      </div>
    </div>
  );
}
