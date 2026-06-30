"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/guards/RoleGuard";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import EmptyState from "@/components/dashboard/EmptyState";
import api from "@/lib/api";
import { updateOrderStatus } from "@/lib/services/order.service";
import toast from "react-hot-toast";

const STATUS_FILTERS = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async (p = 1, status = "all") => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (status !== "all") params.status = status;
      const res = await api.get("/orders", { params });
      setOrders(res.data?.data?.orders ?? []);
      setTotalPages(res.data?.data?.pagination?.totalPages ?? 1);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o)));
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => { fetchOrders(1, filter); }, [filter]);

  const displayed = orders.filter((o) => {
    if (!search) return true;
    return o._id.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <DashboardLayout title="All Orders">
        {/* Filter + search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => { setFilter(s); setPage(1); }}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
                  filter === s ? "bg-primary text-white" : "bg-white border border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />)}
            </div>
          ) : displayed.length === 0 ? (
            <EmptyState icon="📋" title="No orders found" description="No orders match the current filter." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                      <th className="text-left px-6 py-3 font-semibold">Order ID</th>
                      <th className="text-left px-6 py-3 font-semibold">Date</th>
                      <th className="text-left px-6 py-3 font-semibold">Items</th>
                      <th className="text-left px-6 py-3 font-semibold">Amount</th>
                      <th className="text-left px-6 py-3 font-semibold">Payment</th>
                      <th className="text-left px-6 py-3 font-semibold">Order Status</th>
                      <th className="text-left px-6 py-3 font-semibold">Shipping</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {displayed.map((order) => (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-foreground">
                          #{order._id.slice(-10).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{order.items?.length}</td>
                        <td className="px-6 py-4 font-semibold">₹{order.totalAmount?.toLocaleString("en-IN")}</td>
                        <td className="px-6 py-4">
                          <OrderStatusBadge status={order.paymentInfo?.status} />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={order.orderStatus}
                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                            disabled={updatingId === order._id || order.orderStatus === "cancelled"}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-full border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {order.shippingCharge === 0 ? (
                            <span className="text-emerald-600 font-semibold">Free</span>
                          ) : (
                            `₹${order.shippingCharge}`
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 px-6 py-4 border-t border-border">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setPage(i + 1); fetchOrders(i + 1, filter); }}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                        page === i + 1 ? "bg-primary text-white" : "border border-border hover:bg-secondary text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
