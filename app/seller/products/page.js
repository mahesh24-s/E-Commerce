"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Search, Package } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/guards/RoleGuard";
import EmptyState from "@/components/dashboard/EmptyState";
import { getSellerProducts, deleteProduct } from "@/lib/services/product.service";
import toast from "react-hot-toast";

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = async (p = 1, q = "") => {
    setLoading(true);
    try {
      const data = await getSellerProducts({ page: p, limit: 10, q });
      setProducts(data?.products ?? []);
      setTotalPages(data?.pagination?.totalPages ?? 1);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(1, search); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(1, search);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Product deleted");
    } catch (err) {
      toast.error(err?.message ?? "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const StockBadge = ({ stock }) => (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
      stock === 0 ? "bg-red-50 text-red-600" : stock < 10 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
    }`}>
      {stock === 0 ? "Out of Stock" : stock < 10 ? `Low: ${stock}` : `In Stock: ${stock}`}
    </span>
  );

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <DashboardLayout title="My Products">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-5">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all"
            >
              Search
            </button>
          </form>

          <Link
            href="/seller/products/new"
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No products yet"
              description="Start by adding your first product."
              action={
                <Link href="/seller/products/new" className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:opacity-90 transition-all">
                  <Plus className="w-4 h-4" /> Add Product
                </Link>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
                      <th className="text-left px-6 py-3 font-semibold">Product</th>
                      <th className="text-left px-6 py-3 font-semibold">Category</th>
                      <th className="text-left px-6 py-3 font-semibold">Price</th>
                      <th className="text-left px-6 py-3 font-semibold">Stock</th>
                      <th className="text-right px-6 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {products.map((product) => (
                      <motion.tr
                        key={product._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                              {product.images?.[0]?.url ? (
                                <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg">🛍️</div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground line-clamp-1" style={{ fontFamily: "Manrope, sans-serif" }}>
                                {product.name}
                              </p>
                              {product.isFeatured && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">Featured</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{product.category?.name ?? "—"}</td>
                        <td className="px-6 py-4 font-semibold text-foreground">
                          ₹{(product.discountPrice || product.price)?.toLocaleString("en-IN")}
                          {product.discountPrice && (
                            <span className="text-xs text-muted-foreground line-through ml-2">₹{product.price?.toLocaleString("en-IN")}</span>
                          )}
                        </td>
                        <td className="px-6 py-4"><StockBadge stock={product.stock} /></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/seller/products/edit/${product.slug}`}
                              className="p-2 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                              aria-label="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleDelete(product._id, product.name)}
                              disabled={deleting === product._id}
                              className="p-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 hover:text-red-600 transition-all disabled:opacity-50"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
                      onClick={() => { setPage(i + 1); fetchProducts(i + 1, search); }}
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
