"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Brain, Zap, AlertTriangle, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import UploadPanel from "@/components/UploadPanel";
import WhiteboardCanvas from "@/components/WhiteboardCanvas";
import AnalysisPanel from "@/components/AnalysisPanel";
import ChatInterface from "@/components/ChatInterface";
import { AnalysisResult, PipelineProgress } from "@/types";

type InputMode = "upload" | "whiteboard" | "webcam";

export default function Home() {
  const [mode, setMode] = useState<InputMode>("upload");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [sessionId] = useState(() => crypto.randomUUID());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const WS = BACKEND.replace("http", "ws");

  // ── Check backend health ─────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch(`${BACKEND}/api/health`, { signal: AbortSignal.timeout(3000) });
        setBackendStatus(r.ok ? "online" : "offline");
      } catch {
        setBackendStatus("offline");
      }
    };
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, [BACKEND]);

  // ── WebSocket ────────────────────────────────────────────────────────────
  const connectWS = useCallback((jid: string) => {
    wsRef.current?.close();
    const ws = new WebSocket(`${WS}/ws/${jid}`);
    wsRef.current = ws;

    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
    }, 25000);

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === "progress") {
          setProgress({ stage: msg.stage, progress: msg.progress, message: msg.message });
        } else if (msg.event === "result") {
          setResult(msg.data);
          setAnalyzing(false);
          setProgress({ stage: "complete", progress: 100, message: "Analysis complete!" });
          ws.close();
          clearInterval(ping);
        } else if (msg.event === "error") {
          setAnalyzing(false);
          setProgress({ stage: "error", progress: -1, message: msg.message });
          ws.close();
          clearInterval(ping);
        }
      } catch {}
    };
    ws.onerror = () => clearInterval(ping);
    ws.onclose = () => clearInterval(ping);
  }, [WS]);

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async (
    blob: Blob,
    question?: string,
    language = "python"
  ) => {
    if (backendStatus === "offline") {
      setProgress({ stage: "error", progress: -1, message: "Backend is offline. Start the server first." });
      return;
    }
    setAnalyzing(true);
    setResult(null);
    setProgress({ stage: "uploading", progress: 5, message: "Uploading..." });
    setPreviewUrl(URL.createObjectURL(blob));

    const form = new FormData();
    form.append("file", blob, "diagram.png");
    form.append("session_id", sessionId);
    if (question) form.append("question", question);
    form.append("target_language", language);

    try {
      const res = await fetch(`${BACKEND}/api/analyze`, { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json()).detail || "Upload failed");
      const data = await res.json();
      setProgress({ stage: "queued", progress: 8, message: "Connecting to live updates..." });
      connectWS(data.job_id);
    } catch (err: unknown) {
      setAnalyzing(false);
      setProgress({
        stage: "error", progress: -1,
        message: err instanceof Error ? err.message : "Failed to connect to backend.",
      });
    }
  }, [BACKEND, sessionId, connectWS, backendStatus]);

  useEffect(() => () => wsRef.current?.close(), []);

  return (
    <div className="relative flex flex-col" style={{ height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
      {/* Mesh background */}
      <div className="mesh-bg">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
      </div>

      {/* ── Header ── */}
      <header
        className="relative z-20 flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(7,7,15,0.85)", backdropFilter: "blur(20px)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}>
            <Brain size={15} color="white" />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight" style={{ color: "var(--text-1)", letterSpacing: "-0.01em" }}>
              Whiteboard <span className="grad-text">Intelligence</span>
            </h1>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>AI Diagram Assistant</p>
          </div>
        </div>

        {/* Center — tech pills */}
        <div className="hidden lg:flex items-center gap-1.5">
          {["DINOv2", "TrOCR", "SAM", "GPT-4o", "Qdrant", "WebSocket"].map(t => (
            <span key={t} className="badge badge-indigo" style={{ fontSize: 10 }}>{t}</span>
          ))}
        </div>

        {/* Right — status */}
        <div className="flex items-center gap-3">
          <BackendStatusBadge status={backendStatus} backend={BACKEND} />
          <span className="badge badge-cyan" style={{ fontSize: 10 }}>
            <Zap size={9} /> Phase 3
          </span>
        </div>
      </header>

      {/* ── Backend offline banner ── */}
      {backendStatus === "offline" && (
        <div className="relative z-20 alert alert-warn mx-4 mt-3 flex-shrink-0" style={{ borderRadius: "var(--r-lg)" }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div className="flex-1">
            <p className="font-semibold text-xs">Backend Not Running</p>
            <p className="text-xs opacity-80 mt-0.5">
              Start it: <code className="font-mono">cd backend && uvicorn main:app --reload --port 8000</code>
              {" "}· Then add <code className="font-mono">OPENAI_API_KEY</code> or <code className="font-mono">GOOGLE_API_KEY</code> to <code className="font-mono">.env</code>
            </p>
          </div>
        </div>
      )}

      {/* ── Main 3-column layout ── */}
      <main className="relative z-10 flex flex-1 min-h-0 gap-3 p-3">
        {/* LEFT — Input */}
        <div
          className="glass flex flex-col overflow-hidden flex-shrink-0"
          style={{ width: 380, minWidth: 320, borderRadius: "var(--r-2xl)" }}
        >
          {/* Mode switcher */}
          <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="tab-bar">
              {(["upload", "whiteboard", "webcam"] as InputMode[]).map(m => (
                <button
                  key={m}
                  className={`tab-item ${mode === m ? "active" : ""}`}
                  onClick={() => setMode(m)}
                >
                  {m === "upload" ? "📤" : m === "whiteboard" ? "🎨" : "📷"}{" "}
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Panel content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {mode === "upload" && (
              <UploadPanel onAnalyze={handleAnalyze} analyzing={analyzing} progress={progress} previewUrl={previewUrl} backendOnline={backendStatus !== "offline"} />
            )}
            {mode === "whiteboard" && (
              <WhiteboardCanvas onAnalyze={handleAnalyze} analyzing={analyzing} />
            )}
            {mode === "webcam" && (
              <WebcamPanel onAnalyze={handleAnalyze} analyzing={analyzing} />
            )}
          </div>
        </div>

        {/* CENTER — Results */}
        <div
          className="glass flex flex-col overflow-hidden flex-1 min-w-0"
          style={{ borderRadius: "var(--r-2xl)" }}
        >
          <AnalysisPanel
            result={result}
            progress={progress}
            analyzing={analyzing}
            previewUrl={previewUrl}
          />
        </div>

        {/* RIGHT — Chat */}
        <div
          className="glass flex flex-col overflow-hidden flex-shrink-0"
          style={{ width: 340, minWidth: 280, borderRadius: "var(--r-2xl)" }}
        >
          <ChatInterface result={result} backend={BACKEND} />
        </div>
      </main>
    </div>
  );
}

// ── Backend Status Badge ────────────────────────────────────────────────────
function BackendStatusBadge({ status, backend }: { status: string; backend: string }) {
  if (status === "checking") return (
    <div className="flex items-center gap-1.5">
      <div className="dot-pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--amber)" }} />
      <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600 }}>Checking...</span>
    </div>
  );
  if (status === "online") return (
    <div className="flex items-center gap-1.5">
      <div className="dot-pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--emerald)" }} />
      <span style={{ fontSize: 11, color: "var(--emerald)", fontWeight: 600 }}>Backend Online</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1.5">
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--red)" }} />
      <span style={{ fontSize: 11, color: "var(--red)", fontWeight: 600 }}>Backend Offline</span>
    </div>
  );
}

