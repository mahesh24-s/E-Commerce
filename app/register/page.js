"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Zap, ShoppingBag, Store, User, Mail, Lock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { setOtpEmail, setLoading, setError } from "@/store/slices/authSlice";
import { registerUser } from "@/lib/services/auth.service";

export const metadata_config = {
  title: "Register",
  description: "Create your ShopEase account",
};

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [role, setRole] = useState("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    dispatch(setLoading(true));

    try {
      await registerUser({ ...form, role });
      dispatch(setOtpEmail(form.email));
      toast.success("Account created! Please verify your email.");
      router.push("/verify-otp");
    } catch (err) {
      const msg = err?.message || "Registration failed. Please try again.";
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
      <div className="hidden lg:block lg:w-[45%] relative">
        {/* Layered gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#002819] via-[#06402b] to-[#1b503a]" />

        {/* Decorative blobs */}
        <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] bg-[#9cd2b5]/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[300px] h-[300px] bg-[#b8efd0]/10 rounded-full blur-[60px]" />

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <Zap className="w-4.5 h-4.5 text-white fill-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>
              ShopEase
            </span>
          </Link>

          {/* Center quote */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-6"
          >
            <p className="text-[#b8efd0] text-sm font-semibold tracking-widest uppercase">
              Join thousands of shoppers
            </p>
            <h2
              className="text-4xl font-extrabold text-white leading-tight"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Your premium
              <br />
              shopping journey
              <br />
              starts here.
            </h2>
            <p className="text-white/60 text-base max-w-xs">
              Access exclusive deals, track orders, and manage your wishlist all in one place.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-3 gap-4"
          >
            {[
              { value: "12K+", label: "Happy Customers" },
              { value: "5K+", label: "Premium Products" },
              { value: "99%", label: "Satisfaction Rate" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <p className="text-2xl font-extrabold text-white" style={{ fontFamily: "Manrope, sans-serif" }}>
                  {stat.value}
                </p>
                <p className="text-white/50 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Right: Registration Form ────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:py-8 relative">
        {/* Subtle bg for right panel */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#fcf9f8] to-[#f0eded]" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#b8efd0]/20 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 w-full max-w-[440px]"
        >
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>
              ShopEase
            </span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-4xl font-extrabold text-[#002819] mb-2 tracking-tight"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Create Account
            </h1>
            <p className="text-[#404943] text-base">
              Join ShopEase and start shopping premium products today.
            </p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: "customer", label: "Shop as Customer", icon: ShoppingBag },
              { value: "seller", label: "Sell on ShopEase", icon: Store },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 ${
                  role === value
                    ? "bg-[#002819] border-[#002819] text-white shadow-lg shadow-[#002819]/20"
                    : "bg-white border-[#c0c9c1] text-[#404943] hover:border-[#002819]/40"
                }`}
              >
                <Icon className={`w-6 h-6 ${role === value ? "text-[#9cd2b5]" : "text-[#717973]"}`} />
                <span className="text-xs font-semibold text-center leading-snug">{label}</span>
                {role === value && (
                  <motion.div
                    layoutId="roleIndicator"
                    className="absolute -top-1 -right-1 w-4 h-4 bg-[#9cd2b5] rounded-full flex items-center justify-center"
                  >
                    <span className="text-[8px] text-[#002819] font-bold">✓</span>
                  </motion.div>
                )}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[#1c1b1b] px-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717973]" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  className="auth-input pl-12"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#1c1b1b] px-1"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717973]" />
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

            {/* Phone */}
            <div className="space-y-1.5">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-[#1c1b1b] px-1"
              >
                Phone Number <span className="text-[#717973] font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717973]" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 234 567 890"
                  className="auth-input pl-12"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#1c1b1b] px-1"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717973]" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="auth-input pl-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-[#717973] hover:text-[#002819] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength bar */}
              {form.password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="px-1 space-y-1.5"
                >
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          form.password.length >= level * 2
                            ? level <= 2
                              ? "bg-red-400"
                              : level === 3
                              ? "bg-yellow-400"
                              : "bg-[#06402b]"
                            : "bg-[#e5e2e1]"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-[#717973]">
                    {form.password.length < 4
                      ? "Weak password"
                      : form.password.length < 6
                      ? "Fair password"
                      : form.password.length < 8
                      ? "Good password"
                      : "Strong password ✓"}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Seller-specific note */}
            <AnimatePresence>
              {role === "seller" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#b8efd0]/30 border border-[#06402b]/20 rounded-xl p-3 text-xs text-[#06402b] flex gap-2 items-start"
                >
                  <Store className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    As a seller, you'll get access to the seller dashboard after
                    email verification. Business documents may be required.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

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
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Account
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

          {/* OAuth */}
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-full border border-[#c0c9c1] bg-white text-[#1c1b1b] text-sm font-medium hover:border-[#002819]/30 hover:shadow-sm transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26537 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
              </svg>
              Sign up with Google
            </button>
          </div>

          {/* Sign in link */}
          <p className="text-center text-sm text-[#404943] mt-8">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#002819] font-semibold hover:underline underline-offset-4 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
