"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Upload, X, Plus, ImageIcon, ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/guards/RoleGuard";
import { getAllCategories, getProductBySlug, updateProduct } from "@/lib/services/product.service";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function EditProduct({ params }) {
  const { slug } = use(params);
  const router = useRouter();
  const fileRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState(null);
  
  const [existingImages, setExistingImages] = useState([]); // { url, public_id }
  const [removedImageIds, setRemovedImageIds] = useState([]); // string[]
  const [newImages, setNewImages] = useState([]); // { file, preview }[]
  
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
    // Fetch categories and product details
    Promise.all([
      getAllCategories(),
      getProductBySlug(slug)
    ])
      .then(([cats, prodData]) => {
        setCategories(cats);
        
        const p = prodData?.product;
        if (p) {
          setProduct(p);
          setForm({
            name: p.name || "",
            description: p.description || "",
            price: p.price || "",
            discountPrice: p.discountPrice || "",
            stock: p.stock !== undefined ? p.stock : "",
            category: p.category?._id || "",
            tags: p.tags ? p.tags.join(", ") : "",
            isFeatured: p.isFeatured || false,
          });
          setExistingImages(p.images || []);
        } else {
          toast.error("Product not found");
          router.push("/seller/products");
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load product details");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug, router]);

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
    const addedImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    
    // Total images cannot exceed 5
    const totalCount = existingImages.length + newImages.length;
    const allowedToAdd = 5 - totalCount;
    
    if (allowedToAdd <= 0) {
      toast.error("A product can have at most 5 images");
      return;
    }
    
    setNewImages((prev) => [...prev, ...addedImages].slice(0, allowedToAdd));
    e.target.value = "";
  };

  const handleNewImageRemove = (i) => {
    URL.revokeObjectURL(newImages[i].preview);
    setNewImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleExistingImageRemove = (public_id) => {
    if (existingImages.length + newImages.length <= 1) {
      toast.error("You must have at least one image");
      return;
    }
    setRemovedImageIds((prev) => [...prev, public_id]);
    setExistingImages((prev) => prev.filter((img) => img.public_id !== public_id));
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
    if (existingImages.length + newImages.length === 0) { toast.error("At least one image is required"); return; }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("price", form.price);
      if (form.discountPrice) {
        fd.append("discountPrice", form.discountPrice);
      } else {
        fd.append("discountPrice", ""); // Clear discount price if empty
      }
      fd.append("stock", form.stock);
      fd.append("category", form.category);
      fd.append("isFeatured", form.isFeatured);
      
      if (form.tags) {
        fd.append("tags", JSON.stringify(form.tags.split(",").map((t) => t.trim()).filter(Boolean)));
      } else {
        fd.append("tags", JSON.stringify([]));
      }

      // Add new images
      newImages.forEach((img) => fd.append("images", img.file));
      
      // Append removed image IDs
      removedImageIds.forEach((id) => fd.append("removeImageIds", id));

      await updateProduct(product._id, fd);
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
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {i === 0 && newImages.length === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] font-bold text-center py-0.5">
                        MAIN
                      </span>
                    )}
                  </div>
                ))}

                {/* New Images */}
                {newImages.map((img, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-primary/40 group">
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleNewImageRemove(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="absolute top-1 left-1 bg-primary/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      NEW
                    </span>
                  </div>
                ))}

                {/* Upload Button */}
                {existingImages.length + newImages.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary transition-all bg-secondary/20"
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
                {submitting ? "Saving Changes..." : "Save Changes"}
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
