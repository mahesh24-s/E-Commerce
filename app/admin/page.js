"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Package, ShoppingBag, DollarSign, TrendingUp,
  Tag, AlertCircle, CheckCircle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/guards/RoleGuard";
import StatsCard from "@/components/dashboard/StatsCard";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import api from "@/lib/api";
import toast from "react-hot-toast";

const PIE_COLORS = ["#002819", "#06402b", "#0a6642", "#10a37f", "#34d399", "#6ee7b7"];

function buildMonthlyOrders(orders) {
  const months = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-IN", { month: "short" });
    months[key] = { revenue: 0, orders: 0 };
  }
  orders.forEach((o) => {
    if (o.paymentInfo?.status !== "paid") return;
    const d = new Date(o.createdAt);
    const key = d.toLocaleString("en-IN", { month: "short" });
    if (key in months) {
      months[key].revenue += o.totalAmount;
      months[key].orders += 1;
    }
  });
  return Object.entries(months).map(([month, v]) => ({ month, ...v }));
}

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0, sellers: 0, customers: 0,
    orders: 0, products: 0, categories: 0,
    revenue: 0, pendingRequests: 0,
  });
  const [orders, setOrders] = useState([]);
  const [orderStatusBreakdown, setOrderStatusBreakdown] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/users").catch(() => null),
      api.get("/orders").catch(() => null),
      api.get("/products", { params: { limit: 1 } }).catch(() => null),
      api.get("/categories/admin/all").catch(() => null),
      api.get("/category-requests", { params: { status: "pending" } }).catch(() => null),
    ]).then(([usersRes, ordersRes, productsRes, catsRes, reqRes]) => {
      const users = usersRes?.data?.data?.users ?? [];
      const allOrders = ordersRes?.data?.data?.orders ?? [];
      const categories = catsRes?.data?.data?.categories ?? [];
      const pendingReqs = reqRes?.data?.data?.requests ?? [];

      const revenue = allOrders
        .filter((o) => o.paymentInfo?.status === "paid")
        .reduce((s, o) => s + o.totalAmount, 0);

      // Status breakdown for pie chart
      const statusMap = {};
      allOrders.forEach((o) => {
        statusMap[o.orderStatus] = (statusMap[o.orderStatus] ?? 0) + 1;
      });

      setStats({
        users: users.length,
        sellers: users.filter((u) => u.role === "seller").length,
        customers: users.filter((u) => u.role === "customer").length,
        orders: allOrders.length,
        products: productsRes?.data?.data?.pagination?.total ?? 0,
        categories: categories.length,
        revenue,
        pendingRequests: pendingReqs.length,
      });
      setOrders(allOrders);
      setOrderStatusBreakdown(
        Object.entries(statusMap).map(([name, value]) => ({ name, value }))
      );
    }).catch(() => toast.error("Failed to load admin stats"))
      .finally(() => setLoading(false));
  }, []);

  const chartData = buildMonthlyOrders(orders);

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <DashboardLayout title="Admin Overview">
        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#002819] to-[#06402b] rounded-2xl p-6 mb-6 text-white"
        >
          <p className="text-[#9cd2b5] text-sm font-semibold mb-1">Admin Panel 🔑</p>
          <h2 className="text-2xl font-extrabold mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>
            Platform Overview
          </h2>
          <p className="text-white/60 text-sm">Monitor and manage all ShopEase activity.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard title="Total Revenue" value={loading ? "—" : `₹${stats.revenue.toLocaleString("en-IN")}`}
            icon={DollarSign} iconBg="bg-emerald-50" iconColor="text-emerald-600" delay={0} />
          <StatsCard title="Total Orders" value={loading ? "—" : stats.orders}
            icon={ShoppingBag} iconBg="bg-blue-50" iconColor="text-blue-600" delay={0.07} />
          <StatsCard title="Total Users" value={loading ? "—" : stats.users}
            icon={Users} iconBg="bg-violet-50" iconColor="text-violet-600" delay={0.14} />
          <StatsCard title="Products" value={loading ? "—" : stats.products}
            icon={Package} iconBg="bg-primary/10" iconColor="text-primary" delay={0.21} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatsCard title="Sellers" value={loading ? "—" : stats.sellers}
            icon={TrendingUp} iconBg="bg-amber-50" iconColor="text-amber-600" delay={0} />
          <StatsCard title="Categories" value={loading ? "—" : stats.categories}
            icon={Tag} iconBg="bg-pink-50" iconColor="text-pink-600" delay={0.08} />
          <StatsCard
            title="Pending Requests"
            value={loading ? "—" : stats.pendingRequests}
            icon={AlertCircle}
            iconBg={stats.pendingRequests > 0 ? "bg-red-50" : "bg-secondary"}
            iconColor={stats.pendingRequests > 0 ? "text-red-600" : "text-muted-foreground"}
            subtitle={stats.pendingRequests > 0 ? "Category requests awaiting approval" : "No pending requests"}
            delay={0.16}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue area chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-2 bg-white rounded-2xl border border-border/50 shadow-sm p-6"
          >
            <h3 className="font-bold text-foreground mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Revenue – Last 6 Months
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#002819" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#002819" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                <Tooltip
                  formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "13px" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#002819" strokeWidth={2} fill="url(#revenueGrad)" dot={{ r: 4, fill: "#002819" }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Order status pie */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="bg-white rounded-2xl border border-border/50 shadow-sm p-6"
          >
            <h3 className="font-bold text-foreground mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              Order Status Split
            </h3>
            {orderStatusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={orderStatusBreakdown} cx="50%" cy="45%" outerRadius={70} dataKey="value" paddingAngle={3}>
                    {orderStatusBreakdown.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "13px" }} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                No order data
              </div>
            )}
          </motion.div>
        </div>

        {/* Recent orders */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="bg-white rounded-2xl border border-border/50 shadow-sm"
        >
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
              Latest Orders
            </h3>
          </div>
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-secondary rounded-xl animate-pulse" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">No orders yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                    <th className="text-left px-6 py-3 font-semibold">Order ID</th>
                    <th className="text-left px-6 py-3 font-semibold">Date</th>
                    <th className="text-left px-6 py-3 font-semibold">Items</th>
                    <th className="text-left px-6 py-3 font-semibold">Amount</th>
                    <th className="text-left px-6 py-3 font-semibold">Payment</th>
                    <th className="text-left px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.slice(0, 8).map((order) => (
                    <tr key={order._id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold">#{order._id.slice(-8).toUpperCase()}</td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{order.items?.length}</td>
                      <td className="px-6 py-4 font-semibold">₹{order.totalAmount?.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4"><OrderStatusBadge status={order.paymentInfo?.status} /></td>
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
