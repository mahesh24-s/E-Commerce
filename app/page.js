"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RefreshCw,
  Headphones,
  Star,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { getFeaturedProducts, getAllCategories } from "@/lib/services/product.service";
import { useDispatch } from "react-redux";
import { addToCart as addToCartAction } from "@/store/slices/cartSlice";
import toast from "react-hot-toast";

/* ── Fade-up animation helper ───────────────────────────────── */
function FadeUp({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Skeleton ────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
      <div className="aspect-square bg-secondary rounded-xl" />
      <div className="space-y-2">
        <div className="h-3 w-1/3 bg-secondary rounded" />
        <div className="h-4 w-2/3 bg-secondary rounded" />
        <div className="h-3 w-1/2 bg-secondary rounded" />
      </div>
      <div className="flex items-center justify-between mt-auto">
        <div className="h-5 w-16 bg-secondary rounded" />
        <div className="w-9 h-9 bg-secondary rounded-full" />
      </div>
    </div>
  );
}

/* ── Category Card ──────────────────────────────────────────── */
const DEFAULT_GRADIENT = "bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900";

function CategoryCard({ name, slug, image, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="category-card group relative overflow-hidden rounded-2xl aspect-[4/3] cursor-pointer block"
    >
      <Link href={`/categories/${slug}`} className="absolute inset-0 z-20" />
      {image?.url ? (
        <Image
          src={image.url}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 25vw"
        />
      ) : (
        <div className={`absolute inset-0 ${DEFAULT_GRADIENT} transition-all duration-500 group-hover:scale-105`} />
      )}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all duration-300 z-10 pointer-events-none" />
      <div className="absolute inset-0 p-7 flex flex-col justify-end z-10 pointer-events-none">
        <h3
          className="text-white text-xl font-bold"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          {name}
        </h3>
      </div>
      <div className="absolute top-6 right-6 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 z-10 pointer-events-none">
        <ArrowRight className="w-4 h-4 text-white" />
      </div>
    </motion.div>
  );
}

