"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, Star } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { getProductsByCategorySlug } from "@/lib/services/product.service";
import { addToCart as apiAddToCart } from "@/lib/services/cart.service";
import { useDispatch, useSelector } from "react-redux";
import { setCart } from "@/store/slices/cartSlice";
import toast from "react-hot-toast";
import Link from "next/link";

function ProductCard({ product, onAddToCart, adding }) {
  const price = product.discountPrice ?? product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.discountPrice / product.price) * 100) : 0;
  const imgUrl = product.images?.[0]?.url;

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="group bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
      <Link href={`/products/${product.slug}`} className="relative overflow-hidden bg-secondary/30 aspect-square">
        {imgUrl ? (
          <img src={imgUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
        )}
        {hasDiscount && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{discountPct}%</span>}
        {product.stock === 0 && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white font-bold text-sm">Out of Stock</span></div>}
      </Link>
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{product.category?.name}</p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-foreground text-sm leading-snug hover:text-primary transition-colors line-clamp-2" style={{ fontFamily: "Manrope, sans-serif" }}>{product.name}</h3>
        </Link>
        <div className="flex items-center justify-between mt-auto pt-2">
          <div>
            <p className="font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>₹{price.toLocaleString("en-IN")}</p>
            {hasDiscount && <p className="text-xs text-muted-foreground line-through">₹{product.price.toLocaleString("en-IN")}</p>}
          </div>
          <button onClick={() => onAddToCart(product)} disabled={product.stock === 0 || adding === product._id} className="p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {adding === product._id ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function CategoryBrowsePage() {
  const { slug } = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, role } = useSelector((s) => s.auth);

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);

  useEffect(() => {
    if (!slug) return;
    
    getProductsByCategorySlug(slug, { limit: 50 })
      .then((data) => {
        if (data) {
          setCategory(data.category);
          setProducts(data.products ?? []);
        }
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          toast.error("Category not found");
          router.push("/shop");
        } else {
          toast.error("Failed to load category products");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug, router]);

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

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <Navbar />
      <div className="pt-[72px]">
        {/* Category Hero */}
        <div className="bg-white border-b border-border/40 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {loading ? (
              <div className="h-10 w-48 bg-secondary mx-auto rounded animate-pulse" />
            ) : (
              <>
                <h1 className="text-3xl font-bold text-foreground mb-3" style={{ fontFamily: "Manrope, sans-serif" }}>
                  {category?.name ?? "Category"}
                </h1>
                <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
                  {category?.description ?? "Browse our collection of high quality products in this category."}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
              {products.length} Products Found
            </h2>
          </div>

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
              <h3 className="font-bold text-lg text-foreground mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>No products in this category</h3>
              <p className="text-muted-foreground text-sm mb-6">We couldn't find any products here yet.</p>
              <Link href="/shop" className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90">
                Go to Shop
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} adding={adding} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
