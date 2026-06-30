"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { ShoppingBag, Heart, Package, ArrowRight, Star } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/guards/RoleGuard";
import StatsCard from "@/components/dashboard/StatsCard";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import EmptyState from "@/components/dashboard/EmptyState";
import { getUserOrders } from "@/lib/services/user.service";
import { getWishlist } from "@/lib/services/user.service";

export default function CustomerDashboard() {
  const { user } = useSelector((s) => s.auth);
  const [orders, setOrders] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getUserOrders().catch(() => ({ orders: [] })),
      getWishlist().catch(() => null),
    ]).then(([orderData, wishData]) => {
      setOrders(orderData?.orders ?? []);
      setWishlistCount(wishData?.wishlist?.products?.length ?? 0);
    }).finally(() => setLoading(false));
  }, []);

  const totalSpend = orders
    .filter((o) => o.paymentInfo?.status === "paid")
    .reduce((s, o) => s + o.totalAmount, 0);

  const recentOrders = orders.slice(0, 5);

  return (
    <RoleGuard allowedRoles={["customer"]}>
      <DashboardLayout title="My Dashboard">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#002819] to-[#06402b] rounded-2xl p-6 mb-6 text-white"
        >
          <p className="text-[#9cd2b5] text-sm font-semibold mb-1">Welcome back 👋</p>
          <h2
            className="text-2xl font-extrabold mb-2"
            style={{ fontFamily: "Manrope, sans-serif" }}
          >
            {user?.name ?? "Shopper"}
          </h2>
          <p className="text-white/60 text-sm">Track your orders and manage your account.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Total Orders"
            value={loading ? "—" : orders.length}
            icon={ShoppingBag}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            delay={0}
          />
          <StatsCard
            title="Total Spent"
            value={loading ? "—" : `₹${totalSpend.toLocaleString("en-IN")}`}
            icon={Package}
            iconBg="bg-primary/10"
            iconColor="text-primary"
            delay={0.08}
          />
          <StatsCard
            title="Wishlist Items"
            value={loading ? "—" : wishlistCount}
            icon={Heart}
            iconBg="bg-pink-50"
            iconColor="text-pink-500"
            delay={0.16}
          />
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h3
              className="font-bold text-foreground"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Recent Orders
            </h3>
            <Link
              href="/customer/orders"
              className="text-xs font-semibold text-primary hover:underline underline-offset-4 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No orders yet"
              description="Start shopping and your orders will appear here."
              action={
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-all"
                >
                  Start Shopping <ArrowRight className="w-4 h-4" />
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.items?.length} item{order.items?.length !== 1 ? "s" : ""} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-foreground">
                      ₹{order.totalAmount?.toLocaleString("en-IN")}
                    </span>
                    <OrderStatusBadge status={order.orderStatus} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
