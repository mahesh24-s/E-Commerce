"use client";

/**
 * components/guards/RoleGuard.jsx
 *
 * Wrap any page that requires authentication and/or a specific role.
 * Shows a loading spinner while auth state is being determined (isLoading=true),
 * then redirects to /login or the correct dashboard as appropriate.
 *
 * KEY: authSlice starts with isLoading=true so this guard always shows the
 * spinner on first render and waits for SessionRehydrator to complete before
 * making any routing decisions. This prevents redirect-on-refresh bugs.
 */

import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export default function RoleGuard({ children, allowedRoles = [] }) {
  const router = useRouter();
  const { isAuthenticated, role, isLoading } = useSelector((s) => s.auth);

  useEffect(() => {
    // Wait until rehydration is done before making any routing decisions
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      // Wrong role — redirect to their correct dashboard
      if (role === "seller") router.replace("/seller/dashboard");
      else if (role === "admin") router.replace("/admin");
      else router.replace("/customer");
    }
  }, [isAuthenticated, role, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Always show spinner while loading (rehydration in progress)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-[3px] border-primary/20 border-t-primary rounded-full"
        />
      </div>
    );
  }

  // Rehydration done, not authenticated → redirect firing, show nothing
  if (!isAuthenticated) return null;

  // Authenticated but wrong role → redirect firing, show nothing
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) return null;

  return <>{children}</>;
}
