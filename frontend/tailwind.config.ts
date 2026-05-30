import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        accent: {
          primary: "#6366f1",
          secondary: "#8b5cf6",
          tertiary: "#06b6d4",
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "bounce-slow": "bounce 2s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "shimmer": "shimmer 2s ease-in-out infinite",
        "gradient": "gradient-shift 5s ease infinite",
        "float": "float 3s ease-in-out infinite",
        "slide-up": "slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
        "slide-right": "slide-right 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
        "scale-in": "scale-in 0.25s cubic-bezier(0.34,1.56,0.64,1) both",
        "fade-in": "fade-in 0.3s ease both",
        "count-up": "count-up 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        "gradient-shift": {
          "0%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
          "100%": { "background-position": "0% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-right": {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.9)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "count-up": {
          from: { opacity: "0", transform: "translateY(10px) scale(0.85)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "glow-pulse": {
          "0%, 100%": { "box-shadow": "0 0 12px rgba(139,92,246,0.3)" },
          "50%": { "box-shadow": "0 0 28px rgba(139,92,246,0.6), 0 0 50px rgba(99,102,241,0.2)" },
        },
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #6366f1, #8b5cf6)",
        "gradient-premium": "linear-gradient(135deg, #7c3aed, #6366f1, #22d3ee)",
      },
    },
  },
  plugins: [],
};

export default config;
