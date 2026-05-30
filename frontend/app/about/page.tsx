"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { 
  ArrowLeft, Cpu, ShieldCheck, Zap, Layers, 
  Settings, Image, FileText, Activity, Database
} from "lucide-react";

export default function AboutPage() {
  const { data: session, status } = useSession();
  
  const steps = [
    {
      number: 1,
      title: "Image Upload & Preprocessing",
      subtitle: "OpenCV & Pillow deskew, denoise, and thresholding",
      desc: "When you upload an image or take a whiteboard snapshot, the system normalizes the image. It converts it to grayscale, applies adaptive thresholding, removes high-frequency noise, and deskews perspective lines to align diagram structures.",
      icon: Image
    },
    {
      number: 2,
      title: "Handwritten OCR Extraction",
      subtitle: "Microsoft TrOCR (Transformer OCR)",
      desc: "Our pipeline executes a local TrOCR model fine-tuned for handwritten text. It extracts alphanumeric strings, variables, and comments from the whiteboard drawing, saving word boundaries and coordinate bounds.",
      icon: FileText
    },
    {
      number: 3,
      title: "Diagram Type Classification",
      subtitle: "DINOv2 Deep Feature Embeddings",
      desc: "DINOv2 processes the drawing to extract high-dimensional semantic vision embeddings. A classification head categorizes the sketch into one of 6 classes (flowchart, binary search tree, linked list, graph, pseudocode, UML) with active confidence scores.",
      icon: Activity
    },
    {
      number: 4,
      title: "Structural Graph Extraction",
      subtitle: "OpenCV Contour & Line Analysis",
      desc: "The core geometry engine runs edge contour detection. It identifies closed loops (rectangles, circles representing nodes) and paths (lines and arrows representing directional edges). It creates a structured adjacency list mapping nodes and edge connectors.",
      icon: Layers
    },
    {
      number: 5,
      title: "Intermediate Representation Synthesis",
      subtitle: "Grounded Language-Neutral Descriptor",
      desc: "We merge the structural layout from OpenCV and detected text labels into a concise, unified JSON and text description. For example, a BST is translated to: 'diagram: binary_tree, root: 8, children: [3, 10]'.",
      icon: Database
    },
    {
      number: 6,
      title: "LLM Code Generation",
      subtitle: "GPT-4o & Gemini Reasoning Head",
      desc: "The system passes the structured intermediate description to the generative assistant. GPT-4o synthesizes idiomatic, highly performant code in Python, C++, Java, JS/TS, Go, or Rust with explanations and complexity calculations.",
      icon: Cpu
    },
    {
      number: 7,
      title: "Real-time Token Streaming",
      subtitle: "FastAPI Async WebSockets",
      desc: "As the LLM generates tokens, FastAPI streams them asynchronously over a WebSocket connection directly to the browser. The frontend renders code snippets in real time using syntax-highlighted editor boxes.",
      icon: Zap
    }
  ];

  return (
    <div className="min-h-screen text-theme-primary flex flex-col font-sans overflow-hidden h-screen" style={{ background: "var(--bg)" }}>
      
      {/* Background */}
      <div className="mesh-bg">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
      </div>

      {/* Navbar */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden relative z-10">
        {status === "authenticated" && <Sidebar />}

        <main className="flex-grow p-6 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">
          
          {/* Navigation Back Link */}
          <div className="flex items-center justify-between">
            <Link 
              href={status === "authenticated" ? "/dashboard" : "/landing"} 
              className="flex items-center gap-2 text-xs font-semibold text-theme-secondary hover:text-theme-primary transition-all"
            >
              <ArrowLeft size={14} /> Back to {status === "authenticated" ? "Dashboard" : "Home"}
            </Link>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-theme-secondary uppercase tracking-widest">Local Engine Online</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#818cf8] via-[#a78bfa] to-[#22d3ee] bg-clip-text text-transparent">
              AI Whiteboard Compiler Pipeline
            </h1>
            <p className="text-xs text-theme-secondary max-w-lg mx-auto">
              Learn how our multimodal system converts drawings, handwritten graphs, and flowcharts into functional source code.
            </p>
          </div>

          {/* Stepper Card */}
          <div 
            className="p-8 rounded-2xl border border-theme shadow-xl slide-up"
            style={{
              background: "rgba(12,12,26,0.7)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="relative border-l border-theme ml-4 pl-8 space-y-12">
              
              {steps.map((step, idx) => (
                <div key={step.number} className="relative">
                  
                  {/* Step Circle Indicator */}
                  <div 
                    className="absolute left-[-45px] top-0 w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-lg shadow-[#7C3AED]/20 transition-all"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
                      animation: `scale-in 0.3s cubic-bezier(0.34,1.56,0.64,1) ${idx * 0.05}s both`,
                    }}
                  >
                    {step.number}
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <step.icon size={16} className="text-[#06B6D4]" />
                      <h3 className="font-bold text-sm text-theme-primary">{step.title}</h3>
                    </div>
                    <p className="text-[10px] text-[#7C3AED] font-semibold uppercase tracking-wider">{step.subtitle}</p>
                    <p className="text-xs text-theme-secondary leading-relaxed">{step.desc}</p>
                  </div>

                </div>
              ))}

            </div>
          </div>

          {/* Footer Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div 
              className="p-5 rounded-2xl border border-theme flex gap-3.5"
              style={{
                background: "rgba(12,12,26,0.7)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Cpu className="text-[#7C3AED] flex-shrink-0" size={18} />
              <div>
                <h4 className="text-xs font-bold text-theme-primary">Local PyTorch / CV2</h4>
                <p className="text-[10px] text-theme-secondary mt-1.5 leading-normal">HuggingFace transformers pipeline, DINOv2 classification features, and OpenCV contours processed locally.</p>
              </div>
            </div>
            <div 
              className="p-5 rounded-2xl border border-theme flex gap-3.5"
              style={{
                background: "rgba(12,12,26,0.7)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Layers className="text-purple-400 flex-shrink-0" size={18} />
              <div>
                <h4 className="text-xs font-bold text-theme-primary">Redis Language Cache</h4>
                <p className="text-[10px] text-theme-secondary mt-1.5 leading-normal">Intermediate visual representations are cached to guarantee instant target language switching without re-run.</p>
              </div>
            </div>
            <div 
              className="p-5 rounded-2xl border border-theme flex gap-3.5"
              style={{
                background: "rgba(12,12,26,0.7)",
                backdropFilter: "blur(12px)",
              }}
            >
              <ShieldCheck className="text-[#06B6D4] flex-shrink-0" size={18} />
              <div>
                <h4 className="text-xs font-bold text-theme-primary">PostgreSQL Session Sync</h4>
                <p className="text-[10px] text-theme-secondary mt-1.5 leading-normal">Every capture is recorded into a persistent relation allowing full workspace restoration at any time.</p>
              </div>
            </div>
          </div>

        </main>
      </div>

    </div>
  );
}