/* ── Product Card ───────────────────────────────────────────── */
function ProductCard({ product, delay }) {
  const dispatch = useDispatch();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const { name, category, price, discountPrice, ratings, images, isFeatured, stock, slug } = product;
  const imageUrl = images?.[0]?.url;
  const inStock = stock > 0;
  const avgRating = ratings?.average ?? 0;
  const reviewCount = ratings?.count ?? 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!inStock) return;
    dispatch(addToCartAction({ product, quantity: 1 }));
    toast.success(`${name} added to cart!`);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="product-card bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 group cursor-pointer"
    >
      <Link href={`/products/${slug}`}>
        <div className="relative aspect-square bg-secondary rounded-xl flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 25vw"
            />
          ) : (
            <span className="text-6xl group-hover:scale-110 transition-transform duration-500">🛍️</span>
          )}
          {isFeatured && (
            <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">
              Featured
            </span>
          )}
          {!inStock && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              Out of Stock
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {category?.name ?? ""}
        </p>
        <Link href={`/products/${slug}`}>
          <h3
            className="font-semibold text-foreground leading-snug line-clamp-1 hover:text-primary transition-colors"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            {name}
          </h3>
        </Link>
        {reviewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${
                    s <= Math.floor(avgRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-muted text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({reviewCount})</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div>
          <span
            className="text-lg font-bold text-foreground"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            ₹{(discountPrice || price).toLocaleString("en-IN")}
          </span>
          {discountPrice && (
            <span className="text-sm text-muted-foreground line-through ml-2">
              ₹{price.toLocaleString("en-IN")}
            </span>
          )}
        </div>
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 duration-200 ${
            inStock
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
          aria-label={`Add ${name} to cart`}
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

/* ── Trust Badge ────────────────────────────────────────────── */
function TrustBadge({ icon: Icon, title, subtitle, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="flex items-start gap-4"
    >
      <div className="w-11 h-11 bg-accent rounded-xl flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h4
          className="font-semibold text-foreground text-sm"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          {title}
        </h4>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroTextY = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    getFeaturedProducts()
      .then(setFeaturedProducts)
      .catch(() => setFeaturedProducts([]))
      .finally(() => setLoadingProducts(false));

    getAllCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  return (
    <>
      <Navbar />
      <main>
        {/* ── HERO SECTION ──────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative min-h-screen flex items-center overflow-hidden bg-secondary"
        >
          <motion.div
            style={{ y: heroY }}
            className="parallax-hero absolute inset-0 -top-[20%] -bottom-[20%]"
          >
            <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-accent/30 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[100px]" />
          </motion.div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left: Text */}
              <motion.div style={{ y: heroTextY, opacity: heroOpacity }} className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <Badge className="rounded-full bg-accent text-primary border-0 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase">
                    ✦ New Season Arrivals
                  </Badge>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-foreground"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  Elevate Your{" "}
                  <span className="shimmer-text">Everyday</span>
                  <br />
                  Style
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.35 }}
                  className="text-lg text-muted-foreground max-w-lg leading-relaxed"
                >
                  Discover our curated collection of premium essentials — crafted
                  for modern living with uncompromising quality.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="flex flex-wrap gap-4"
                >
                  <Link href="/shop">
                    <Button
                      size="lg"
                      className="rounded-full bg-primary text-primary-foreground h-14 px-8 text-base font-semibold hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
                    >
                      Shop Now
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/shop">
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full h-14 px-8 text-base font-semibold border-border hover:bg-secondary transition-all hover:scale-105"
                    >
                      View Collections
                    </Button>
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="flex items-center gap-5 pt-2"
                >
                  <div className="flex -space-x-2">
                    {["😊", "🙂", "😄", "😎"].map((emoji, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-xs"
                      >
                        {emoji}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-semibold text-foreground">12,000+</span> happy customers
                    </p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right: Hero visual */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: 40 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative hidden lg:flex items-center justify-center"
              >
                <div className="relative w-[420px] h-[480px]">
                  <motion.div
                    animate={{ y: [-8, 8, -8] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-6 -left-6 bg-card rounded-2xl p-4 shadow-xl border border-border z-20 w-[170px]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎧</span>
                      <div>
                        <p className="text-xs font-semibold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>Sony XM5</p>
                        <p className="text-xs text-primary font-bold">₹29,990</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    animate={{ y: [8, -8, 8] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -bottom-4 -right-4 bg-card rounded-2xl p-4 shadow-xl border border-border z-20"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>Verified Purchase</p>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => <Star key={s} className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />)}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <div className="w-full h-full bg-gradient-to-br from-accent/50 via-secondary to-accent/20 rounded-3xl flex items-center justify-center border border-border/50 shadow-2xl overflow-hidden">
                    <motion.div
                      animate={{ rotate: [0, 3, 0, -3, 0] }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                      className="relative w-full h-full select-none"
                    >
                      <Image
                        src="/xm5.jpg"
                        alt="Sony XM5 Headphones"
                        fill
                        className="object-cover"
                        priority
                      />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          >
            <span className="text-xs text-muted-foreground tracking-widest uppercase font-medium">
              Scroll
            </span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-5 h-8 border border-muted-foreground/40 rounded-full flex items-start justify-center pt-1.5"
            >
              <div className="w-1 h-2 bg-primary rounded-full" />
            </motion.div>
          </motion.div>
        </section>

        {/* ── TRUST BADGES ─────────────────────────────────── */}
        <section className="py-12 border-y border-border bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <TrustBadge icon={Truck} title="Free Shipping" subtitle="On orders over ₹999" delay={0} />
              <TrustBadge icon={ShieldCheck} title="Secure Payments" subtitle="256-bit SSL encryption" delay={0.08} />
              <TrustBadge icon={RefreshCw} title="Easy Returns" subtitle="30-day return policy" delay={0.16} />
              <TrustBadge icon={Headphones} title="24/7 Support" subtitle="Chat, email & phone" delay={0.24} />
            </div>
          </div>
        </section>

        {/* ── CATEGORIES ───────────────────────────────────── */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-10">
              <FadeUp>
                <h2
                  className="text-3xl md:text-4xl font-bold text-foreground"
                  style={{ fontFamily: "Manrope, sans-serif" }}
                >
                  Shop by Category
                </h2>
              </FadeUp>
              <FadeUp delay={0.1}>
                <Link
                  href="/shop"
                  className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline underline-offset-4"
                >
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </FadeUp>
            </div>

            {loadingCategories ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-[4/3] bg-secondary rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {categories.slice(0, 8).map((cat, i) => (
                  <CategoryCard
                    key={cat._id}
                    name={cat.name}
                    slug={cat.slug}
                    image={cat.image}
                    delay={i * 0.08}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { name: "Electronics", slug: "electronics" },
                  { name: "Footwear", slug: "footwear" },
                  { name: "Accessories", slug: "accessories" },
                  { name: "Apparel", slug: "apparel" },
                ].map((cat, i) => (
                  <CategoryCard key={cat.slug} {...cat} delay={i * 0.08} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── FEATURED PRODUCTS ─────────────────────────────── */}
        <section className="py-20 bg-secondary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-10">
              <FadeUp>
                <div>
                  <Badge className="rounded-full bg-accent text-primary border-0 px-3 py-1 text-xs font-semibold mb-3">
                    {featuredProducts.length > 0 ? "Featured" : "Coming Soon"}
                  </Badge>
                  <h2
                    className="text-3xl md:text-4xl font-bold text-foreground"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    Top Picks For You
                  </h2>
                </div>
              </FadeUp>
              <FadeUp delay={0.1}>
                <Link
                  href="/shop"
                  className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline underline-offset-4"
                >
                  See all <ChevronRight className="w-4 h-4" />
                </Link>
              </FadeUp>
            </div>

            {loadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {featuredProducts.map((p, i) => (
                  <ProductCard key={p._id} product={p} delay={i * 0.08} />
                ))}
              </div>
            ) : (
              <FadeUp>
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-5xl mb-4">🛍️</p>
                  <p className="text-lg font-medium text-foreground mb-2">Products Coming Soon</p>
                  <p className="text-sm">Sellers are adding products. Check back shortly!</p>
                  <Link href="/shop" className="mt-6 inline-block">
                    <Button className="rounded-full bg-primary text-primary-foreground px-8 py-3 font-semibold hover:opacity-90 mt-4">
                      Browse All Products
                    </Button>
                  </Link>
                </div>
              </FadeUp>
            )}
          </div>
        </section>

        {/* ── SALE BANNER ───────────────────────────────────── */}
        <section className="py-20 bg-background overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeUp>
              <div className="relative bg-primary rounded-3xl overflow-hidden p-10 md:p-16">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                  <div className="space-y-6">
                    <Badge className="bg-white/10 text-white border-0 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider">
                      Limited Time Offer
                    </Badge>
                    <h2
                      className="text-4xl md:text-5xl font-extrabold text-white leading-tight"
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      Up to 40% Off
                      <br />
                      Season Sale
                    </h2>
                    <p className="text-white/70 text-lg max-w-sm">
                      Don&apos;t miss out on our biggest sale of the year. Premium
                      products at unbeatable prices.
                    </p>
                    <Link href="/shop">
                      <Button
                        size="lg"
                        className="rounded-full bg-white text-primary h-14 px-8 text-base font-bold hover:bg-white/90 transition-all hover:scale-105 shadow-lg"
                      >
                        Shop the Sale
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className="flex justify-center">
                    <motion.div
                      animate={{ rotate: [0, 5, 0, -5, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      className="text-[140px] leading-none"
                    >
                      🏷️
                    </motion.div>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* ── NEWSLETTER ───────────────────────────────────── */}
        <section className="py-20 bg-secondary">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <FadeUp>
              <Badge className="rounded-full bg-accent text-primary border-0 px-4 py-1.5 text-xs font-semibold mb-6">
                Stay Updated
              </Badge>
              <h2
                className="text-3xl md:text-4xl font-bold text-foreground mb-4"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Join the ShopEase Community
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Get exclusive deals, early access to new arrivals, and curated
                picks — delivered to your inbox.
              </p>
              <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="auth-input flex-1"
                  style={{ borderRadius: "9999px" }}
                />
                <Button
                  type="submit"
                  className="rounded-full bg-primary text-primary-foreground px-8 py-3 font-semibold hover:opacity-90 transition-all hover:scale-105 whitespace-nowrap"
                >
                  Subscribe
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-4">
                No spam, ever. Unsubscribe anytime.
              </p>
            </FadeUp>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
