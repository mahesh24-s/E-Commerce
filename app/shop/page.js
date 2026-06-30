"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, Star, ShoppingCart, Heart, ChevronDown, GridIcon, List, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { getAllProducts, getAllCategories } from "@/lib/services/product.service";
import { addToCart as apiAddToCart } from "@/lib/services/cart.service";
import { useDispatch, useSelector } from "react-redux";
import { setCart } from "@/store/slices/cartSlice";
import toast from "react-hot-toast";
import Link from "next/link";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

function StarRating({ value = 0, count = 0 }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= Math.round(value) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-0.5">({count})</span>
    </div>
  );
}

function ProductCard({ product, onAddToCart, adding }) {
  const price = product.discountPrice ?? product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.discountPrice / product.price) * 100) : 0;
  const imgUrl = product.images?.[0]?.url;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="group bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="relative overflow-hidden bg-secondary/30 aspect-square">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
        )}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            -{discountPct}%
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-sm">Out of Stock</span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
          {product.category?.name}
        </p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-foreground text-sm leading-snug hover:text-primary transition-colors line-clamp-2" style={{ fontFamily: "Manrope, sans-serif" }}>
            {product.name}
          </h3>
        </Link>
        <StarRating value={product.ratings?.average} count={product.ratings?.count} />

        <div className="flex items-center justify-between mt-auto pt-2">
          <div>
            <p className="font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
              ₹{price.toLocaleString("en-IN")}
            </p>
            {hasDiscount && (
              <p className="text-xs text-muted-foreground line-through">₹{product.price.toLocaleString("en-IN")}</p>
            )}
          </div>
          <button
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0 || adding === product._id}
            className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Add to cart"
          >
            {adding === product._id ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ShopPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#fafaf9] pt-24 text-center">Loading shop...</div>}>
      <ShopPageContent />
    </React.Suspense>
  );
}

function ShopPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, role } = useSelector((s) => s.auth);

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 12 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
  const [page, setPage] = useState(Number(searchParams.get("page") ?? 1));

  // Flatten categories tree into flat list for filter dropdown
  function flattenCats(nodes, depth = 0) {
    const result = [];
    for (const n of nodes) {
      result.push({ ...n, _depth: depth });
      if (n.children?.length) result.push(...flattenCats(n.children, depth + 1));
    }
    return result;
  }

  useEffect(() => {
    getAllCategories().then((data) => setCategories(flattenCats(Array.isArray(data) ? data : [])));
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort, page, limit: 12 };
      if (q) params.q = q;
      if (category) params.category = category;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (minRating) params.minRating = minRating;

      const data = await getAllProducts(params);
      setProducts(data?.products ?? []);
      setPagination(data?.pagination ?? { total: 0, page: 1, totalPages: 1, limit: 12 });
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [q, category, minPrice, maxPrice, minRating, sort, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const applyFilters = (e) => {
    e?.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const resetFilters = () => {
    setQ(""); setCategory(""); setMinPrice(""); setMaxPrice(""); setMinRating(""); setSort("newest"); setPage(1);
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) { toast.error("Please log in to add to cart"); router.push("/login"); return; }
    if (role !== "customer") { toast.error("Only customers can add to cart"); return; }
    setAdding(product._id);
    try {
      const data = await apiAddToCart({ productId: product._id, quantity: 1 });
      dispatch(setCart(data?.cart));
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error(err?.message ?? "Failed to add to cart");
    } finally {
      setAdding(null);
    }
  };

  const activeFilters = [q, category, minPrice, maxPrice, minRating].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <Navbar />
      <div className="pt-[72px]">
        {/* Hero bar */}
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>Shop</h1>
            <p className="text-muted-foreground text-sm">
              {pagination.total > 0 ? `${pagination.total} products available` : "Browse our collection"}
            </p>

            {/* Search */}
            <form onSubmit={applyFilters} className="mt-4 flex gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search products…"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <button type="submit" className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all relative ${showFilters ? "bg-primary text-white border-primary" : "bg-white border-border text-muted-foreground hover:border-primary/40"}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilters > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-6">
            {/* Sidebar Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.aside
                  initial={{ opacity: 0, x: -20, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: 260 }}
                  exit={{ opacity: 0, x: -20, width: 0 }}
                  className="flex-shrink-0 overflow-hidden"
                >
                  <div className="w-[260px] bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-5 sticky top-[90px]">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>Filters</h3>
                      <button onClick={resetFilters} className="text-xs text-primary hover:underline">Reset all</button>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-2">Category</label>
                      <select
                        value={category}
                        onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">All Categories</option>
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {"  ".repeat(c._depth)}{c._depth > 0 ? "↳ " : ""}{c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-2">Price Range (₹)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                          min="0"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Min Rating */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-2">Minimum Rating</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {["", "3", "4", "4.5"].map((r) => (
                          <button
                            key={r}
                            onClick={() => setMinRating(r)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${minRating === r ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                          >
                            {r ? <><Star className="w-3 h-3 fill-current" />{r}+</> : "Any"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={applyFilters}
                      className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                    >
                      Apply Filters
                    </button>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Sort bar */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{products.length}</span> of <span className="font-semibold text-foreground">{pagination.total}</span> products
                </p>
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  className="px-3 py-2 text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Products grid */}
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-border/50 overflow-hidden animate-pulse">
                      <div className="aspect-square bg-secondary" />
                      <div className="p-3.5 space-y-2">
                        <div className="h-3 bg-secondary rounded w-2/3" />
                        <div className="h-4 bg-secondary rounded" />
                        <div className="h-3 bg-secondary rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-5xl mb-4">🔍</p>
                  <h3 className="font-bold text-lg text-foreground mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>No products found</h3>
                  <p className="text-muted-foreground text-sm mb-4">Try adjusting your search or filters</p>
                  <button onClick={resetFilters} className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90">
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <AnimatePresence>
                    {products.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        adding={adding}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 rounded-xl border border-border hover:bg-secondary transition-all disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {[...Array(pagination.totalPages)].map((_, i) => {
                    const p = i + 1;
                    if (p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1) {
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${p === page ? "bg-primary text-white" : "border border-border hover:bg-secondary"}`}
                        >
                          {p}
                        </button>
                      );
                    }
                    if (Math.abs(p - page) === 2) return <span key={p} className="text-muted-foreground">…</span>;
                    return null;
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className="p-2 rounded-xl border border-border hover:bg-secondary transition-all disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
