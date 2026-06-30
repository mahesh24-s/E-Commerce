"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle, Package, MapPin, CreditCard, ArrowRight,
  ShoppingBag, Clock, Truck,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { getOrderById } from "@/lib/services/order.service";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import Link from "next/link";

const STATUS_STEPS = ["pending", "processing", "shipped", "delivered"];

const STATUS_META = {
  pending:    { label: "Pending",    color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200" },
  processing: { label: "Processing", color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200" },
  shipped:    { label: "Shipped",    color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
  delivered:  { label: "Delivered",  color: "text-emerald-700",bg: "bg-emerald-50",border: "border-emerald-200" },
  cancelled:  { label: "Cancelled",  color: "text-red-700",    bg: "bg-red-50",    border: "border-red-200" },
};

function OrderTimeline({ status }) {
  if (status === "cancelled") return null;
  const currentIdx = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((s, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                done ? "bg-primary border-primary text-white" : "bg-white border-border text-muted-foreground"
              } ${active ? "ring-4 ring-primary/20" : ""}`}>
                {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <p className={`text-[10px] font-medium mt-1.5 capitalize text-center ${done ? "text-primary" : "text-muted-foreground"}`}>
                {s}
              </p>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 mx-1 transition-all ${i < currentIdx ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useSelector((s) => s.auth);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.replace("/login"); return; }
    if (!id) return;
    getOrderById(id)
      .then(setOrder)
      .catch(() => toast.error("Order not found"))
      .finally(() => setLoading(false));
  }, [id, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-[72px]">
          <div className="w-10 h-10 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center pt-[72px] text-center p-6">
          <p className="text-5xl mb-4">😕</p>
          <h2 className="text-xl font-bold mb-2">Order not found</h2>
          <Link href="/customer/orders" className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90">
            View My Orders
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const statusMeta = STATUS_META[order.orderStatus] ?? STATUS_META.processing;
  const isSuccess = order.paymentInfo?.status === "paid";
  const addr = order.shippingAddress;
  const orderDate = new Date(order.createdAt);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <Navbar />
      <div className="pt-[72px]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Success hero */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="text-center mb-8"
          >
            <div className="relative inline-block mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
                className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              {/* Confetti rings */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2 + i * 0.5, opacity: 0 }}
                  transition={{ delay: 0.1 + i * 0.15, duration: 0.8 }}
                  className="absolute inset-0 rounded-full border-2 border-emerald-400"
                />
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "Manrope, sans-serif" }}>
              {isSuccess ? "Order Confirmed! 🎉" : "Order Placed"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isSuccess
                ? "Your payment was successful and your order is being processed."
                : "Your order has been placed and is awaiting payment confirmation."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Order ID: <span className="font-mono font-semibold text-foreground">{order._id}</span>
            </p>
          </motion.div>

          {/* Status */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 mb-4"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>Order Status</h2>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusMeta.color} ${statusMeta.bg} ${statusMeta.border}`}>
                {statusMeta.label}
              </span>
            </div>
            <OrderTimeline status={order.orderStatus} />
            {order.orderStatus !== "cancelled" && (
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Estimated delivery: 2–5 business days
              </p>
            )}
          </motion.div>

          {/* Shipping Address */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 mb-4"
          >
            <h2 className="font-bold text-foreground mb-3 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
              <MapPin className="w-4 h-4 text-primary" /> Shipping Address
            </h2>
            <p className="text-sm text-foreground font-semibold">{addr?.name}</p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
              {addr?.street}, {addr?.city}, {addr?.state} — {addr?.pincode}, {addr?.country}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">📞 {addr?.phone}</p>
          </motion.div>

          {/* Order Items */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 mb-4"
          >
            <h2 className="font-bold text-foreground mb-3 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
              <Package className="w-4 h-4 text-primary" /> Items Ordered ({order.items?.length})
            </h2>
            <div className="space-y-3">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                  <div className="w-12 h-12 rounded-xl bg-secondary/30 overflow-hidden flex-shrink-0 border border-border/50">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-foreground flex-shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Price Summary */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 mb-6"
          >
            <h2 className="font-bold text-foreground mb-3 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
              <CreditCard className="w-4 h-4 text-primary" /> Payment Summary
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{(order.totalAmount - order.shippingCharge - order.taxAmount).toLocaleString("en-IN")}</span>
              </div>
              {order.shippingCharge > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>₹{order.shippingCharge}</span>
                </div>
              )}
              {order.shippingCharge === 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-emerald-600 font-medium">FREE</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>₹{order.taxAmount}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground text-base">
                <span>Total Paid</span>
                <span>₹{order.totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Payment Status</span>
                <span className={`font-semibold capitalize ${isSuccess ? "text-emerald-600" : "text-amber-600"}`}>
                  {order.paymentInfo?.status ?? "pending"}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link
              href="/customer/orders"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all"
            >
              <Package className="w-4 h-4" /> View All Orders
            </Link>
            <Link
              href="/shop"
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-border rounded-xl font-semibold text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
            >
              <ShoppingBag className="w-4 h-4" /> Continue Shopping
            </Link>
          </motion.div>

          {/* Placed at */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Order placed on {orderDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
