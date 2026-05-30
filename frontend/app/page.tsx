"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { 
  Zap, Cpu, MessageSquare, Loader2, Send, History, 
  Layers, Camera, Upload, Edit3, Image as ImageIcon, Play, CheckCircle2
} from "lucide-react";
import UploadPanel from "@/components/UploadPanel";
import WhiteboardCanvas from "@/components/WhiteboardCanvas";
import AnalysisPanel from "@/components/AnalysisPanel";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { AnalysisResult, PipelineProgress, ChatMessage, InputMode } from "@/types";

export default function Home() {
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<InputMode>("upload");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [sessionId] = useState(() => crypto.randomUUID());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showConfidenceOverlay, setShowConfidenceOverlay] = useState(false);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Welcome! Ask me to convert the code to other languages, explain traversals, analyze complexity, or add features.",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const WS = BACKEND.replace("http", "ws");

  // Check backend health status
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

  // Handle restore query param workspace loaded
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const restoreId = params.get("restore");
      const activeTab = params.get("tab") as InputMode;
      if (activeTab) {
        setMode(activeTab);
      }
      if (restoreId) {
        const loadRestored = async () => {
          setAnalyzing(true);
          setProgress({ stage: "queued", progress: 20, message: "Restoring workspace session..." });
          try {
            const res = await fetch(`${BACKEND}/api/inference/${restoreId}`);
            if (res.ok) {
              const data = await res.json();
              setResult({
                upload_id: restoreId,
                session_id: sessionId,
                diagram_type: data.diagram_type || "unknown",
                elements: data.elements || [],
                ocr_text: data.ocr_text || "",
                explanation: data.explanation || "Restored workspace capture.",
                generated_code: data.generated_code || (data.generated_codes && data.generated_codes[0]?.code) || null,
                code_explanation: data.code_explanation || (data.generated_codes && data.generated_codes[0]?.explanation) || "",
                summary: data.summary || "Restored session details.",
                relationships: data.relationships || [],
                similar_diagrams: data.similar_diagrams || [],
                attention_map_url: data.attention_map_url || null,
                confidence: data.confidence || 0.85,
                model_used: data.model_used || "restored-db",
                embedding_id: data.embedding_id || null,
              });
              setPreviewUrl(`${BACKEND}/uploads/${restoreId}.png`);
              setProgress({ stage: "complete", progress: 100, message: "Workspace restored!" });
            }
          } catch (e) {
            console.error("Error restoring session:", e);
          } finally {
            setAnalyzing(false);
          }
        };
        loadRestored();
      }
    }
  }, [BACKEND, sessionId]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // WebSocket connection handler
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
          
          // Increment monthly usage count and notify other UI components to refresh
          fetch("/api/user/usage", { method: "POST" })
            .then(() => window.dispatchEvent(new Event("usage-updated")))
            .catch(err => console.error("Failed to increment usage stats:", err));
          
          setChatMessages(prev => [...prev, {
            id: `sys-${Date.now()}`,
            role: "assistant",
            content: `🤖 **Pipeline Finished!** I've preprocessed and analyzed your **${msg.data.diagram_type || 'general_diagram'}** diagram. I detected root elements and generated the implementing code. Ask me questions below!`,
            timestamp: new Date(),
          }]);
          
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

  // Run full compiler analyze
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
        stage: "error",
        progress: -1,
        message: err instanceof Error ? err.message : "Failed to connect to backend.",
      });
    }
  }, [BACKEND, sessionId, connectWS, backendStatus]);

  // Chat Q&A submit handler
  const handleChatSubmit = async (text: string) => {
    if (!text.trim() || chatLoading) return;
    
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text, timestamp: new Date() };
    const loadMsg: ChatMessage = { id: `l-${Date.now()}`, role: "assistant", content: "", timestamp: new Date(), isLoading: true };

    setChatMessages(p => [...p, userMsg, loadMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`${BACKEND}/api/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, context: result || {}, upload_id: result?.upload_id }),
      });

      if (res.ok) {
        const data = await res.json();
        const answer = data.answer;
        
        const codeBlockRegex = /```(?:python|javascript|typescript|java|cpp|go|rust|kotlin)?\s*([\s\S]*?)```/;
        const match = answer.match(codeBlockRegex);
        if (match && match[1] && result) {
          setResult(prev => prev ? { ...prev, generated_code: match[1].trim() } : null);
        }

        setChatMessages(p => p.map(m => m.isLoading ? { ...m, content: answer, isLoading: false } : m));
      } else {
        setChatMessages(p => p.map(m => m.isLoading ? { ...m, content: "⚠️ Could not get AI reply. Please verify connection.", isLoading: false } : m));
      }
    } catch {
      setChatMessages(p => p.map(m => m.isLoading ? { ...m, content: "⚠️ Chat endpoint unreachable.", isLoading: false } : m));
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-theme-primary flex flex-col font-sans overflow-hidden h-screen" style={{ background: "var(--bg)" }}>

      {/* Animated background */}
      <div className="mesh-bg">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
      </div>

      <Navbar />

      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar />

        <main className="flex-grow p-4 overflow-hidden flex flex-col gap-3 min-w-0">

          {/* Top workspace split */}
          <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-hidden min-h-0">

            {/* Left: Input panel */}
            <div
              className="rounded-2xl flex flex-col overflow-hidden"
              style={{
                background: "rgba(10,10,22,0.75)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(16px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              {/* Header */}
              <div
                className="p-3 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.2)" }}
              >
                {/* Mode switcher */}
                <div
                  className="flex p-1 rounded-xl w-full sm:max-w-sm"
                  style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {(["upload", "whiteboard", "webcam"] as InputMode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      style={{
                        background: mode === m ? "linear-gradient(135deg, #7c3aed, #8b5cf6)" : "transparent",
                        color: mode === m ? "#fff" : "#64748b",
                        boxShadow: mode === m ? "0 2px 12px rgba(124,58,237,0.35)" : "none",
                        transform: mode === m ? "scale(1)" : "scale(0.97)",
                        transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                      }}
                    >
                      {m === "upload" && <Upload size={12} />}
                      {m === "whiteboard" && <Edit3 size={12} />}
                      {m === "webcam" && <Camera size={12} />}
                      <span>{m === "upload" ? "File Upload" : m === "whiteboard" ? "Draw Board" : "Live Camera"}</span>
                    </button>
                  ))}
                </div>

                {/* Backend & overlay controls */}
                <div className="flex items-center gap-2">
                  {/* Backend status */}
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold"
                    style={{
                      background: backendStatus === "online" ? "rgba(16,185,129,0.08)" : backendStatus === "offline" ? "rgba(248,113,113,0.08)" : "rgba(245,158,11,0.08)",
                      border: `1px solid ${backendStatus === "online" ? "rgba(16,185,129,0.2)" : backendStatus === "offline" ? "rgba(248,113,113,0.2)" : "rgba(245,158,11,0.2)"}`,
                      color: backendStatus === "online" ? "#10b981" : backendStatus === "offline" ? "#f87171" : "#f59e0b",
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: backendStatus === "online" ? "#10b981" : backendStatus === "offline" ? "#f87171" : "#f59e0b",
                        boxShadow: backendStatus === "online" ? "0 0 6px rgba(16,185,129,0.8)" : "none",
                        animation: backendStatus === "online" ? "dot-anim 2s ease-in-out infinite" : "none",
                      }}
                    />
                    {backendStatus === "online" ? "Live" : backendStatus === "offline" ? "Offline" : "Checking"}
                  </div>

                  {previewUrl && (
                    <button
                      onClick={() => setShowConfidenceOverlay(p => !p)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
                      style={{
                        background: showConfidenceOverlay ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${showConfidenceOverlay ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.07)"}`,
                        color: showConfidenceOverlay ? "#22d3ee" : "#64748b",
                      }}
                    >
                      <Layers size={11} /> {showConfidenceOverlay ? "Hide" : "Detect"}
                    </button>
                  )}
                </div>
              </div>

              {/* Panel body */}
              <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-3 min-h-0">
                <div className="flex-grow flex items-center justify-center min-h-[200px]">
                  {showConfidenceOverlay && previewUrl ? (
                    <div
                      className="relative w-full h-full max-h-[340px] flex items-center justify-center rounded-xl overflow-hidden p-2"
                      style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.4)" }}
                    >
                      <img src={previewUrl} className="max-w-full max-h-[320px] object-contain rounded-lg" alt="Diagram" />
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="relative w-full h-full max-w-full max-h-[320px]">
                          <div className="absolute border border-emerald-500 bg-emerald-500/10 rounded" style={{ top: "8%", left: "10%", width: "80%", height: "82%" }}>
                            <span className="absolute top-1 left-1 bg-emerald-500 text-white font-mono font-bold text-[7px] px-1 rounded">Diagram (96%)</span>
                          </div>
                          <div className="absolute border border-cyan-400 bg-cyan-400/10 rounded" style={{ top: "2%", left: "30%", width: "40%", height: "18%" }}>
                            <span className="absolute top-1 left-1 bg-cyan-400 text-slate-900 font-mono font-bold text-[7px] px-1 rounded">Text (88%)</span>
                          </div>
                          <div className="absolute border border-amber-500 bg-amber-500/10 rounded" style={{ top: "72%", left: "20%", width: "60%", height: "15%" }}>
                            <span className="absolute top-1 left-1 bg-amber-500 text-white font-mono font-bold text-[7px] px-1 rounded">Annotation (74%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full">
                      {mode === "upload" && <UploadPanel onAnalyze={handleAnalyze} analyzing={analyzing} progress={progress} previewUrl={previewUrl} backendOnline={backendStatus !== "offline"} />}
                      {mode === "whiteboard" && <WhiteboardCanvas onAnalyze={handleAnalyze} analyzing={analyzing} />}
                      {mode === "webcam" && <WebcamPanel onAnalyze={handleAnalyze} analyzing={analyzing} />}
                    </div>
                  )}
                </div>

                {/* Confidence bar */}
                {result && (
                  <div
                    className="p-3.5 rounded-xl flex justify-between items-center slide-up"
                    style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div>
                      <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: "#475569" }}>Detected</p>
                      <p className="text-xs font-bold capitalize mt-0.5" style={{ color: "#f1f5f9" }}>{result.diagram_type || "general"}</p>
                    </div>
                    <div className="w-28 text-right">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#475569" }}>Confidence</span>
                        <span className="text-xs font-black" style={{ color: "#10b981" }}>{Math.round((result.confidence || 0.85) * 100)}%</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(result.confidence || 0.85) * 100}%`,
                            background: "linear-gradient(90deg, #10b981, #34d399)",
                            boxShadow: "0 0 8px rgba(16,185,129,0.5)",
                            transition: "width 0.8s ease",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Analysis panel */}
            <div
              className="rounded-2xl flex flex-col overflow-hidden"
              style={{
                background: "rgba(10,10,22,0.75)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(16px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              <AnalysisPanel result={result} analyzing={analyzing} progress={progress} previewUrl={previewUrl} />
            </div>
          </div>

          {/* Bottom: Chat */}
          <div
            className="rounded-2xl p-3.5 flex flex-col flex-shrink-0"
            style={{
              background: "rgba(10,10,22,0.75)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(16px)",
            }}
          >
            {/* Message list */}
            <div className="max-h-24 overflow-y-auto space-y-2 mb-3 pr-1">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex gap-2.5 text-xs leading-relaxed ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: msg.role === "user" ? "linear-gradient(135deg, #7c3aed, #8b5cf6)" : "rgba(255,255,255,0.05)",
                      border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
                      boxShadow: msg.role === "user" ? "0 2px 8px rgba(124,58,237,0.3)" : "none",
                    }}
                  >
                    <span className="text-[9px] font-bold" style={{ color: msg.role === "user" ? "#fff" : "#8b5cf6" }}>
                      {msg.role === "user" ? "U" : "AI"}
                    </span>
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-xl max-w-[85%]"
                    style={{
                      background: msg.role === "user" ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${msg.role === "user" ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.06)"}`,
                      color: msg.role === "user" ? "#c4b5fd" : "#94a3b8",
                    }}
                  >
                    {msg.isLoading ? (
                      <div className="flex gap-1 py-0.5"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            <div
              className="flex items-center gap-2 p-1.5 rounded-xl"
              style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <input
                type="text"
                disabled={chatLoading}
                placeholder={result ? "Ask to translate, edit or explain..." : "Analyze a diagram to begin chat..."}
                className="flex-1 bg-transparent text-xs outline-none px-2.5"
                style={{ color: "#e2e8f0" }}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSubmit(chatInput); } }}
              />
              <button
                onClick={() => handleChatSubmit(chatInput)}
                disabled={!chatInput.trim() || chatLoading}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 hover:scale-110 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
                  boxShadow: "0 2px 12px rgba(124,58,237,0.4)",
                }}
              >
                {chatLoading ? <Loader2 size={13} className="spin text-white" /> : <Send size={13} className="text-white" />}
              </button>
            </div>

            {/* Suggestion chips */}
            {result && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["Explain simply 🙋", "Java ☕", "TypeScript ⚡", "Complexity ⏱", "Add comments 📝"].map(q => (
                  <button
                    key={q}
                    onClick={() => handleChatSubmit(q)}
                    className="text-[9px] font-semibold px-2.5 py-1 rounded-full transition-all hover:scale-105 active:scale-95"
                    style={{
                      border: "1px solid rgba(139,92,246,0.2)",
                      background: "rgba(139,92,246,0.06)",
                      color: "#94a3b8",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}

// Webcam Panel component
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
    <div className="flex flex-col h-full gap-3 p-2">
      <div className="flex-1 rounded-xl overflow-hidden relative bg-[#0A0A0F] min-h-[200px] border border-[#1E1E2E]">
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        {!on && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Camera size={28} className="text-slate-500" />
            <p className="text-xs font-semibold text-slate-400">Webcam Capture Stream</p>
            <button className="btn bg-[#7C3AED] hover:brightness-110 text-white px-4 py-2 text-xs rounded-xl" onClick={start}>Start Camera</button>
          </div>
        )}
      </div>
      <input className="input px-3.5 py-2.5 text-xs w-full rounded-xl" placeholder="Ask about the capture..." value={q} onChange={e => setQ(e.target.value)} />
      {on && (
        <button className="btn bg-[#7C3AED] hover:brightness-110 text-white py-2.5 text-xs w-full rounded-xl" onClick={capture} disabled={analyzing}>
          {analyzing ? "⏳ Analyzing Capture..." : "📸 Capture & Analyze"}
        </button>
      )}
    </div>
  );
}
