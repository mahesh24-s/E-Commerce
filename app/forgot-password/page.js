"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { setOtpEmail } from "@/store/slices/authSlice";
import { forgotPassword } from "@/lib/services/auth.service";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    setIsLoading(true);
    try {
      await forgotPassword({ email });
      dispatch(setOtpEmail(email));
      toast.success("Password reset code sent to your email!");
      router.push("/reset-password");
    } catch (err) {
      toast.error(err?.message || "Failed to request password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#002819] overflow-hidden">
      {/* ── Left: Branding / Visual ──────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative flex-col justify-between p-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -left-1/4 w-full h-full bg-[#11402c] rounded-full blur-[120px] opacity-60" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#b8efd0]/20 rounded-full blur-[100px]" />
          <div
            className="absolute inset-0 opacity-10 mix-blend-overlay"
            style={{
              backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')",
            }}
          />
        </div>

        <Link href="/" className="relative z-10 flex items-center gap-2.5 w-fit">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span
            className="text-2xl font-bold text-white tracking-tight"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            ShopEase
          </span>
        </Link>

        <div className="relative z-10 my-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-6"
          >
            <p className="text-[#9cd2b5] text-sm font-semibold tracking-widest uppercase">
              Account Recovery
            </p>
            <h2
              className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Get back to
              <br />
              <span className="text-[#b8efd0]">shopping.</span>
            </h2>
            <p className="text-white/50 text-base max-w-xs">
              We'll send you a secure 6-digit code to reset your password and secure your account.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Right: Recovery Form ───────────────────────────────── */}
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
              Reset Password
            </h1>
            <p className="text-[#404943] text-base">
              Enter your email address to receive a verification code.
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
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="auth-input pl-12"
                />
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[#002819] text-white hover:bg-[#002819]/90 hover:scale-[1.01] transition-all rounded-full text-base font-semibold shadow-lg shadow-[#002819]/10 mt-4"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Sending code...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Send Reset Code
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Footer links */}
          <p className="text-center text-sm text-[#717973] mt-8">
            Remember your password?{" "}
            <Link
              href="/login"
              className="text-[#002819] font-semibold hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
