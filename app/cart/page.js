"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, Truck } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { getCart, updateCartItem, removeFromCart as apiRemove, clearCart as apiClear } from "@/lib/services/cart.service";
import { useDispatch, useSelector } from "react-redux";
import { setCart, clearCart as clearCartStore } from "@/store/slices/cartSlice";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

const FREE_SHIPPING_ABOVE = 500;
const SHIPPING_CHARGE = 50;

function CartItem({ item, onQtyChange, onRemove, updating }) {
  const product = item.product;
  const price = product?.discountPrice ?? product?.price ?? item.priceAtAdd ?? 0;
  const imgUrl = product?.images?.[0]?.url;
  const isUpdating = updating === (product?._id?.toString() ?? "");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex gap-4 p-4 bg-white rounded-2xl border border-border/50 shadow-sm"
    >
      {/* Image */}
      <Link href={`/products/${product?.slug ?? "#"}`} className="flex-shrink-0">
        <div className="w-20 h-20 rounded-xl bg-secondary/30 overflow-hidden border border-border/50">
          {imgUrl ? (
            <img src={imgUrl} alt={product?.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link href={`/products/${product?.slug ?? "#"}`}>
          <h3 className="font-semibold text-foreground text-sm leading-snug hover:text-primary transition-colors line-clamp-2" style={{ fontFamily: "Manrope, sans-serif" }}>
            {product?.name ?? "Product Unavailable"}
          </h3>
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5">{product?.seller?.name ?? ""}</p>

        <div className="flex items-center justify-between mt-3">
          {/* Qty controls */}
          <div className="flex items-center border border-border rounded-xl overflow-hidden bg-secondary/20">
            <button
              onClick={() => onQtyChange(product?._id, item.quantity - 1)}
              disabled={item.quantity <= 1 || isUpdating}
              className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-40"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-semibold">
              {isUpdating ? <div className="w-3 h-3 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" /> : item.quantity}
            </span>
            <button
              onClick={() => onQtyChange(product?._id, item.quantity + 1)}
              disabled={(product?.stock ?? 0) <= item.quantity || isUpdating}
              className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Price + remove */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-bold text-foreground text-sm">₹{(price * item.quantity).toLocaleString("en-IN")}</p>
              {item.quantity > 1 && (
                <p className="text-[11px] text-muted-foreground">₹{price.toLocaleString("en-IN")} each</p>
              )}
            </div>
            <button
              onClick={() => onRemove(product?._id)}
              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
              aria-label="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CartPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuthenticated, role } = useSelector((s) => s.auth);
  const storeItems = useSelector((s) => s.cart.items);

  const [serverCart, setServerCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || role !== "customer") {
      setLoading(false);
      return;
    }
    fetchCart();
  }, [isAuthenticated, role]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const data = await getCart();
      setServerCart(data?.cart ?? null);
      dispatch(setCart(data?.cart));
    } catch {
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = async (productId, newQty) => {
    if (newQty < 1) return;
    setUpdating(productId?.toString());
    try {
      const data = await updateCartItem({ productId, quantity: newQty });
      const fresh = await getCart();
      setServerCart(fresh?.cart);
      dispatch(setCart(fresh?.cart));
    } catch (err) {
      toast.error(err?.message ?? "Failed to update quantity");
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (productId) => {
    setUpdating(productId?.toString());
    try {
      await apiRemove(productId);
      const fresh = await getCart();
      setServerCart(fresh?.cart);
      dispatch(setCart(fresh?.cart));
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setUpdating(null);
    }
  };

  const handleClear = async () => {
    if (!confirm("Clear your entire cart?")) return;
    setClearing(true);
    try {
      await apiClear();
      setServerCart({ items: [] });
      dispatch(clearCartStore());
      toast.success("Cart cleared");
    } catch {
      toast.error("Failed to clear cart");
    } finally {
      setClearing(false);
    }
  };

  // Compute totals from server cart
  const items = serverCart?.items ?? [];
  const subtotal = items.reduce((acc, item) => {
    const price = item.product?.discountPrice ?? item.product?.price ?? item.priceAtAdd ?? 0;
    return acc + price * item.quantity;
  }, 0);
  const shipping = subtotal >= FREE_SHIPPING_ABOVE ? 0 : items.length > 0 ? SHIPPING_CHARGE : 0;
  const total = subtotal + shipping;

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center pt-[72px] text-center p-6">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Sign in to view your cart</h2>
          <p className="text-muted-foreground text-sm mb-6">You need to be logged in to manage your cart.</p>
          <Link href="/login" className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90">
            Sign In
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <Navbar />
      <div className="pt-[72px]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
              Your Cart {items.length > 0 && <span className="text-base font-normal text-muted-foreground">({items.length} item(s))</span>}
            </h1>
            {items.length > 0 && (
              <button
                onClick={handleClear}
                disabled={clearing}
                className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline disabled:opacity-50"
              >
                {clearing ? "Clearing…" : "Clear Cart"}
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 bg-white rounded-2xl border border-border/50 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <ShoppingBag className="w-20 h-20 text-muted-foreground/20 mb-6" />
              <h2 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
                Your cart is empty
              </h2>
              <p className="text-muted-foreground text-sm mb-6">Looks like you haven't added anything yet.</p>
              <Link href="/shop" className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all">
                Browse Products <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Items list */}
              <div className="lg:col-span-2 space-y-3">
                <AnimatePresence>
                  {items.map((item) => (
                    <CartItem
                      key={item.product?._id ?? item._id}
                      item={item}
                      onQtyChange={handleQtyChange}
                      onRemove={handleRemove}
                      updating={updating}
                    />
                  ))}
                </AnimatePresence>

                {/* Free shipping progress */}
                {subtotal < FREE_SHIPPING_ABOVE && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-4 h-4 text-amber-600" />
                      <p className="text-sm font-medium text-amber-800">
                        Add ₹{(FREE_SHIPPING_ABOVE - subtotal).toLocaleString("en-IN")} more for free shipping!
                      </p>
                    </div>
                    <div className="w-full bg-amber-200 rounded-full h-1.5">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((subtotal / FREE_SHIPPING_ABOVE) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {subtotal >= FREE_SHIPPING_ABOVE && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-800">🎉 You've got free shipping!</p>
                  </div>
                )}
              </div>

              {/* Order summary */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4 sticky top-[90px]">
                  <h3 className="font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>Order Summary</h3>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})</span>
                      <span>₹{subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping</span>
                      <span className={shipping === 0 ? "text-emerald-600 font-medium" : ""}>
                        {shipping === 0 ? "FREE" : `₹${shipping}`}
                      </span>
                    </div>
                    <div className="border-t border-border pt-2.5 flex justify-between font-bold text-foreground text-base">
                      <span>Total</span>
                      <span>₹{total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all"
                  >
                    Proceed to Checkout <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/shop"
                    className="flex items-center justify-center gap-2 w-full py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
