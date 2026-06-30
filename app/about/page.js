"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { 
  Users, 
  Target, 
  Globe2, 
  ShieldCheck, 
  Zap, 
  Heart, 
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ── Fade-up animation helper ───────────────────────────────── */
function FadeUp({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const stats = [
  { label: "Active Users", value: "2M+" },
  { label: "Brands Partners", value: "500+" },
  { label: "Products Available", value: "100k+" },
  { label: "Countries Served", value: "40+" },
];

const values = [
  {
    icon: Target,
    title: "Customer First",
    description: "Every decision we make is guided by what's best for our customers. Your satisfaction is our North Star.",
  },
  {
    icon: ShieldCheck,
    title: "Uncompromising Quality",
    description: "We carefully vet every seller and product on our platform to ensure premium quality standards.",
  },
  {
    icon: Zap,
    title: "Innovation Driven",
    description: "We continuously evolve our platform to provide the most seamless and modern shopping experience.",
  },
  {
    icon: Globe2,
    title: "Sustainable Practices",
    description: "We are committed to eco-friendly packaging and supporting sustainable brands on our platform.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-[72px]">
        {/* ── HERO SECTION ──────────────────────────────────── */}
        <section className="relative overflow-hidden bg-secondary py-24 sm:py-32">
          {/* Decorative blurs */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <FadeUp>
              <Badge className="rounded-full bg-accent text-primary border-0 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase mb-6">
                Our Story
              </Badge>
              <h1 
                className="text-4xl md:text-6xl font-extrabold text-foreground tracking-tight mb-6"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Redefining the <br className="hidden sm:block" />
                <span className="text-primary">E-Commerce Experience</span>
              </h1>
              <p className="max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed">
                ShopEase was founded on a simple principle: shopping online should be 
                seamless, inspiring, and completely trustworthy. We bridge the gap 
                between premium brands and discerning shoppers.
              </p>
            </FadeUp>
          </div>
        </section>

        {/* ── IMAGE GRID ───────────────────────────────────── */}
        <section className="py-12 bg-background -mt-16 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FadeUp delay={0.1} className="h-64 sm:h-80 md:h-[400px] md:translate-y-8">
                <div className="w-full h-full rounded-3xl overflow-hidden relative shadow-xl">
                  <img 
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=800" 
                    alt="Premium shopping" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors duration-500" />
                </div>
              </FadeUp>
              <FadeUp delay={0.2} className="h-64 sm:h-80 md:h-[400px]">
                <div className="w-full h-full rounded-3xl overflow-hidden relative shadow-xl">
                  <img 
                    src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800" 
                    alt="Fashion" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors duration-500" />
                </div>
              </FadeUp>
              <FadeUp delay={0.3} className="h-64 sm:h-80 md:h-[400px] md:translate-y-16">
                <div className="w-full h-full rounded-3xl overflow-hidden relative shadow-xl">
                  <img 
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800" 
                    alt="Customer service" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors duration-500" />
                </div>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ── STATS SECTION ────────────────────────────────── */}
        <section className="py-20 md:py-32 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-primary rounded-3xl p-8 sm:p-16 text-center shadow-2xl relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }} />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                {stats.map((stat, i) => (
                  <FadeUp key={stat.label} delay={i * 0.1}>
                    <div className="space-y-2">
                      <h3 
                        className="text-4xl md:text-5xl font-extrabold text-white"
                        style={{ fontFamily: "Manrope, sans-serif" }}
                      >
                        {stat.value}
                      </h3>
                      <p className="text-primary-foreground/80 font-medium text-sm md:text-base">
                        {stat.label}
                      </p>
                    </div>
                  </FadeUp>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── VALUES SECTION ───────────────────────────────── */}
        <section className="py-20 bg-secondary/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeUp className="text-center max-w-3xl mx-auto mb-16">
              <h2 
                className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Our Core Values
              </h2>
              <p className="text-muted-foreground text-lg">
                The principles that drive our team and shape the ShopEase experience every single day.
              </p>
            </FadeUp>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value, i) => (
                <FadeUp key={value.title} delay={i * 0.1}>
                  <div className="bg-background rounded-3xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow group">
                    <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <value.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 
                      className="text-xl font-bold text-foreground mb-3"
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {value.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA SECTION ──────────────────────────────────── */}
        <section className="py-24 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <FadeUp>
              <Heart className="w-12 h-12 text-primary mx-auto mb-6" />
              <h2 
                className="text-3xl md:text-5xl font-bold text-foreground mb-6"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Ready to start shopping?
              </h2>
              <p className="text-xl text-muted-foreground mb-10">
                Join millions of satisfied customers and discover a world of premium products.
              </p>
              <Link href="/shop">
                <Button 
                  size="lg" 
                  className="rounded-full bg-primary text-white h-14 px-8 text-base font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                >
                  Explore Products <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </FadeUp>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
