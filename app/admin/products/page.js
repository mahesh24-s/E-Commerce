"use client";

import { useEffect, useState } from "react";
import { Star, Trash2, Eye, Search, AlertCircle, PackageX } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/guards/RoleGuard";
import { getAdminProducts, toggleProductFeatured, adminDeleteProduct } from "@/lib/services/product.service";
import toast from "react-hot-toast";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 12, totalPages: 1 });

  useEffect(() => {
    fetchProducts(1);
  }, []);

  const fetchProducts = (page, q = searchQuery) => {
    setLoading(true);
    getAdminProducts({ page, limit: 12, q })
      .then((data) => {
        setProducts(data.products || []);
        if (data.pagination) setPagination(data.pagination);
      })
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoading(false));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(1, searchQuery);
  };

  const handleToggleFeatured = async (product) => {
    try {
      const updatedProduct = await toggleProductFeatured(product._id);
      setProducts((prev) =>
        prev.map((p) => (p._id === updatedProduct._id ? updatedProduct : p))
      );
      toast.success(`Product ${updatedProduct.isFeatured ? "featured" : "unfeatured"}`);
    } catch (err) {
      toast.error(err?.message || "Failed to update featured status");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to soft-delete this product? It will be hidden from the public storefront.")) return;
    try {
      await adminDeleteProduct(id);
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isDeleted: true } : p))
      );
      toast.success("Product deleted successfully");
    } catch (err) {
      toast.error(err?.message || "Failed to delete product");
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <DashboardLayout title="Manage Products">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <p className="text-muted-foreground text-sm">
            Oversee all platform products, feature items on the homepage, and moderate content.
          </p>

          <form onSubmit={handleSearch} className="flex relative max-w-sm w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
            <button type="submit" className="hidden">Search</button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-secondary/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="font-semibold p-4 pl-6">Product</th>
                  <th className="font-semibold p-4">Seller</th>
                  <th className="font-semibold p-4">Price / Stock</th>
                  <th className="font-semibold p-4">Featured</th>
                  <th className="font-semibold p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-muted-foreground">Loading products...</td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-muted-foreground">
                      <PackageX className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p._id} className={`transition-colors ${p.isDeleted ? 'bg-rose-50/30' : 'hover:bg-secondary/20'}`}>
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary border border-border flex-shrink-0">
                            {p.images?.[0]?.url ? (
                              <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px]">No img</div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground max-w-[200px] truncate" title={p.name}>
                              {p.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground uppercase">{p.category?.name || "Uncategorized"}</p>
                            {p.isDeleted && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded mt-1">
                                <AlertCircle className="w-3 h-3" /> DELETED
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-foreground font-medium">
                        {p.seller?.name || "Unknown Seller"}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-foreground">₹{p.price.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.stock > 0 ? `${p.stock} in stock` : <span className="text-rose-500 font-medium">Out of stock</span>}
                        </p>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleFeatured(p)}
                          disabled={p.isDeleted}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            p.isFeatured 
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                          } ${p.isDeleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Toggle Featured Status"
                        >
                          <Star className={`w-3.5 h-3.5 ${p.isFeatured ? 'fill-amber-500' : ''}`} />
                          {p.isFeatured ? "Featured" : "Standard"}
                        </button>
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/products/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-muted-foreground hover:text-primary transition-colors bg-secondary/40 hover:bg-primary/10 rounded-lg"
                            title="View Public Page"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          {!p.isDeleted && (
                            <button
                              onClick={() => handleDelete(p._id)}
                              className="p-2 text-muted-foreground hover:text-rose-600 transition-colors bg-secondary/40 hover:bg-rose-50 rounded-lg"
                              title="Soft Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between bg-secondary/10">
              <span className="text-sm text-muted-foreground font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchProducts(pagination.page - 1)}
                  className="px-3 py-1.5 text-sm font-semibold border border-border rounded-lg bg-white disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchProducts(pagination.page + 1)}
                  className="px-3 py-1.5 text-sm font-semibold border border-border rounded-lg bg-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
