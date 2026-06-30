"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Shield, ShoppingBag, User, Users } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/guards/RoleGuard";
import EmptyState from "@/components/dashboard/EmptyState";
import api from "@/lib/api";
import { updateUserRole } from "@/lib/services/user.service";
import toast from "react-hot-toast";

const ROLE_BADGES = {
  admin:    "bg-primary/10 text-primary",
  seller:   "bg-amber-50 text-amber-700",
  customer: "bg-blue-50 text-blue-600",
};

const ROLE_ICONS = { admin: Shield, seller: ShoppingBag, customer: User };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    api.get("/users")
      .then((res) => setUsers(res.data?.data?.users ?? []))
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleUpdate = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      await updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole}`);
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const grouped = {
    admin: users.filter((u) => u.role === "admin").length,
    seller: users.filter((u) => u.role === "seller").length,
    customer: users.filter((u) => u.role === "customer").length,
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <DashboardLayout title="User Management">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[
            { role: "customer", label: "Customers", icon: User, count: grouped.customer, bg: "bg-blue-50", text: "text-blue-600" },
            { role: "seller", label: "Sellers", icon: ShoppingBag, count: grouped.seller, bg: "bg-amber-50", text: "text-amber-600" },
            { role: "admin", label: "Admins", icon: Shield, count: grouped.admin, bg: "bg-primary/10", text: "text-primary" },
          ].map(({ role, label, icon: Icon, count, bg, text }) => (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setRoleFilter(roleFilter === role ? "all" : role)}
              style={{ outline: roleFilter === role ? "2px solid #002819" : "none" }}
            >
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${text}`} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
                  {loading ? "—" : count}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex gap-2">
            {["all", "customer", "seller", "admin"].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                  roleFilter === r ? "bg-primary text-white" : "bg-white border border-border hover:border-primary/40 text-muted-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="👤" title="No users found" description="Try adjusting your search or filter." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                    <th className="text-left px-6 py-3 font-semibold">User</th>
                    <th className="text-left px-6 py-3 font-semibold">Role</th>
                    <th className="text-left px-6 py-3 font-semibold">Phone</th>
                    <th className="text-left px-6 py-3 font-semibold">Verified</th>
                    <th className="text-left px-6 py-3 font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((user) => {
                    const RoleIcon = ROLE_ICONS[user.role] ?? User;
                    return (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground overflow-hidden flex-shrink-0">
                              {user.avatar?.url ? (
                                <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                user.name?.[0]?.toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <RoleIcon className={`w-4 h-4 ${ROLE_BADGES[user.role]?.split(" ")[1] ?? "text-muted-foreground"}`} />
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                              disabled={updatingId === user._id}
                              className={`text-xs font-semibold px-2 py-1 rounded-full border border-transparent focus:border-border hover:border-border transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 ${ROLE_BADGES[user.role] ?? "bg-secondary text-muted-foreground"}`}
                            >
                              <option value="customer">Customer</option>
                              <option value="seller">Seller</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{user.phone ?? "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${user.isVerified ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                            {user.isVerified ? "Verified" : "Unverified"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs">
                          {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
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
