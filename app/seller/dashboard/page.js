"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Package, ShoppingBag, DollarSign, TrendingUp, Clock, CheckCircle, Truck,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/guards/RoleGuard";
import StatsCard from "@/components/dashboard/StatsCard";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import EmptyState from "@/components/dashboard/EmptyState";
import { getSellerProducts } from "@/lib/services/product.service";
import { getSellerOrders } from "@/lib/services/seller.service";

// Build monthly revenue chart data from orders
function buildMonthlyRevenue(orders) {
  const months = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-IN", { month: "short" });
    months[key] = 0;
  }
  orders.forEach((order) => {
    if (order.paymentInfo?.status !== "paid") return;
    const d = new Date(order.createdAt);
    const key = d.toLocaleString("en-IN", { month: "short" });
    if (key in months) {
      const sellerTotal = order.items
        .filter((item) => item.seller?.toString() === order.seller)
        .reduce((s, item) => s + item.price * item.quantity, 0);
      months[key] += order.totalAmount; // approximate; seller sub-total not stored separately
    }
  });
  return Object.entries(months).map(([month, revenue]) => ({ month, revenue }));
}

export default function SellerDashboard() {
  const { user } = useSelector((s) => s.auth);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSellerProducts({ limit: 100 }).catch(() => ({ products: [] })),
      getSellerOrders({ limit: 100 }).catch(() => ({ orders: [] })),
    ]).then(([pData, oData]) => {
      setProducts(pData?.products ?? []);
      setOrders(oData?.orders ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders
    .filter((o) => o.paymentInfo?.status === "paid")
    .reduce((s, o) => s + o.totalAmount, 0);

  const pendingOrders = orders.filter((o) => o.orderStatus === "processing").length;
  const shippedOrders = orders.filter((o) => o.orderStatus === "shipped").length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === "delivered").length;

  const chartData = buildMonthlyRevenue(orders);
  const recentOrders = orders.slice(0, 5);

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <DashboardLayout title="Seller Dashboard">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-600 to-amber-500 rounded-2xl p-6 mb-6 text-white"
        >
          <p className="text-amber-100 text-sm font-semibold mb-1">Seller Hub 🏪</p>
          <h2 className="text-2xl font-extrabold mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>
            {user?.name}
          </h2>
          <p className="text-white/70 text-sm">Manage your products and grow your business.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard title="Total Revenue" value={loading ? "—" : `₹${totalRevenue.toLocaleString("en-IN")}`}
            icon={DollarSign} iconBg="bg-emerald-50" iconColor="text-emerald-600" delay={0} />
          <StatsCard title="Total Orders" value={loading ? "—" : orders.length}
            icon={ShoppingBag} iconBg="bg-blue-50" iconColor="text-blue-600" delay={0.08} />
          <StatsCard title="Products Listed" value={loading ? "—" : products.length}
            icon={Package} iconBg="bg-primary/10" iconColor="text-primary" delay={0.16} />
          <StatsCard title="Delivered" value={loading ? "—" : deliveredOrders}
            icon={CheckCircle} iconBg="bg-purple-50" iconColor="text-purple-600" delay={0.24} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-2xl border border-border/50 shadow-sm p-6"
          >
            <h3 className="font-bold text-foreground mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Revenue – Last 6 Months
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  formatter={(value) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "13px" }}
                />
                <Bar dataKey="revenue" fill="#002819" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Order Status Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="bg-white rounded-2xl border border-border/50 shadow-sm p-6"
          >
            <h3 className="font-bold text-foreground mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Order Status
            </h3>
            <div className="space-y-3">
              {[
                { label: "Processing", value: pendingOrders, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Shipped", value: shippedOrders, icon: Truck, color: "text-violet-600", bg: "bg-violet-50" },
                { label: "Delivered", value: deliveredOrders, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </div>
                  <span className={`text-lg font-bold ${color}`}>{loading ? "—" : value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="bg-white rounded-2xl border border-border/50 shadow-sm"
        >
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
              Recent Orders
            </h3>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-secondary rounded-xl animate-pulse" />)}
            </div>
          ) : recentOrders.length === 0 ? (
            <EmptyState icon="📬" title="No orders yet" description="Orders from customers will appear here." />
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-foreground">#{order._id.slice(-8).toUpperCase()}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{order.items?.length}</td>
                      <td className="px-6 py-4 font-semibold">₹{order.totalAmount?.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4"><OrderStatusBadge status={order.orderStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </DashboardLayout>
    </RoleGuard>
  );
}
