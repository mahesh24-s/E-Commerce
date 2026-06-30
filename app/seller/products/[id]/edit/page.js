"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, X, Plus, ImageIcon, ArrowLeft, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/guards/RoleGuard";
import { getAllCategories, getProductBySlug, updateProduct } from "@/lib/services/product.service";
import api from "@/lib/api"; // For direct fetch by ID if slug not available
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function EditProduct() {
  const router = useRouter();
  const { id } = useParams();
  const fileRef = useRef(null);
  const [categories, setCategories] = useState([]);
  
  // Existing images from DB, new images selected by user, and IDs of DB images to remove
  const [existingImages, setExistingImages] = useState([]); // { public_id, url }[]
  const [newImages, setNewImages] = useState([]); // { file, preview }[]
  const [removeImageIds, setRemoveImageIds] = useState([]); // string[]

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    discountPrice: "",
    stock: "",
    category: "",
    tags: "",
    isFeatured: false,
  });

  useEffect(() => {
    Promise.all([
      getAllCategories(),
      api.get(`/products`).then(res => {
        // Find product by id from the list, or fetch directly if there's an endpoint
        // Wait, there is no getProductById endpoint for seller? Let's check `getProductBySlug`.
        // The `updateProduct` takes an ID. 
        // We can just fetch all seller products and find it.
        return api.get("/products/seller/my-products", { params: { limit: 100 } });
      })
    ]).then(([cats, prodRes]) => {
      setCategories(cats);
      
      const product = prodRes.data?.data?.products?.find(p => p._id === id);
      if (!product) {
        toast.error("Product not found");
        router.push("/seller/products");
        return;
      }

      setForm({
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        discountPrice: product.discountPrice || "",
        stock: product.stock || "",
        category: product.category?._id || product.category || "",
        tags: product.tags?.join(", ") || "",
        isFeatured: product.isFeatured || false,
      });
      setExistingImages(product.images || []);
      setLoading(false);
    }).catch((err) => {
      toast.error("Failed to load product details");
      router.push("/seller/products");
    });
  }, [id, router]);

  const flattenCategories = (cats, prefix = '') => {
    let result = [];
    cats.forEach(cat => {
      result.push({ _id: cat._id, name: prefix + cat.name });
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, prefix + cat.name + ' > '));
      }
    });
    return result;
  };

  const flatCategories = flattenCategories(categories);
  const totalImagesCount = existingImages.length + newImages.length;

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files ?? []);
    if (totalImagesCount + files.length > 5) {
      toast.error("You can have a maximum of 5 images");
      return;
    }
    const addedImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImages((prev) => [...prev, ...addedImages].slice(0, 5 - existingImages.length));
    e.target.value = "";
  };

  const handleNewImageRemove = (i) => {
    URL.revokeObjectURL(newImages[i].preview);
    setNewImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleExistingImageRemove = (public_id) => {
    setExistingImages(prev => prev.filter(img => img.public_id !== public_id));
    setRemoveImageIds(prev => [...prev, public_id]);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    if (!form.price) { toast.error("Price is required"); return; }
    if (form.stock === "") { toast.error("Stock is required"); return; }
    if (!form.category) { toast.error("Category is required"); return; }
    if (totalImagesCount === 0) { toast.error("At least one image is required"); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("price", form.price);
      if (form.discountPrice) fd.append("discountPrice", form.discountPrice);
      else fd.append("discountPrice", ""); // clear discount
      
      fd.append("stock", form.stock);
      fd.append("category", form.category);
      fd.append("isFeatured", form.isFeatured);
      if (form.tags) fd.append("tags", JSON.stringify(form.tags.split(",").map((t) => t.trim()).filter(Boolean)));
      
      newImages.forEach((img) => fd.append("images", img.file));
      removeImageIds.forEach((id) => fd.append("removeImageIds", id));

      await updateProduct(id, fd);
      toast.success("Product updated successfully!");
      router.push("/seller/products");
    } catch (err) {
      toast.error(err?.message ?? "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["seller"]}>
        <DashboardLayout title="Edit Product">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <DashboardLayout title="Edit Product">
        <div className="max-w-2xl">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Products
          </button>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Images */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-border/50 shadow-sm p-6"
            >
              <h3 className="font-bold text-foreground mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
                Product Images <span className="text-muted-foreground font-normal text-sm">(up to 5)</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {/* Existing Images */}
                {existingImages.map((img, i) => (
                  <div key={img.public_id} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border group">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleExistingImageRemove(img.public_id)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] font-bold text-center py-0.5">
                        MAIN
                      </span>
                    )}
                  </div>
                ))}

                {/* New Images */}
                {newImages.map((img, i) => (
                  <div key={`new-${i}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border group">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleNewImageRemove(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[9px] font-bold text-center py-0.5">
                      NEW
                    </span>
                  </div>
                ))}

                {totalImagesCount < 5 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary transition-all"
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-[11px] font-medium">Add</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
              </div>
            </motion.div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl border border-border/50 shadow-sm p-6 space-y-4"
            >
              <h3 className="font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>Product Details</h3>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Product Name *</label>
                <input name="name" value={form.name} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                  placeholder="e.g. Sony WH-1000XM5 Headphones" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all resize-none"
                  placeholder="Describe your product in detail..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Category *</label>
                <select name="category" value={form.category} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all">
                  <option value="">Select a category</option>
                  {flatCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Tags (comma separated)</label>
                <input name="tags" value={form.tags} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                  placeholder="wireless, headphones, noise-cancelling" />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm((f) => ({ ...f, isFeatured: !f.isFeatured }))}
                  className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer ${form.isFeatured ? "bg-primary" : "bg-border"}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform duration-200 ${form.isFeatured ? "translate-x-4.5" : "translate-x-0"}`} />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">Mark as Featured</span>
                  <p className="text-xs text-muted-foreground">Featured products appear on the home page.</p>
                </div>
              </label>
            </motion.div>

            {/* Pricing & Stock */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-border/50 shadow-sm p-6 space-y-4"
            >
              <h3 className="font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>Pricing & Inventory</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Price (₹) *</label>
                  <input name="price" type="number" min="0" value={form.price} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                    placeholder="1999" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Discount Price (₹)</label>
                  <input name="discountPrice" type="number" min="0" value={form.discountPrice} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                    placeholder="1499 (optional)" />
                </div>
              </div>

              <div className="max-w-xs">
                <label className="block text-sm font-medium text-foreground mb-1.5">Stock Quantity *</label>
                <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                  placeholder="50" />
              </div>
            </motion.div>

            {/* Submit */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-primary text-white px-8 py-3 font-semibold hover:opacity-90 transition-all flex-1 sm:flex-none"
              >
                {submitting ? "Updating..." : "Update Product"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="rounded-full px-8 py-3 font-semibold border-border"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
