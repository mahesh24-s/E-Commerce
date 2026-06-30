"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, X, Plus, ImageIcon, ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/guards/RoleGuard";
import { getAllCategories } from "@/lib/services/product.service";
import { createProduct } from "@/lib/services/product.service";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function NewProduct() {
  const router = useRouter();
  const fileRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]); // { file, preview }[]
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
    getAllCategories().then(setCategories).catch(() => {});
  }, []);

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

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files ?? []);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages].slice(0, 5)); // max 5 images
    e.target.value = "";
  };

  const handleImageRemove = (i) => {
    URL.revokeObjectURL(images[i].preview);
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    if (!form.price) { toast.error("Price is required"); return; }
    if (!form.stock) { toast.error("Stock is required"); return; }
    if (!form.category) { toast.error("Category is required"); return; }
    if (images.length === 0) { toast.error("At least one image is required"); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("price", form.price);
      if (form.discountPrice) fd.append("discountPrice", form.discountPrice);
      fd.append("stock", form.stock);
      fd.append("category", form.category);
      fd.append("isFeatured", form.isFeatured);
      if (form.tags) fd.append("tags", JSON.stringify(form.tags.split(",").map((t) => t.trim()).filter(Boolean)));
      images.forEach((img) => fd.append("images", img.file));

      await createProduct(fd);
      toast.success("Product created successfully!");
      router.push("/seller/products");
    } catch (err) {
      toast.error(err?.message ?? "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <DashboardLayout title="Add New Product">
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
                {images.map((img, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border group">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(i)}
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
                {images.length < 5 && (
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
                {submitting ? "Creating..." : "Create Product"}
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
