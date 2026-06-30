"use client";

/**
 * components/dashboard/DashboardLayout.jsx
 *
 * Shared sidebar + topbar layout for all three dashboards.
 * Nav items are role-aware. Sidebar collapses on mobile.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Heart,
  User,
  Users,
  Tag,
  ClipboardList,
  PlusSquare,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
  Settings,
  Library,
} from "lucide-react";
import { logout } from "@/store/slices/authSlice";
import { clearCart } from "@/store/slices/cartSlice";
import { clearWishlist } from "@/store/slices/wishlistSlice";
import { logoutUser } from "@/lib/services/auth.service";
import toast from "react-hot-toast";

const NAV_ITEMS = {
  customer: [
    { label: "Overview", href: "/customer", icon: LayoutDashboard },
    { label: "My Orders", href: "/customer/orders", icon: ShoppingBag },
    { label: "Wishlist", href: "/customer/wishlist", icon: Heart },
    { label: "Profile", href: "/customer/profile", icon: User },
  ],
  seller: [
    { label: "Dashboard", href: "/seller/dashboard", icon: LayoutDashboard },
    { label: "Products", href: "/seller/products", icon: Package },
    { label: "Add Product", href: "/seller/products/new", icon: PlusSquare },
    { label: "Orders", href: "/seller/orders", icon: ShoppingBag },
    { label: "Category Requests", href: "/seller/category-requests", icon: MessageSquare },
  ],
  admin: [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Products", href: "/admin/products", icon: Package },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Categories", href: "/admin/categories", icon: Tag },
    { label: "Collections", href: "/admin/collections", icon: Library },
    { label: "Orders", href: "/admin/orders", icon: ClipboardList },
  ],
};

const ROLE_LABELS = {
  customer: "Customer",
  seller: "Seller",
  admin: "Admin",
};

const ROLE_COLORS = {
  customer: "bg-blue-500/10 text-blue-600",
  seller: "bg-amber-500/10 text-amber-600",
  admin: "bg-primary/10 text-primary",
};

export default function DashboardLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, role } = useSelector((s) => s.auth);

  const navItems = NAV_ITEMS[role] ?? [];

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (_) { /* silent */ }
    dispatch(logout());
    dispatch(clearCart());
    dispatch(clearWishlist());
    localStorage.removeItem("shopease_token");
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>
            ShopEase
          </span>
        </Link>
      </div>

      {/* User info */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.avatar?.url ? (
              <img src={user.avatar.url} alt={user.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase() ?? "U"
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate" style={{ fontFamily: "Manrope, sans-serif" }}>
              {user?.name ?? "User"}
            </p>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[role]}`}>
              {ROLE_LABELS[role] ?? role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/admin" && href !== "/customer" && href !== "/seller/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/60 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 transition-colors ${isActive ? "text-white" : "text-white/50 group-hover:text-white/80"}`} />
              <span>{label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-white/40" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-4 py-4 border-t border-white/10 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white transition-all"
        >
          <ShoppingBag className="w-4.5 h-4.5" />
          Go to Store
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          <LogOut className="w-4.5 h-4.5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f7f5] flex">
      {/* ── Desktop Sidebar ──────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#002819] fixed inset-y-0 left-0 z-40">
        <NavContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ───────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-64 bg-[#002819] z-50 lg:hidden"
            >
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ─────────────────────────────────── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center gap-4 px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1">
              <h1
                className="text-lg font-bold text-foreground"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center transition-colors">
                <Bell className="w-4.5 h-4.5 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border border-white" />
              </button>
              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {user?.avatar?.url ? (
                  <img src={user.avatar.url} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user?.name?.[0]?.toUpperCase() ?? "U"
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
