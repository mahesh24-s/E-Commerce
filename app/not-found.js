"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Search } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-[72px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          {/* 404 Graphic */}
          <div className="relative mb-8">
            <h1 className="text-[120px] sm:text-[150px] font-extrabold text-primary/10 leading-none tracking-tighter" style={{ fontFamily: "Manrope, sans-serif" }}>
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center animate-bounce">
                <span className="text-5xl">🧭</span>
              </div>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>
            Oops! Page not found
          </h2>
          
          <p className="text-muted-foreground mb-8">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Home className="w-4 h-4" />
              Go to Homepage
            </Link>
            
            <Link
              href="/shop"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-foreground border border-border rounded-xl font-semibold hover:border-primary/40 hover:bg-secondary/50 transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Browse Products
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
