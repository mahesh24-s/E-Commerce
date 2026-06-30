"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/guards/RoleGuard";
import EmptyState from "@/components/dashboard/EmptyState";
import { getWishlist, removeFromWishlist } from "@/lib/services/user.service";
import { addToCart } from "@/store/slices/cartSlice";
import { setWishlist, removeWishlistItem } from "@/store/slices/wishlistSlice";
import toast from "react-hot-toast";

export default function CustomerWishlist() {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    getWishlist()
      .then((data) => {
        const items = data?.wishlist?.products ?? [];
        setProducts(items);
        dispatch(setWishlist(items));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dispatch]);

  const handleRemove = async (productId) => {
    setRemoving(productId);
    try {
      await removeFromWishlist(productId);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      dispatch(removeWishlistItem(productId));
      toast.success("Removed from wishlist");
    } catch (err) {
      toast.error(err?.message ?? "Failed to remove");
    } finally {
      setRemoving(null);
    }
  };

  const handleAddToCart = (product) => {
    dispatch(addToCart({ product, quantity: 1 }));
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <RoleGuard allowedRoles={["customer"]}>
      <DashboardLayout title="My Wishlist">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-60 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm">
            <EmptyState
              icon="❤️"
              title="Your wishlist is empty"
              description="Save items you love and come back to them later."
              action={
                <Link href="/shop" className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-all">
                  Discover Products <ArrowRight className="w-4 h-4" />
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{products.length} saved item{products.length !== 1 ? "s" : ""}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product, i) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden group"
                >
                  <Link href={`/shop/${product.slug}`}>
                    <div className="relative aspect-square bg-secondary overflow-hidden">
                      {product.images?.[0]?.url ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">🛍️</div>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      {product.category?.name}
                    </p>
                    <Link href={`/shop/${product.slug}`}>
                      <h4 className="text-sm font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors" style={{ fontFamily: "Manrope, sans-serif" }}>
                        {product.name}
                      </h4>
                    </Link>
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <span className="text-base font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
                          ₹{(product.discountPrice || product.price)?.toLocaleString("en-IN")}
                        </span>
                        {product.discountPrice && (
                          <span className="text-xs text-muted-foreground line-through ml-2">
                            ₹{product.price?.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white text-xs font-semibold py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                      </button>
                      <button
                        onClick={() => handleRemove(product._id)}
                        disabled={removing === product._id}
                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </DashboardLayout>
    </RoleGuard>
  );
}
