"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, ChevronDown, ChevronUp, X } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/guards/RoleGuard";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import EmptyState from "@/components/dashboard/EmptyState";
import Link from "next/link";
import { getUserOrders, cancelOrder } from "@/lib/services/user.service";
import toast from "react-hot-toast";

const STATUS_FILTERS = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getUserOrders();
      setOrders(data?.orders ?? []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleCancel = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(orderId);
    try {
      await cancelOrder(orderId);
      toast.success("Order cancelled successfully");
      setOrders((prev) =>
        prev.map((o) => o._id === orderId ? { ...o, orderStatus: "cancelled" } : o)
      );
    } catch (err) {
      toast.error(err?.message ?? "Failed to cancel order");
    } finally {
      setCancelling(null);
    }
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.orderStatus === filter);

  return (
    <RoleGuard allowedRoles={["customer"]}>
      <DashboardLayout title="My Orders">
        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
                filter === s
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white text-muted-foreground border border-border hover:border-primary/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm">
            <EmptyState
              icon="📦"
              title="No orders found"
              description={filter === "all" ? "You haven't placed any orders yet." : `No ${filter} orders.`}
              action={
                <Link href="/shop" className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-all">
                  Browse Products
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden"
              >
                {/* Order header */}
                <div
                  className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
                        #{order._id.slice(-10).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} ·{" "}
                        {order.items?.length} item{order.items?.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-foreground">
                      ₹{order.totalAmount?.toLocaleString("en-IN")}
                    </span>
                    <OrderStatusBadge status={order.orderStatus} />
                    {expandedId === order._id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded order details */}
                {expandedId === order._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-border px-6 py-5"
                  >
                    {/* Items */}
                    <div className="space-y-3 mb-5">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg">🛍️</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <span className="text-sm font-semibold text-foreground">
                            ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order summary */}
                    <div className="bg-secondary/50 rounded-xl p-4 space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{(order.totalAmount - order.shippingCharge - order.taxAmount).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>{order.shippingCharge === 0 ? "Free" : `₹${order.shippingCharge}`}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t border-border pt-2 mt-2">
                        <span>Total</span>
                        <span>₹{order.totalAmount?.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Shipping address */}
                    {order.shippingAddress && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Shipping to</p>
                        <p className="text-sm text-foreground">
                          {order.shippingAddress.name} · {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                        </p>
                      </div>
                    )}

                    {/* Cancel button */}
                    {["pending", "processing"].includes(order.orderStatus) && (
                      <button
                        onClick={() => handleCancel(order._id)}
                        disabled={cancelling === order._id}
                        className="flex items-center gap-2 text-sm text-red-600 font-semibold hover:text-red-700 transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        {cancelling === order._id ? "Cancelling..." : "Cancel Order"}
                      </button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </DashboardLayout>
    </RoleGuard>
  );
}
