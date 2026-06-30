"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Package, MapPin, CreditCard, ArrowLeft,
  Clock, Truck, CheckCircle, AlertCircle
} from "lucide-react";
import { getOrderById, cancelOrder, updateOrderStatus } from "@/lib/services/order.service";
import toast from "react-hot-toast";

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
    <div className="flex items-center gap-0 mt-4">
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

export default function OrderDetail({ role }) {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    getOrderById(id)
      .then(setOrder)
      .catch(() => {
        toast.error("Order not found or access denied");
        router.back();
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setUpdating(true);
    try {
      const updated = await cancelOrder(id);
      setOrder(updated);
      toast.success("Order cancelled successfully");
    } catch (err) {
      toast.error(err?.message ?? "Failed to cancel order");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!confirm(`Update status to ${newStatus}?`)) return;
    setUpdating(true);
    try {
      const updated = await updateOrderStatus(id, newStatus);
      setOrder(updated);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (err) {
      toast.error(err?.message ?? "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const statusMeta = STATUS_META[order.orderStatus] ?? STATUS_META.processing;
  const isSuccess = order.paymentInfo?.status === "paid";
  const addr = order.shippingAddress;
  const orderDate = new Date(order.createdAt);
  
  // Sellers can only update status if it's processing -> shipped or shipped -> delivered
  const canUpdateToShipped = role === "seller" && order.orderStatus === "processing";
  const canUpdateToDelivered = role === "seller" && order.orderStatus === "shipped";

  return (
    <div className="max-w-3xl space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Order ID</p>
          <p className="text-sm font-mono font-semibold text-foreground">{order._id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Status */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>Order Status</h2>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusMeta.color} ${statusMeta.bg} ${statusMeta.border}`}>
                {statusMeta.label}
              </span>
            </div>
            
            {order.orderStatus === "cancelled" ? (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Order Cancelled</p>
                  <p className="text-xs mt-1">This order was cancelled on {new Date(order.cancelledAt).toLocaleDateString()}.</p>
                </div>
              </div>
            ) : (
              <OrderTimeline status={order.orderStatus} />
            )}

            {/* Seller Actions */}
            {(canUpdateToShipped || canUpdateToDelivered) && (
              <div className="mt-6 pt-4 border-t border-border flex justify-end gap-3">
                {canUpdateToShipped && (
                  <button onClick={() => handleUpdateStatus("shipped")} disabled={updating} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                    Mark as Shipped
                  </button>
                )}
                {canUpdateToDelivered && (
                  <button onClick={() => handleUpdateStatus("delivered")} disabled={updating} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                    Mark as Delivered
                  </button>
                )}
              </div>
            )}
            
            {/* Customer Cancel Action */}
            {role === "customer" && ["pending", "processing"].includes(order.orderStatus) && (
              <div className="mt-6 pt-4 border-t border-border text-right">
                <button onClick={handleCancel} disabled={updating} className="px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 disabled:opacity-50">
                  Cancel Order
                </button>
              </div>
            )}
          </motion.div>

          {/* Items */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
              <Package className="w-4 h-4 text-primary" /> Items Ordered
            </h2>
            <div className="space-y-4">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-secondary/30 overflow-hidden flex-shrink-0 border border-border/50">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-foreground flex-shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          {/* Payment */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
              <CreditCard className="w-4 h-4 text-primary" /> Payment Summary
            </h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>₹{(order.totalAmount - order.shippingCharge - order.taxAmount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{order.shippingCharge === 0 ? "FREE" : `₹${order.shippingCharge}`}</span>
              </div>
              <div className="border-t border-border pt-2.5 flex justify-between font-bold text-foreground text-base">
                <span>Total</span>
                <span>₹{order.totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Status</span>
                <span className={`font-semibold capitalize ${isSuccess ? "text-emerald-600" : "text-amber-600"}`}>
                  {order.paymentInfo?.status ?? "pending"}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Shipping */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
            <h2 className="font-bold text-foreground mb-3 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
              <MapPin className="w-4 h-4 text-primary" /> Delivery details
            </h2>
            <p className="text-sm font-semibold text-foreground">{addr?.name}</p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
              {addr?.street}, {addr?.city}, {addr?.state} {addr?.pincode}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{addr?.phone}</p>
            
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Order Placed: <br/>
                <span className="font-medium text-foreground">
                  {orderDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
