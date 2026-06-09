"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Loader2, Zap, LayoutGrid, User, Mail, Lock } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
  agree: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Terms and Privacy Policy.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "Empty", color: "bg-slate-800" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1: return { score: 1, label: "Weak", color: "bg-red-500" };
      case 2: return { score: 2, label: "Fair", color: "bg-amber-500" };
      case 3: return { score: 3, label: "Good", color: "bg-blue-500" };
      case 4: return { score: 4, label: "Strong", color: "bg-emerald-500" };
      default: return { score: 1, label: "Weak", color: "bg-red-500" };
    }
  };

  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error || "Registration failed.");
      } else {
        toast.success("Successfully registered! You can now log in.");
        router.push("/login");
      }
    } catch {
      toast.error("An unexpected registration error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen text-theme-primary relative overflow-hidden h-screen" style={{ background: "var(--bg)" }}>
      
      {/* Background */}
      <div className="mesh-bg">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
      </div>

      {/* Left panel decoration (same as Login) */}
      <div 
        className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden z-10"
        style={{
          background: "linear-gradient(135deg, var(--bg-3), var(--bg-2))",
          borderRight: "1px solid var(--card-border)",
          backdropFilter: "blur(20px)"
        }}
      >
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative z-10 max-w-md text-center space-y-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4]">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm text-theme-primary">WhiteboardAI</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-theme-primary">Real-time Stream Engine</h2>
          <p className="text-xs text-theme-secondary">Our deep visual classifier maps inputs to structured adjacency graphs using local model heads.</p>
          
          <div 
            className="relative w-72 h-48 mx-auto border rounded-2xl p-6 flex flex-col justify-between items-center shadow-inner"
            style={{
              background: "var(--bg-3)",
              borderColor: "var(--card-border)",
            }}
          >
            <div className="flex justify-between w-full">
              <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-xs font-bold text-[#7C3AED] animate-[pulse_2s_infinite]">Image</div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-400 animate-[pulse_2.5s_infinite]">OCR</div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-400 animate-[pulse_3s_infinite]">DINO</div>
            </div>
            
            <div className="h-0.5 w-48 bg-gradient-to-r from-[#7C3AED] to-purple-500 relative">
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-[ping_1.5s_infinite]" />
            </div>

            <div className="flex justify-between w-full">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs font-bold text-amber-400">CV2</div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-400">JSON</div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-400">GPT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: Register form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div 
          className="w-full max-w-sm space-y-5 p-8 rounded-2xl shadow-2xl relative z-10 slide-up"
          style={{
            background: "var(--bg-2)",
            border: "1px solid var(--card-border)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.05), 0 0 0 1px rgba(var(--violet-rgb), 0.05)"
          }}
        >
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold text-theme-primary">Create account</h1>
            <p className="text-xs text-theme-secondary">Register to start your free workspace subscription</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-theme-secondary uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="John Doe"
                  {...register("name")}
                  className={`input w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-theme-panel/60 border-theme text-theme-primary ${errors.name ? "border-red-500" : ""}`}
                />
                <User size={12} className="absolute left-3.5 top-3 text-slate-400" />
              </div>
              {errors.name && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{errors.name.message}</p>}
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-theme-secondary uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <input 
                  type="email"
                  placeholder="name@company.com"
                  {...register("email")}
                  className={`input w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-theme-panel/60 border-theme text-theme-primary ${errors.email ? "border-red-500" : ""}`}
                />
                <Mail size={12} className="absolute left-3.5 top-3 text-slate-400" />
              </div>
              {errors.email && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-theme-secondary uppercase tracking-wider">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  onChange={e => {
                    register("password").onChange(e);
                    setPasswordValue(e.target.value);
                  }}
                  className={`input w-full pl-9 pr-9 py-2 text-xs rounded-xl bg-theme-panel/60 border-theme text-theme-primary ${errors.password ? "border-red-500" : ""}`}
                />
                <Lock size={12} className="absolute left-3.5 top-3 text-slate-400" />
                <button 
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{errors.password.message}</p>}
              
              {/* Strength Meter */}
              {passwordValue && (
                <div className="space-y-1 mt-1.5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                    <span>Password Strength</span>
                    <span style={{ color: `var(--${strength.color.replace('bg-', '')})` }}>{strength.label}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 h-1">
                    {[1, 2, 3, 4].map(step => (
                      <div 
                        key={step} 
                        className={`h-full rounded-full transition-all ${
                          strength.score >= step ? strength.color : "bg-slate-800"
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-theme-secondary uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <input 
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className={`input w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-theme-panel/60 border-theme text-theme-primary ${errors.confirmPassword ? "border-red-500" : ""}`}
                />
                <Lock size={12} className="absolute left-3.5 top-3 text-slate-400" />
              </div>
              {errors.confirmPassword && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{errors.confirmPassword.message}</p>}
            </div>

            {/* Checkbox agree */}
            <div className="flex items-start gap-2 pt-1.5">
              <input 
                type="checkbox" 
                id="agree" 
                {...register("agree")}
                className="mt-0.5 rounded border-theme text-[#7C3AED] focus:ring-[#7C3AED] bg-theme-panel/60"
              />
              <label htmlFor="agree" className="text-[10px] text-theme-secondary leading-tight">
                I agree to the Terms of Service and Privacy Policy.
              </label>
            </div>
            {errors.agree && <p className="text-[10px] text-red-500 font-semibold mt-0.5">{errors.agree.message}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="btn bg-gradient-to-tr from-[var(--indigo)] to-[var(--violet)] text-black w-full py-2.5 rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-cyan-500/10 mt-4 cursor-pointer transition-all"
            >
              {loading ? <Loader2 size={13} className="spin" /> : "Create account"}
            </button>
          </form>

          <p className="text-center text-xs text-theme-secondary">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--violet)] font-bold hover:underline">
              Sign in →
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}
