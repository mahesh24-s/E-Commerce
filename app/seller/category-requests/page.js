"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Send, Clock, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/guards/RoleGuard";
import EmptyState from "@/components/dashboard/EmptyState";
import { createCategoryRequest } from "@/lib/services/seller.service";
import { getAllCategories } from "@/lib/services/product.service";
import api from "@/lib/api";
import toast from "react-hot-toast";

const STATUS_STYLES = {
  pending:  { icon: Clock, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  approved: { icon: CheckCircle, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  rejected: { icon: XCircle, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

export default function CategoryRequests() {
  const [requests, setRequests] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ requestedName: "", description: "", parentCategory: "" });

  useEffect(() => {
    Promise.all([
      // Seller can only GET their own requests — we fetch all and filter by seller on backend
      api.get("/category-requests").catch(() => ({ data: { data: { requests: [] } } })),
      getAllCategories().catch(() => []),
    ]).then(([reqRes, cats]) => {
      setRequests(reqRes.data?.data?.requests ?? []);
      setCategories(cats);
    }).finally(() => setLoading(false));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.requestedName.trim()) { toast.error("Category name is required"); return; }
    setSubmitting(true);
    try {
      const newReq = await createCategoryRequest({
        requestedName: form.requestedName,
        description: form.description,
        parentCategory: form.parentCategory || undefined,
      });
      setRequests((prev) => [newReq, ...prev]);
      setForm({ requestedName: "", description: "", parentCategory: "" });
      toast.success("Category request submitted!");
    } catch (err) {
      toast.error(err?.message ?? "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["seller"]}>
      <DashboardLayout title="Category Requests">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-border/50 shadow-sm p-6 h-fit"
          >
            <h3 className="font-bold text-foreground mb-1" style={{ fontFamily: "Manrope, sans-serif" }}>
              Request New Category
            </h3>
            <p className="text-xs text-muted-foreground mb-5">
              Can&apos;t find the right category? Ask the admin to create one.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Category Name *</label>
                <input
                  value={form.requestedName}
                  onChange={(e) => setForm((f) => ({ ...f, requestedName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                  placeholder="e.g. Smart Home Devices"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Parent Category</label>
                <select
                  value={form.parentCategory}
                  onChange={(e) => setForm((f) => ({ ...f, parentCategory: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                >
                  <option value="">None (top-level)</option>
                  {flatCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all resize-none"
                  placeholder="Why is this category needed?"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </form>
          </motion.div>

          {/* Requests list */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-foreground mb-4" style={{ fontFamily: "Manrope, sans-serif" }}>
              My Requests
            </h3>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-border/50 shadow-sm">
                <EmptyState icon="💬" title="No requests yet" description="Submit your first category request using the form." />
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req, i) => {
                  const style = STATUS_STYLES[req.status] ?? STATUS_STYLES.pending;
                  const Icon = style.icon;
                  return (
                    <motion.div
                      key={req._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-white rounded-2xl border border-border/50 shadow-sm p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
                            {req.requestedName}
                          </p>
                          {req.description && (
                            <p className="text-xs text-muted-foreground mt-1">{req.description}</p>
                          )}
                          {req.adminComment && (
                            <p className="text-xs text-foreground mt-2 bg-secondary/60 rounded-lg px-3 py-2">
                              <span className="font-semibold">Admin:</span> {req.adminComment}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0 ${style.bg} ${style.text} ${style.border}`}>
                          <Icon className="w-3 h-3" />
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
