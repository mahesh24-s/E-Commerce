"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Zap, KeyRound, RotateCcw, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { resetPassword, forgotPassword } from "@/lib/services/auth.service";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function ResetPasswordPage() {
  const router = useRouter();
  const { otpEmail } = useSelector((s) => s.auth);

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef([]);

  // Redirect if no otpEmail in store
  useEffect(() => {
    if (!otpEmail) {
      router.push("/forgot-password");
    }
  }, [otpEmail, router]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((v) => {
        if (v <= 1) {
          clearInterval(t);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleOtpChange = (index, value) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);

    // Auto-advance
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const nextFocus = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextFocus]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < OTP_LENGTH) {
      toast.error("Please enter the complete 6-digit code.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword({ email: otpEmail, otp: otpCode, newPassword });

      setIsSuccess(true);
      toast.success("Password reset successfully! Redirecting...");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      const msg = err?.message || "Invalid OTP or request failed.";
      toast.error(msg);
      // Shake + clear OTP
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await forgotPassword({ email: otpEmail });
      toast.success("A new code has been sent to your email.");
      setResendCooldown(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err?.message || "Failed to resend OTP.");
    } finally {
      setIsResending(false);
    }
  };

  const isComplete = otp.every((d) => d !== "") && newPassword.length >= 8;

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#fcf9f8]">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#b8efd0]/25 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#002819]/8 rounded-full blur-[80px]" />
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#002819 1px, transparent 1px), linear-gradient(90deg, #002819 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        {isSuccess ? (
          /* ── Success State ────────────────────────────────── */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative z-10 flex flex-col items-center gap-6 text-center max-w-sm px-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="w-24 h-24 bg-[#b8efd0] rounded-full flex items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12 text-[#002819]" />
            </motion.div>
            <div>
              <h2
                className="text-3xl font-extrabold text-[#002819] mb-2"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Reset Complete!
              </h2>
              <p className="text-[#404943] text-base">
                Your password has been successfully updated. Redirecting to login...
              </p>
            </div>
            <motion.div
              animate={{ width: ["0%", "100%"] }}
              transition={{ duration: 2, ease: "linear" }}
              className="h-1 bg-[#002819] rounded-full w-full"
            />
          </motion.div>
        ) : (
          /* ── Reset Form ─────────────────────────────────────── */
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative z-10 w-full max-w-[460px] px-6"
          >
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-[#002819] rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white fill-white" />
                </div>
                <span
                  className="text-2xl font-bold text-[#002819] tracking-tight"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  ShopEase
                </span>
              </Link>
            </div>

            {/* Card */}
            <div className="bg-white/70 backdrop-blur-2xl border border-[#c0c9c1]/40 rounded-3xl p-8 shadow-xl shadow-[#002819]/5">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-[#b8efd0] rounded-2xl flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-[#002819]" />
                </div>
              </div>

              {/* Header */}
              <div className="text-center mb-8">
                <h1
                  className="text-2xl font-extrabold text-[#002819] mb-2"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  Set New Password
                </h1>
                <p className="text-[#404943] text-sm leading-relaxed">
                  Enter the verification code sent to <br />
                  <span className="font-semibold text-[#002819]">{otpEmail}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* OTP Inputs */}
                <div>
                  <div className="flex justify-center gap-2.5 mb-2" onPaste={handlePaste}>
                    {otp.map((digit, index) => (
                      <motion.input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className={`otp-input ${digit ? "filled" : ""}`}
                        whileFocus={{ scale: 1.08 }}
                        transition={{ duration: 0.15 }}
                        aria-label={`OTP digit ${index + 1}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || isResending}
                      className={`text-xs font-semibold transition-all ${
                        resendCooldown > 0 || isResending
                          ? "text-[#c0c9c1] cursor-not-allowed"
                          : "text-[#002819] hover:underline underline-offset-4"
                      }`}
                    >
                      {resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : isResending
                        ? "Sending..."
                        : "Resend Code"}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#1c1b1b] px-1">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717973] pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                  <p className="text-xs text-[#717973] px-1 pt-1">
                    Must be at least 8 characters long.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={!isComplete || isLoading}
                  className={`w-full rounded-full h-14 text-base font-semibold transition-all shadow-lg mt-2 ${
                    isComplete
                      ? "bg-[#002819] text-white hover:opacity-90 hover:scale-[1.02] shadow-[#002819]/20"
                      : "bg-[#e5e2e1] text-[#717973] cursor-not-allowed shadow-none"
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Resetting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Reset Password
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>
            </div>

            {/* Back link */}
            <p className="text-center text-sm text-[#717973] mt-6">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-[#002819] font-semibold hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
