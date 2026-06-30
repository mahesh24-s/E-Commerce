"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/guards/RoleGuard";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import EmptyState from "@/components/dashboard/EmptyState";
import { getSellerOrders, updateOrderStatus } from "@/lib/services/seller.service";
import toast from "react-hot-toast";

const STATUS_FILTERS = ["all", "processing", "shipped", "delivered", "cancelled"];

const ALLOWED_TRANSITIONS = {
  processing: ["shipped"],
  shipped: ["delivered"],
};

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [updating, setUpdating] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getSellerOrders({ limit: 50 });
      setOrders(data?.orders ?? []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => o._id === orderId ? { ...o, orderStatus: newStatus } : o)
      );
      toast.success(`Order marked as ${newStatus}`);
    } catch (err) {
      toast.error(err?.message ?? "Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.orderStatus === filter);

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <DashboardLayout title="Seller Orders">
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

        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="📬" title="No orders found" description={`No ${filter === "all" ? "" : filter + " "}orders yet.`} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                    <th className="text-left px-6 py-3 font-semibold">Order ID</th>
                    <th className="text-left px-6 py-3 font-semibold">Date</th>
                    <th className="text-left px-6 py-3 font-semibold">Items</th>
                    <th className="text-left px-6 py-3 font-semibold">Amount</th>
                    <th className="text-left px-6 py-3 font-semibold">Status</th>
                    <th className="text-left px-6 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((order) => {
                    const nextStatuses = ALLOWED_TRANSITIONS[order.orderStatus] ?? [];
                    return (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-semibold text-foreground text-xs">
                          #{order._id.slice(-10).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {order.items?.slice(0, 2).map((item, i) => (
                              <p key={i} className="text-xs text-muted-foreground truncate max-w-[160px]">
                                {item.name} × {item.quantity}
                              </p>
                            ))}
                            {order.items?.length > 2 && (
                              <p className="text-xs text-muted-foreground">+{order.items.length - 2} more</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold">₹{order.totalAmount?.toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4"><OrderStatusBadge status={order.orderStatus} /></td>
                        <td className="px-6 py-4">
                          {nextStatuses.length > 0 ? (
                            <select
                              disabled={updating === order._id}
                              onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                              defaultValue=""
                              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer disabled:opacity-50"
                            >
                              <option value="" disabled>Update status</option>
                              {nextStatuses.map((s) => (
                                <option key={s} value={s}>Mark as {s}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No action</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
