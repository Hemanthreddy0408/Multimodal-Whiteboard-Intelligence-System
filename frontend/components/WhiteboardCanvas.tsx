"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Trash2, Download, Sparkles, Loader2, Minus, Square, Circle, Pen, Eraser } from "lucide-react";

type Tool = "pen" | "eraser" | "rect" | "circle" | "line";

const COLORS = ["#ffffff", "#818cf8", "#34d399", "#f472b6", "#fbbf24", "#fb923c", "#22d3ee", "#000000"];
const STROKES = [2, 4, 8, 14];

interface Props {
  onAnalyze: (blob: Blob, question?: string) => void;
  analyzing: boolean;
}

export default function WhiteboardCanvas({ onAnalyze, analyzing }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#ffffff");
  const [stroke, setStroke] = useState(3);
  const [drawing, setDrawing] = useState(false);
  const [q, setQ] = useState("");
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const snapRef = useRef<ImageData | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = containerRef.current;
    if (!canvas || !wrap) return;
    const resize = () => {
      const ctx = canvas.getContext("2d")!;
      const saved = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = wrap.clientWidth;
      canvas.height = wrap.clientHeight;
      ctx.fillStyle = "#0e0e1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(saved, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const pos = (e: React.MouseEvent | React.TouchEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    if ("touches" in e) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    return { x: (e as React.MouseEvent).clientX - r.left, y: (e as React.MouseEvent).clientY - r.top };
  };

  const onDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    lastRef.current = pos(e);
    setDrawing(true);
    if (["rect", "circle", "line"].includes(tool)) {
      snapRef.current = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [tool]);

  const onMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !lastRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    const p = pos(e);
    ctx.lineWidth = tool === "eraser" ? stroke * 5 : stroke;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = tool === "eraser" ? "#0e0e1a" : color;

    if (tool === "pen" || tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(lastRef.current.x, lastRef.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastRef.current = p;
    } else if (snapRef.current) {
      ctx.putImageData(snapRef.current, 0, 0);
      if (tool === "rect") {
        ctx.strokeRect(lastRef.current.x, lastRef.current.y, p.x - lastRef.current.x, p.y - lastRef.current.y);
      } else if (tool === "circle") {
        const r = Math.hypot(p.x - lastRef.current.x, p.y - lastRef.current.y);
        ctx.beginPath();
        ctx.arc(lastRef.current.x, lastRef.current.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(lastRef.current.x, lastRef.current.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
    }
  }, [drawing, tool, color, stroke]);

  const onUp = () => { setDrawing(false); lastRef.current = null; snapRef.current = null; };

  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    ctx.fillStyle = "#0e0e1a";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const download = () => {
    const a = document.createElement("a");
    a.download = `whiteboard-${Date.now()}.png`;
    a.href = canvasRef.current!.toDataURL();
    a.click();
  };

  const analyze = () => {
    canvasRef.current?.toBlob(b => b && onAnalyze(b, q || undefined), "image/png");
  };

  const tools: { id: Tool; icon: React.ReactNode; tip: string }[] = [
    { id: "pen",    icon: <Pen size={13} />,    tip: "Pen" },
    { id: "eraser", icon: <Eraser size={13} />, tip: "Eraser" },
    { id: "rect",   icon: <Square size={13} />, tip: "Rectangle" },
    { id: "circle", icon: <Circle size={13} />, tip: "Circle" },
    { id: "line",   icon: <Minus size={13} />,  tip: "Line" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-2 px-3 py-2.5 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(7,7,15,0.5)" }}>
        {/* Tools */}
        <div className="flex items-center gap-1">
          {tools.map(t => (
            <button key={t.id} data-tip={t.tip} onClick={() => setTool(t.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: tool === t.id ? "rgba(99,102,241,0.2)" : "transparent",
                border: `1px solid ${tool === t.id ? "rgba(99,102,241,0.4)" : "transparent"}`,
                color: tool === t.id ? "#818cf8" : "var(--text-3)",
              }}>
              {t.icon}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />

        {/* Colors */}
        <div className="flex items-center gap-1">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={`color-swatch ${color === c ? "selected" : ""}`}
              style={{ background: c }} />
          ))}
        </div>

        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />

        {/* Stroke width */}
        <div className="flex items-center gap-1">
          {STROKES.map(s => (
            <button key={s} onClick={() => setStroke(s)}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: stroke === s ? "rgba(99,102,241,0.2)" : "transparent",
                border: `1px solid ${stroke === s ? "rgba(99,102,241,0.4)" : "transparent"}`,
              }}>
              <div className="rounded-full" style={{ width: s * 1.5, height: s * 1.5, maxWidth: 12, maxHeight: 12, background: stroke === s ? "#818cf8" : "var(--text-3)" }} />
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <button onClick={clear} data-tip="Clear" className="btn btn-ghost w-7 h-7 p-0">
          <Trash2 size={12} color="var(--red)" />
        </button>
        <button onClick={download} data-tip="Download" className="btn btn-ghost w-7 h-7 p-0">
          <Download size={12} />
        </button>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 overflow-hidden" style={{ background: "#0e0e1a" }}>
        <canvas
          ref={canvasRef}
          className={`whiteboard-canvas ${tool === "eraser" ? "eraser" : ""}`}
          style={{ width: "100%", height: "100%" }}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
        />
      </div>

      {/* Bottom */}
      <div className="flex items-center gap-2 p-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <input className="input flex-1 px-3 py-2 text-sm" placeholder="What do you want to know about this drawing?" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && analyze()} />
        <button className="btn btn-primary px-4 py-2 text-sm flex-shrink-0" onClick={analyze} disabled={analyzing} style={{ borderRadius: "var(--r)" }}>
          {analyzing ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />}
          {analyzing ? "..." : "Analyze"}
        </button>
      </div>
    </div>
  );
}
