"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Trash2, MessageSquare, Loader2, Zap } from "lucide-react";
import { AnalysisResult, ChatMessage } from "@/types";

const QUICK = [
  "Explain this simply 🙋",
  "Generate JavaScript code",
  "What's the time complexity?",
  "What design pattern is this?",
  "List all relationships",
  "Convert to TypeScript",
];

interface Props {
  result: AnalysisResult | null;
  backend: string;
}

export default function ChatInterface({ result, backend }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Hi! Upload a diagram and I'll answer anything about it — from explaining the algorithm to generating code in any language.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastResultId = useRef<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Announce when analysis finishes
  useEffect(() => {
    if (result && result.upload_id !== lastResultId.current) {
      lastResultId.current = result.upload_id;
      setMessages(prev => [...prev, {
        id: `ready-${Date.now()}`,
        role: "assistant",
        content: `✅ Analysis complete! I've processed your **${result.diagram_type}** diagram.\n\n${result.summary ? `**Summary:** ${result.summary}\n\n` : ""}Ask me anything — code generation, explanation, complexity analysis, or anything else!`,
        timestamp: new Date(),
      }]);
    }
  }, [result?.upload_id]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text, timestamp: new Date() };
    const loadMsg: ChatMessage = { id: `l-${Date.now()}`, role: "assistant", content: "", timestamp: new Date(), isLoading: true };

    setMessages(p => [...p, userMsg, loadMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${backend}/api/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, context: result || {}, upload_id: result?.upload_id }),
      });

      const answer = res.ok
        ? (await res.json()).answer
        : "⚠️ Backend not responding. Make sure it's running on port 8000.";

      setMessages(p => p.map(m => m.isLoading ? { ...m, content: answer, isLoading: false } : m));
    } catch {
      setMessages(p => p.map(m => m.isLoading
        ? { ...m, content: "⚠️ Couldn't reach backend. Run: `cd backend && uvicorn main:app --reload`", isLoading: false }
        : m));
    } finally {
      setLoading(false);
    }
  }, [loading, result, backend]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}>
            <MessageSquare size={13} color="#818cf8" />
          </div>
          <span className="font-bold text-sm" style={{ color: "var(--text-1)" }}>AI Chat</span>
          {result && <span className="badge badge-green" style={{ fontSize: 10 }}>Context Ready</span>}
        </div>
        <button onClick={() => setMessages([{ id: "w2", role: "assistant", content: "Chat cleared! Ask me anything.", timestamp: new Date() }])}
          className="btn btn-ghost w-7 h-7 p-0" title="Clear chat">
          <Trash2 size={12} />
        </button>
      </div>

      {/* Quick prompts when no result */}
      {!result && (
        <div className="px-3 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs mb-2 font-semibold uppercase tracking-widest" style={{ color: "var(--text-4)" }}>Quick prompts</p>
          <div className="flex flex-wrap gap-1">
            {QUICK.slice(0, 4).map(q => (
              <button key={q} onClick={() => send(q)}
                className="text-xs px-2.5 py-1.5 rounded-lg transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "var(--text-3)", cursor: "pointer" }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""} slide-up`}>
            {/* Avatar */}
            <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: msg.role === "user" ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(99,102,241,0.12)",
                border: msg.role === "user" ? "none" : "1px solid rgba(99,102,241,0.2)",
                boxShadow: msg.role === "user" ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
              }}>
              {msg.role === "user"
                ? <User size={13} color="white" />
                : <Bot size={13} color="#818cf8" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] px-3 py-2.5 text-xs leading-relaxed ${msg.role === "user" ? "bubble-user" : "bubble-ai"}`}>
              {msg.isLoading
                ? <div className="flex items-center gap-1 py-0.5"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div>
                : <p className="whitespace-pre-wrap" style={{ lineHeight: 1.6 }}>{msg.content}</p>
              }
            </div>
          </div>
        ))}

        {/* Quick prompts after result */}
        {result && (
          <div className="flex flex-wrap gap-1 pt-1">
            {QUICK.map(q => (
              <button key={q} onClick={() => send(q)}
                className="text-xs px-2 py-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--text-3)", cursor: "pointer" }}>
                {q}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-end gap-2 p-2 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
          <textarea
            className="flex-1 bg-transparent text-xs outline-none resize-none"
            style={{ color: "var(--text-1)", maxHeight: 80, minHeight: 20, lineHeight: 1.5, fontFamily: "Inter, sans-serif" }}
            placeholder={result ? "Ask about the diagram... (Enter to send)" : "Upload a diagram first..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            rows={1}
          />
          <button onClick={() => send(input)} disabled={!input.trim() || loading}
            className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0 transition-all"
            style={{
              background: input.trim() && !loading ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.06)",
              color: input.trim() && !loading ? "white" : "var(--text-3)",
              boxShadow: input.trim() && !loading ? "0 4px 12px rgba(99,102,241,0.4)" : "none",
            }}>
            {loading ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
          </button>
        </div>
        <p className="text-center text-xs mt-2" style={{ color: "var(--text-4)" }}>
          GPT-4o · Gemini 1.5 · Llama 3 (local)
        </p>
      </div>
    </div>
  );
}
