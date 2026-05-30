"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Check, Star, HelpCircle, ChevronDown, Zap } from "lucide-react";

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const plans = [
    {
      name: "Free",
      price: "$0",
      desc: "For students and casual use",
      features: [
        "50 analyses per month",
        "8 target programming languages",
        "7-day session history storage",
        "Community support channel"
      ],
      cta: "Get started",
      href: "/register",
      featured: false
    },
    {
      name: "Pro",
      price: annual ? "$9.60" : "$12",
      desc: "For software engineers and power users",
      features: [
        "500 analyses per month",
        "Priority AI processing (faster queue)",
        "Unlimited session history archive",
        "Camera + live canvas whiteboard",
        "API programmatic keys access",
        "Direct email customer support"
      ],
      cta: "Start free trial",
      href: "/register?plan=pro",
      featured: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      desc: "For teams and organizations",
      features: [
        "Unlimited monthly analyses",
        "Self-hosted container options",
        "SSO / SAML authentication",
        "Dedicated account manager",
        "Custom model fine-tuning support",
        "SLA uptime guarantee"
      ],
      cta: "Contact us",
      href: "mailto:sales@whiteboardai.com",
      featured: false
    }
  ];

  const faqs = [
    {
      q: "What counts as an analysis?",
      a: "Every time you upload an image, draw on the whiteboard, or use your camera and hit the 'Analyze Diagram' button, it counts as one analysis. If you type follow-up questions to refactor the generated code in real time, those are free and do not count towards your monthly limit."
    },
    {
      q: "Can I switch plans anytime?",
      a: "Yes, you can upgrade, downgrade, or cancel your subscription at any time. When you upgrade, the changes take effect immediately. Downgrades or cancellations will apply at the end of your current billing cycle."
    },
    {
      q: "Is my data private?",
      a: "Absolutely. We are SOC-2 compliant. Your diagrams, images, and code outputs are securely stored in your personal account database. We never use your proprietary drawings to train our models."
    },
    {
      q: "Do you offer student discounts?",
      a: "Yes! Students get a 50% discount on the Pro plan. Please sign up using your university '.edu' email address or send us a copy of your student ID to support@whiteboardai.com to get the discount code."
    },
    {
      q: "What programming languages are supported?",
      a: "Currently, our code generation engine outputs clean, executable code in Python, JavaScript, TypeScript, Java, C++, Go, Rust, and Kotlin."
    }
  ];

  return (
    <div className="min-h-screen text-theme-primary flex flex-col font-sans overflow-x-hidden relative" style={{ background: "var(--bg)" }}>
      
      {/* Background */}
      <div className="mesh-bg">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
      </div>

      {/* Navbar */}
      <Navbar />

      <section className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center space-y-12 z-10">
        <div className="space-y-4 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-theme-primary">
            Simple, transparent pricing
          </h1>
          <p className="text-sm text-theme-secondary">
            Start free. Upgrade when you need more power and unlimited history.
          </p>
        </div>

        {/* Toggle billing switch */}
        <div className="flex items-center justify-center gap-3">
          <span className={`text-xs font-semibold ${!annual ? "text-theme-primary" : "text-theme-muted"}`}>Monthly</span>
          <button 
            onClick={() => setAnnual(p => !p)}
            className="w-12 h-6 rounded-full bg-white/10 p-0.5 relative transition-all duration-300 cursor-pointer"
          >
            <div className={`w-5 h-5 rounded-full bg-[#7C3AED] transition-all duration-300 ${annual ? "translate-x-6" : ""}`} />
          </button>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold ${annual ? "text-theme-primary" : "text-theme-muted"}`}>Annually</span>
            <span className="px-2 py-0.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[9px] font-bold text-[#06B6D4]">
              Save 20%
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-8">
          {plans.map((p, idx) => (
            <div 
              key={idx} 
              className="p-8 rounded-2xl border text-left flex flex-col justify-between relative transition-all slide-up hover:scale-[1.02]"
              style={{
                background: "rgba(12,12,26,0.7)",
                borderColor: p.featured ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.06)",
                boxShadow: p.featured ? "0 10px 40px rgba(124,58,237,0.15), 0 0 0 1px rgba(124,58,237,0.2)" : "0 10px 30px rgba(0,0,0,0.3)",
                backdropFilter: "blur(12px)",
                animationDelay: `${idx * 0.08}s`
              }}
            >
              {p.featured && (
                <span className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 rounded-full bg-[#7C3AED] text-[9px] font-black uppercase text-white tracking-widest flex items-center gap-1">
                  <Star size={9} className="fill-white" /> Most Popular
                </span>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-theme-secondary uppercase tracking-wider">{p.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-black text-theme-primary">{p.price}</span>
                    <span className="text-xs text-theme-muted">{p.price !== "Custom" ? "/month" : ""}</span>
                  </div>
                  <p className="text-xs text-theme-secondary mt-2 min-h-[32px]">{p.desc}</p>
                </div>

                <div className="border-t border-theme pt-6 space-y-4">
                  {p.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Check size={14} className="text-[#06B6D4] mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-slate-300 leading-normal">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <Link 
                  href={p.href}
                  className={`btn text-center font-bold text-xs py-3 rounded-xl w-full block transition-all cursor-pointer ${
                    p.featured 
                      ? "bg-gradient-to-tr from-[#7C3AED] to-[#8B5CF6] text-white shadow-lg shadow-[#7C3AED]/20 hover:brightness-110" 
                      : "border border-theme text-theme-secondary hover:bg-white/5"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="py-24 px-4 max-w-3xl mx-auto w-full space-y-12 z-10">
        <div className="text-center space-y-3">
          <HelpCircle className="text-[#7C3AED] mx-auto" size={32} />
          <h2 className="text-2xl font-bold tracking-tight text-theme-primary">Frequently Asked Questions</h2>
          <p className="text-xs text-theme-muted">Need help with something else? Reach out to support@whiteboardai.com.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <div 
                key={i} 
                className="border border-theme rounded-xl overflow-hidden transition-all"
                style={{
                  background: "rgba(12,12,26,0.4)",
                  backdropFilter: "blur(8px)"
                }}
              >
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="flex items-center justify-between w-full p-5 text-left font-bold text-xs text-theme-primary hover:bg-white/5 transition-all cursor-pointer"
                >
                  <span>{f.q}</span>
                  <ChevronDown size={14} className={`text-theme-secondary transition-all ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="px-5 pb-5 pt-1 text-xs text-theme-secondary leading-relaxed border-t border-theme/40 mt-1">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-theme bg-theme-bg/60 py-10 text-center text-xs text-theme-muted z-10">
        <span>© 2026 WhiteboardAI. All rights reserved.</span>
      </footer>

    </div>
  );
}
