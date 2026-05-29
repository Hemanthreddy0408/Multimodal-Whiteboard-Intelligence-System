"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Loader2, Zap, Lock, Mail } from "lucide-react";

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Successfully logged in!");
        router.push("/dashboard");
      }
    } catch {
      toast.error("An unexpected login error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = async (provider: "google" | "github") => {
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch {
      toast.error(`Failed to initialize ${provider} login.`);
    }
  };

  return (
    <div className="flex min-h-screen bg-theme-bg">
      
      {/* Left panel decoration: animated pipeline nodes */}
      <div className="hidden lg:flex lg:w-1/2 bg-theme-panel border-r border-theme flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Abstract background grids */}
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative z-10 max-w-md text-center space-y-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4]">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-sm text-theme-primary">WhiteboardAI</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-theme-primary">AI Compilation Architecture</h2>
          <p className="text-xs text-theme-secondary">Our deep visual classifier maps inputs to structured adjacency graphs using local model heads.</p>
          
          {/* Animated node diagram mockup */}
          <div className="relative w-72 h-48 mx-auto border border-theme rounded-2xl bg-theme-bg/80 p-6 flex flex-col justify-between items-center shadow-inner">
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

      {/* Right panel: auth card form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 bg-theme-panel border border-theme p-8 rounded-2xl shadow-xl">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold text-theme-primary">Welcome back</h1>
            <p className="text-xs text-theme-secondary">Sign in to your workspace dashboard</p>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button"
              onClick={() => socialLogin("google")}
              className="flex items-center justify-center gap-1.5 border border-theme hover:bg-white/5 py-2.5 rounded-xl text-xs font-semibold text-theme-primary transition-all"
            >
              <svg className="w-3.5 h-3.5 mr-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg> Google
            </button>
            <button 
              type="button"
              onClick={() => socialLogin("github")}
              className="flex items-center justify-center gap-1.5 border border-theme hover:bg-white/5 py-2.5 rounded-xl text-xs font-semibold text-theme-primary transition-all"
            >
              <svg className="w-3.5 h-3.5 mr-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg> GitHub
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-theme"></div>
            <span className="flex-shrink mx-3 text-[10px] text-theme-muted uppercase tracking-widest font-bold">or</span>
            <div className="flex-grow border-t border-theme"></div>
          </div>

          {/* Login Credentials Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-theme-secondary uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <input 
                  type="email"
                  placeholder="name@company.com"
                  {...register("email")}
                  className={`input w-full pl-9 pr-3 py-2 text-xs rounded-xl ${errors.email ? "border-red-500" : ""}`}
                />
                <Mail size={12} className="absolute left-3.5 top-3 text-slate-400" />
              </div>
              {errors.email && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold text-theme-secondary uppercase tracking-wider">Password</label>
                <span className="text-[10px] font-bold text-[#7C3AED] hover:underline cursor-pointer">Forgot?</span>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                  className={`input w-full pl-9 pr-9 py-2 text-xs rounded-xl ${errors.password ? "border-red-500" : ""}`}
                />
                <Lock size={12} className="absolute left-3.5 top-3 text-slate-400" />
                <button 
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.password.message}</p>}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="btn bg-[#7C3AED] hover:brightness-110 text-white font-bold text-xs py-2.5 rounded-xl w-full flex items-center justify-center gap-1.5 shadow-lg shadow-[#7C3AED]/20 mt-6"
            >
              {loading ? <Loader2 size={13} className="spin" /> : "Sign in"}
            </button>
          </form>

          <p className="text-center text-xs text-theme-secondary">
            Don't have an account?{" "}
            <Link href="/register" className="text-[#7C3AED] font-bold hover:underline">
              Register →
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}
