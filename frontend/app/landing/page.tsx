"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { 
  Zap, Cpu, Code2, Database, Shield, Camera, Check, 
  ArrowRight, Users, Star, ArrowUpRight, Play, X,
  FileImage, Brain, Layers
} from "lucide-react";

export default function LandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);

  const features = [
    {
      icon: Camera,
      title: "Any input source",
      desc: "Upload PNG/JPG, draw on our live whiteboard, or use your webcam directly."
    },
    {
      icon: Cpu,
      title: "7-model AI pipeline",
      desc: "OpenCV → TrOCR → DINOv2 → GPT-4o working in sync for deep structure understanding."
    },
    {
      icon: Code2,
      title: "8 languages supported",
      desc: "Python, JavaScript, TypeScript, Java, C++, Go, Rust, Kotlin."
    },
    {
      icon: Zap,
      title: "Real-time streaming",
      desc: "Code streams token by token via WebSocket as the AI understands the drawing."
    },
    {
      icon: Database,
      title: "Session history archive",
      desc: "Every diagram analysis saved persistently. Restore any workspace in one click."
    },
    {
      icon: Shield,
      title: "Private and secure",
      desc: "Your code and diagram data never leave our servers. SOC 2 compliant."
    }
  ];

  const steps = [
    { num: "01", title: "Upload diagram", desc: "Drag and drop your diagram snapshot, open the live canvas, or capture directly with your camera." },
    { num: "02", title: "Preprocess image", desc: "Adaptive thresholding and deskewing normalize contrast, align node shapes, and separate background textures." },
    { num: "03", title: "OCR handwritten text", desc: "Transformers OCR reads variable names, functions, operations, and loops from raw drawing regions." },
    { num: "04", title: "Classify diagram type", desc: "DINOv2 categorizes your diagram (flowchart, BST, linked list, graph) with high precision." },
    { num: "05", title: "Extract connections", desc: "OpenCV contours map shapes, detecting edges, path flow arrows, and linked relationships." },
    { num: "06", title: "Generate working code", desc: "GPT-4o converts visual bounds into clean, well-commented code in your target language." }
  ];

  const testimonials = [
    {
      name: "Arjun M.",
      role: "SDE at Amazon",
      text: "Saved me hours during interview prep. I draw the binary search tree, it writes the traversal. The visual overlays are exceptionally clean."
    },
    {
      name: "Sarah L.",
      role: "CS Professor",
      text: "An incredible tool for demonstrating algorithms. Students can sketch graphs on whiteboards and instantly run code in their chosen syntax."
    },
    {
      name: "Marcus K.",
      role: "Tech Lead",
      text: "Ideal for translating system design sketches into code. The NextAuth session history and restore features are exactly what our team needed."
    }
  ];

  return (
    <div className="min-h-screen bg-theme-bg text-theme-primary flex flex-col font-sans overflow-x-hidden transition-colors duration-250">
      
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center space-y-12">
        {/* Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none -z-10" />

        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-[#7C3AED]/20 text-[10px] uppercase tracking-wider font-extrabold text-[#7C3AED]">
            <Zap size={10} /> Phase 3 Live
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-theme-primary">
            Turn any whiteboard <br />
            into <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">working code</span>
          </h1>
          <p className="text-sm sm:text-base text-theme-secondary max-w-2xl mx-auto leading-relaxed">
            Upload a photo, draw live, or use your camera. Our AI pipeline understands DSA diagrams, flowcharts, and pseudocode — and generates production-ready code in 7 languages.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register" className="btn bg-gradient-to-tr from-[#7C3AED] to-[#8B5CF6] hover:brightness-110 text-white font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-[#7C3AED]/20">
            Start for free <ArrowRight size={13} />
          </Link>
          <button onClick={() => setDemoOpen(true)} className="btn border border-theme bg-white/5 hover:bg-white/10 text-theme-primary font-bold text-xs px-6 py-3 rounded-xl flex items-center gap-2">
            <Play size={13} /> Watch demo
          </button>
        </div>

        {/* Social Proof badge */}
        <div className="flex items-center justify-center gap-2.5 text-xs text-theme-secondary">
          <Users size={14} className="text-[#06B6D4]" />
          <span>Trusted by 2,400+ engineers and CS students</span>
        </div>

        {/* Mockup Frame */}
        <div className="max-w-4xl mx-auto mt-16 rounded-2xl border border-theme bg-theme-panel p-2.5 shadow-2xl relative">
          {/* Glowing glow border */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] opacity-10 blur-xl pointer-events-none" />
          
          <div className="rounded-xl overflow-hidden bg-theme-bg border border-theme aspect-video flex flex-col">
            <div className="h-8 bg-theme-panel border-b border-theme flex items-center px-4 gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              <span className="text-[10px] text-theme-muted ml-4 font-mono">whiteboardai.com/workspace</span>
            </div>
            
            {/* Demo static layout representation */}
            <div className="flex-1 grid grid-cols-2 p-4 gap-4 bg-theme-bg text-left">
              <div className="border border-theme rounded-xl bg-white/5 p-4 flex flex-col justify-between">
                <div className="border-2 border-[#7C3AED] rounded-lg p-6 bg-[#7C3AED]/5 border-dashed text-center">
                  <FileImage size={24} className="text-[#7C3AED] mx-auto mb-2" />
                  <span className="text-xs font-bold text-theme-primary">Binary Search Tree Drawing</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg text-[10px] border border-theme">
                  <span className="font-bold text-theme-secondary">Classified: BST</span>
                  <span className="text-emerald-400 font-bold">Confidence: 96%</span>
                </div>
              </div>
              <div className="border border-theme rounded-xl bg-theme-panel p-4 flex flex-col justify-between">
                <pre className="font-mono text-[9px] text-[#06B6D4] leading-relaxed">
{`# Generated BST node structure
class Node:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

def inorder(root):
    if root:
        inorder(root.left)
        print(root.val)
        inorder(root.right)`}
                </pre>
                <div className="bg-[#7C3AED]/10 text-[#7C3AED] p-2 rounded-lg text-[9px] border border-[#7C3AED]/20">
                  ⚡ Code streams token by token via WebSocket.
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 bg-theme-panel/30 border-y border-theme">
        <div className="max-w-7xl mx-auto w-full space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-theme-primary">Packed with enterprise-grade tools</h2>
            <p className="text-xs text-theme-secondary max-w-md mx-auto">Everything you need to convert design whiteboard architectures into code repositories.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-2xl border border-theme bg-theme-panel/40 space-y-4 hover:border-[#7C3AED]/40 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center border border-[#7C3AED]/20 group-hover:bg-[#7C3AED]/20 transition-all">
                  <f.icon className="text-[#7C3AED]" size={18} />
                </div>
                <h3 className="font-bold text-sm text-theme-primary">{f.title}</h3>
                <p className="text-xs text-theme-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works vertical stepper */}
      <section className="py-24 px-4 max-w-3xl mx-auto w-full space-y-16">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight text-theme-primary">The 6-Step Compilation Engine</h2>
          <p className="text-xs text-theme-secondary max-w-sm mx-auto">A visual representation of the multiclass computer vision pipeline.</p>
        </div>

        <div className="relative border-l-2 border-theme ml-4 pl-8 space-y-10">
          {steps.map((s, idx) => (
            <div key={idx} className="relative">
              <div className="absolute left-[-45px] top-0 w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] flex items-center justify-center font-black text-xs text-white shadow-md shadow-[#7C3AED]/20">
                {s.num}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-theme-primary">{s.title}</h3>
                <p className="text-xs text-theme-secondary leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-theme-panel/20 border-t border-theme">
        <div className="max-w-7xl mx-auto w-full space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-theme-primary">Engineers love WhiteboardAI</h2>
            <p className="text-xs text-theme-secondary">See how developers around the world accelerate their algorithm explanations.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div key={idx} className="p-6 rounded-2xl border border-theme bg-theme-panel space-y-4 flex flex-col justify-between">
                <p className="text-xs text-theme-secondary leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-xs font-bold text-white">
                    {t.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-100">{t.name}</h4>
                    <p className="text-[10px] text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-theme bg-theme-bg py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-theme-secondary">Product</h4>
            <ul className="space-y-2 text-xs text-theme-muted">
              <li><Link href="#features" className="hover:text-slate-300">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-slate-300">Pricing</Link></li>
              <li><span className="opacity-50">Changelog</span></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Company</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><Link href="/about" className="hover:text-slate-300">About Pipeline</Link></li>
              <li><span className="opacity-50">Blog</span></li>
              <li><span className="opacity-50">Careers</span></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Legal</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><span className="opacity-50">Privacy Policy</span></li>
              <li><span className="opacity-50">Terms of Service</span></li>
              <li><span className="opacity-50">Cookie Policy</span></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Connect</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><span className="opacity-50">GitHub</span></li>
              <li><span className="opacity-50">Twitter</span></li>
              <li><span className="opacity-50">LinkedIn</span></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-theme pt-8 flex items-center justify-between text-xs text-theme-muted">
          <span>© 2026 WhiteboardAI. All rights reserved.</span>
          <span className="flex items-center gap-1"><Star size={12} className="text-amber-500" /> SOC-2 Certified</span>
        </div>
      </footer>

      {/* Video Modal Demo */}
      {demoOpen && (
        <div className="fixed inset-0 z-50 bg-theme-bg/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl rounded-2xl overflow-hidden border border-theme bg-theme-panel shadow-2xl">
            <button onClick={() => setDemoOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-theme-muted hover:text-theme-primary z-10">
              <X size={18} />
            </button>
            <div className="aspect-video bg-theme-bg flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#7C3AED]/10 flex items-center justify-center text-[#7C3AED]">
                <Layers size={32} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-theme-primary">WhiteboardAI 30-Second Compilation Demo</h3>
                <p className="text-xs text-theme-muted mt-1 max-w-sm mx-auto">Watch DINOv2 categorize and OpenCV contour map nodes in real time.</p>
              </div>
              <div className="w-full max-w-md h-2 progress-track">
                <div className="h-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] rounded-full animate-[pulse_2s_infinite]" style={{ width: "70%" }} />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
