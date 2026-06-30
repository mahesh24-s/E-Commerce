"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Zap, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { loginSuccess, setLoading, setError } from "@/store/slices/authSlice";
import { loginUser } from "@/lib/services/auth.service";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please fill in all fields.");
      return;
    }
    setIsLoading(true);
    dispatch(setLoading(true));
    try {
      const { user, accessToken } = await loginUser(form);
      dispatch(loginSuccess({ user, token: accessToken, role: user.role }));
      localStorage.setItem("shopease_token", accessToken);
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === "seller") {
        router.push("/seller/dashboard");
      } else if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (err) {
      const msg = err?.message || "Invalid email or password.";
      toast.error(msg);
      dispatch(setError(msg));
    } finally {
      setIsLoading(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-[#fcf9f8]">
      {/* ── Left: Background Visual ────────────────────────── */}
      <div className="hidden lg:block lg:w-[45%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f1a14] via-[#002819] to-[#06402b]" />

        {/* Animated orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] left-[10%] w-[350px] h-[350px] bg-[#9cd2b5] rounded-full blur-[80px]"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[15%] right-[5%] w-[280px] h-[280px] bg-[#b8efd0] rounded-full blur-[60px]"
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <Zap className="w-[18px] h-[18px] text-white fill-white" />
            </div>
            <span
              className="text-2xl font-bold text-white tracking-tight"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              ShopEase
            </span>
          </Link>

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-6"
          >
            <p className="text-[#9cd2b5] text-sm font-semibold tracking-widest uppercase">
              Welcome back
            </p>
            <h2
              className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Sign in to
              <br />
              your world of
              <br />
              <span className="text-[#b8efd0]">premium</span> picks.
            </h2>
            <p className="text-white/50 text-base max-w-xs">
              Your curated shopping experience awaits. Thousands of premium products, one seamless platform.
            </p>
          </motion.div>

          {/* Floating testimonial card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="bg-white/8 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#9cd2b5]/20 rounded-full flex items-center justify-center shrink-0 border border-[#9cd2b5]/30 text-lg">
                😊
              </div>
              <div>
                <p className="text-white/80 text-sm leading-relaxed">
                  "ShopEase has completely transformed how I shop online. The quality is unmatched!"
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="text-yellow-400 text-xs">★</span>
                    ))}
                  </div>
                  <span className="text-white/40 text-xs">— Sarah M., Verified Buyer</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Right: Login Form ───────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#fcf9f8] to-[#f0eded]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#b8efd0]/20 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-[#002819] rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span
              className="text-xl font-bold text-[#002819] tracking-tight"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              ShopEase
            </span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-4xl font-extrabold text-[#002819] mb-2 tracking-tight"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Welcome back
            </h1>
            <p className="text-[#404943] text-base">
              Sign in to access your ShopEase account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#1c1b1b] px-1"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717973] pointer-events-none" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@example.com"
                  className="auth-input pl-12"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="password" className="block text-sm font-medium text-[#1c1b1b]">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#002819] font-semibold hover:underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717973] pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="auth-input pl-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-[#717973] hover:text-[#002819] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-[#002819] text-white h-14 text-base font-semibold hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-[#002819]/20 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#c0c9c1]/50" />
            <span className="text-xs text-[#717973] font-medium">or continue with</span>
            <div className="flex-1 h-px bg-[#c0c9c1]/50" />
          </div>

          {/* OAuth buttons */}
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-full border border-[#c0c9c1] bg-white text-[#1c1b1b] text-sm font-medium hover:border-[#002819]/30 hover:shadow-sm transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26537 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
              </svg>
              Continue with Google
            </button>

            <button className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-full border border-[#c0c9c1] bg-white text-[#1c1b1b] text-sm font-medium hover:border-[#002819]/30 hover:shadow-sm transition-all">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09.135.195.285.39.444.58.625.748 1.34 1.597 2.196 1.621.821.023 1.134-.475 2.12-.475.986 0 1.277.475 2.137.452.89-.023 1.517-.78 2.125-1.503.784-1.015 1.107-1.996 1.127-2.05-.024-.01-1.921-.736-1.944-2.943-.021-1.84 1.501-2.735 1.569-2.782-1.048-1.532-2.677-1.742-3.253-1.785zm-1.096-3.82c.571-.69 1.055-1.664.95-2.618-.83.033-1.84.553-2.43 1.265-.527.632-.977 1.63-.853 2.56.924.072 1.83-.497 2.333-1.207z" />
              </svg>
              Continue with Apple
            </button>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-[#404943] mt-8">
            New to ShopEase?{" "}
            <Link
              href="/register"
              className="text-[#002819] font-semibold hover:underline underline-offset-4 transition-colors"
            >
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