// ── Webcam Panel ────────────────────────────────────────────────────────────
function WebcamPanel({ onAnalyze, analyzing }: { onAnalyze: (b: Blob, q?: string) => void; analyzing: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);
  const [q, setQ] = useState("");

  const start = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      if (videoRef.current) { videoRef.current.srcObject = s; setOn(true); }
    } catch { alert("Camera permission denied."); }
  };

  const capture = () => {
    if (!videoRef.current) return;
    const c = document.createElement("canvas");
    c.width = videoRef.current.videoWidth;
    c.height = videoRef.current.videoHeight;
    c.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    c.toBlob(b => b && onAnalyze(b, q || undefined), "image/png");
  };

  return (
    <div className="flex flex-col h-full p-4 gap-3">
      <div className="flex-1 rounded-2xl overflow-hidden relative" style={{ background: "#0a0a12", minHeight: 180 }}>
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        {!on && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="text-4xl">📷</div>
            <p className="text-sm font-medium" style={{ color: "var(--text-2)" }}>Webcam capture</p>
            <button className="btn btn-primary px-5 py-2.5" onClick={start}>Start Camera</button>
          </div>
        )}
      </div>
      <input className="input px-3 py-2.5 text-sm w-full" placeholder="Ask about the capture..." value={q} onChange={e => setQ(e.target.value)} />
      {on && (
        <button className="btn btn-primary py-3 w-full" onClick={capture} disabled={analyzing}>
          {analyzing ? "⏳ Analyzing..." : "📸 Capture & Analyze"}
        </button>
      )}
    </div>
  );
}
