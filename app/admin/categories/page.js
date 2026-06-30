"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Tag, Check, X, Image as ImageIcon, Edit2,
  FolderTree, ChevronDown, ChevronRight,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/guards/RoleGuard";
import EmptyState from "@/components/dashboard/EmptyState";
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryRequests,
  updateCategoryRequestStatus,
} from "@/lib/services/admin.service";
import toast from "react-hot-toast";

/* ─── helpers ─────────────────────────────────────────── */
const EMPTY_FORM = { name: "", parentId: "", imageFile: null, imagePreview: "" };

/** Flatten a nested tree into a flat list with depth info */
function flattenTree(nodes, depth = 0) {
  const result = [];
  for (const node of nodes) {
    result.push({ ...node, _depth: depth });
    if (node.children?.length) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

/** Flatten a nested tree into a flat list with correct depth for parent selector */
function getAllFlat(nodes, depth = 0) {
  const result = [];
  for (const node of nodes) {
    result.push({ _id: node._id, name: node.name, _depth: depth });
    if (node.children?.length) {
      result.push(...getAllFlat(node.children, depth + 1));
    }
  }
  return result;
}

/* ─── CategoryForm (create / edit modal) ─────────────── */
function CategoryForm({ initial = EMPTY_FORM, allFlat = [], onSave, onCancel, saving, editingId }) {
  const [form, setForm] = useState(initial);
  const fileRef = useRef(null);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set("imageFile", file);
    set("imagePreview", URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Category name is required"); return; }
    const fd = new FormData();
    fd.append("name", form.name.trim());
    if (form.parentId) fd.append("parent", form.parentId);
    if (form.imageFile) fd.append("image", form.imageFile);
    onSave(fd);
  };

  // Don't allow a category to be its own parent
  const parentOptions = allFlat.filter((c) => c._id !== editingId);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden"
    >
      <form onSubmit={handleSubmit} className="px-6 py-5 border-b border-border bg-primary/5 space-y-4">
        <p className="text-sm font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
          {editingId ? "✏️ Edit Category" : "➕ New Category"}
        </p>

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">Category Name *</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Gaming Laptops"
            autoFocus
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          />
        </div>

        {/* Parent selector */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            <FolderTree className="w-3.5 h-3.5 inline mr-1 text-primary" />
            Parent Category{" "}
            <span className="text-muted-foreground font-normal">(leave empty for top-level)</span>
          </label>
          <select
            value={form.parentId}
            onChange={(e) => set("parentId", e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          >
            <option value="">— Top-level (no parent) —</option>
            {parentOptions.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {"  ".repeat(cat._depth)}{cat._depth > 0 ? "↳ " : ""}{cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            <ImageIcon className="w-3.5 h-3.5 inline mr-1 text-primary" />
            Category Image{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <div className="flex items-center gap-3">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-16 h-16 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-white flex items-center justify-center cursor-pointer overflow-hidden transition-all"
            >
              {form.imagePreview ? (
                <img src={form.imagePreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
              )}
            </div>
            <div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="text-xs text-primary font-medium hover:underline">
                {form.imagePreview ? "Change image" : "Upload image"}
              </button>
              <p className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG up to 5 MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
            <Check className="w-4 h-4" /> {saving ? "Saving…" : editingId ? "Update" : "Create"}
          </button>
          <button type="button" onClick={onCancel}
            className="px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-secondary transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}

/* ─── Recursive CategoryRow ───────────────────────────── */
function CategoryRow({ cat, allFlat, depth = 0, onEdit, onDelete, onAddSub }) {
  const [expanded, setExpanded] = useState(depth === 0); // auto-expand root level
  const hasChildren = cat.children?.length > 0;
  const indent = depth * 28; // px indent per level

  return (
    <>
      {/* Row */}
      <div
        className={`flex items-center justify-between py-3 pr-6 hover:bg-secondary/20 transition-colors border-b border-border/40 last:border-0 ${!cat.isActive ? "opacity-40" : ""}`}
        style={{ paddingLeft: `${16 + indent}px` }}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Expand / spacer */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded transition-colors ${hasChildren ? "hover:bg-secondary text-muted-foreground cursor-pointer" : "cursor-default opacity-0 pointer-events-none"}`}
          >
            {hasChildren && (expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
          </button>

          {/* Depth indicator */}
          {depth > 0 && (
            <span className="text-muted-foreground/40 text-sm flex-shrink-0 select-none">{"↳"}</span>
          )}

          {/* Thumbnail */}
          <div className={`${depth === 0 ? "w-10 h-10" : "w-8 h-8"} rounded-lg overflow-hidden flex-shrink-0 border border-border bg-secondary/40`}>
            {cat.image?.url ? (
              <img src={cat.image.url} alt={cat.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Tag className={`${depth === 0 ? "w-4 h-4" : "w-3.5 h-3.5"} text-muted-foreground/40`} />
              </div>
            )}
          </div>

          {/* Name + slug */}
          <div className="min-w-0">
            <p className={`font-${depth === 0 ? "semibold" : "medium"} text-foreground text-sm truncate`}
              style={{ fontFamily: depth === 0 ? "Manrope, sans-serif" : undefined }}>
              {cat.name}
            </p>
            <p className="text-[11px] text-muted-foreground">
              /{cat.slug}
              {hasChildren && (
                <span className="ml-1.5 text-primary/70 font-medium">
                  · {cat.children.length} sub{cat.children.length === 1 ? "category" : "categories"}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {cat.isActive ? "Active" : "Inactive"}
          </span>

          {cat.isActive && (
            <>
              {/* + Sub button — the key feature */}
              <button
                onClick={() => onAddSub(cat)}
                title={`Add subcategory under "${cat.name}"`}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-all text-[11px] font-semibold"
              >
                <Plus className="w-3 h-3" /> Sub
              </button>

              <button onClick={() => onEdit(cat)}
                className="p-1.5 rounded-lg border border-border hover:bg-secondary transition-all"
                aria-label="Edit">
                <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button onClick={() => onDelete(cat._id, cat.name)}
                className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-all"
                aria-label="Deactivate">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Children — simple conditional render (no height animation, it clips) */}
      {expanded && hasChildren && (
        <div className="bg-secondary/10">
          {cat.children.map((child) => (
            <CategoryRow
              key={child._id}
              cat={child}
              allFlat={allFlat}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSub={onAddSub}
            />
          ))}
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════════ */
export default function AdminCategories() {
  const [categories, setCategories] = useState([]); // recursive tree
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("categories");

  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [presetParentId, setPresetParentId] = useState(""); // set when clicking "+ Sub"
  const [saving, setSaving] = useState(false);

  const [processing, setProcessing] = useState(null);
  const [commentMap, setCommentMap] = useState({});

  // Flat list of all categories for the parent dropdown
  const allFlat = getAllFlat(categories);

  useEffect(() => {
    Promise.all([
      getAdminCategories().catch(() => []),
      getCategoryRequests().catch(() => []),
    ]).then(([cats, reqs]) => {
      setCategories(cats);
      setRequests(reqs);
    }).finally(() => setLoading(false));
  }, []);

  /* ── Reload tree helper ── */
  const reload = async () => {
    const fresh = await getAdminCategories().catch(() => []);
    setCategories(fresh);
  };

  /* ── Create / Update ── */
  const handleSave = async (fd) => {
    setSaving(true);
    try {
      if (editingCat) {
        await updateCategory(editingCat._id, fd);
        toast.success("Category updated!");
      } else {
        await createCategory(fd);
        toast.success("Category created!");
      }
      await reload();
      setShowForm(false);
      setEditingCat(null);
      setPresetParentId("");
    } catch (err) {
      toast.error(err?.message ?? "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  /* ── Edit ── */
  const handleEdit = (cat) => {
    setEditingCat(cat);
    setPresetParentId("");
    setShowForm(true);
  };

  /* ── Add subcategory under a specific parent ── */
  const handleAddSub = (parentCat) => {
    setEditingCat(null);
    setPresetParentId(parentCat._id);
    setShowForm(true);
    // Scroll form into view
    setTimeout(() => document.getElementById("cat-form-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  /* ── Cancel ── */
  const handleCancel = () => {
    setShowForm(false);
    setEditingCat(null);
    setPresetParentId("");
  };

  /* ── Delete (deactivate) ── */
  const handleDelete = async (id, name) => {
    if (!confirm(`Deactivate "${name}" and all its subcategories?`)) return;
    try {
      await deleteCategory(id);
      await reload();
      toast.success("Category deactivated");
    } catch (err) {
      toast.error(err?.message ?? "Failed to deactivate");
    }
  };

  /* ── Request approve/reject ── */
  const handleRequest = async (id, status) => {
    setProcessing(id);
    try {
      const result = await updateCategoryRequestStatus(id, {
        status,
        adminComment: commentMap[id] ?? "",
      });
      setRequests((prev) =>
        prev.map((r) => r._id === id ? { ...r, status, adminComment: commentMap[id] ?? "" } : r)
      );
      if (status === "approved" && result?.newCategory) await reload();
      toast.success(`Request ${status}`);
    } catch (err) {
      toast.error(err?.message ?? "Failed to process request");
    } finally {
      setProcessing(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const totalCount = allFlat.length;

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <DashboardLayout title="Categories">

        {/* Tab switcher */}
        <div className="flex gap-3 mb-5">
          <button
            onClick={() => setTab("categories")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${tab === "categories" ? "bg-primary text-white shadow-sm" : "bg-white border border-border text-muted-foreground hover:border-primary/40"}`}
          >
            Categories ({totalCount})
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all relative ${tab === "requests" ? "bg-primary text-white shadow-sm" : "bg-white border border-border text-muted-foreground hover:border-primary/40"}`}
          >
            Requests
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* ── CATEGORIES TAB ── */}
        {tab === "categories" && (
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Header */}
            <div id="cat-form-anchor" className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
                  All Categories
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {categories.length} top-level · {totalCount - categories.length} subcategories
                </p>
              </div>
              {!showForm && (
                <button
                  onClick={() => { setEditingCat(null); setPresetParentId(""); setShowForm(true); }}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                >
                  <Plus className="w-4 h-4" /> New Category
                </button>
              )}
            </div>

            {/* Inline form */}
            <AnimatePresence>
              {showForm && (
                <CategoryForm
                  key={editingCat?._id ?? `new-${presetParentId}`}
                  initial={
                    editingCat
                      ? {
                          name: editingCat.name,
                          parentId: editingCat.parent?._id ?? editingCat.parent ?? "",
                          imageFile: null,
                          imagePreview: editingCat.image?.url ?? "",
                        }
                      : { ...EMPTY_FORM, parentId: presetParentId }
                  }
                  allFlat={allFlat}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  saving={saving}
                  editingId={editingCat?._id}
                />
              )}
            </AnimatePresence>

            {/* Help text when form is visible */}
            {showForm && presetParentId && !editingCat && (
              <div className="px-6 py-2 bg-primary/5 border-b border-border text-xs text-primary font-medium">
                📂 Creating subcategory under:{" "}
                <span className="font-bold">{allFlat.find((c) => c._id === presetParentId)?.name}</span>
                {" "}— change parent below if needed.
              </div>
            )}

            {/* Tree list */}
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <EmptyState icon="🏷️" title="No categories" description="Create your first category to get started." />
            ) : (
              <div>
                {categories.map((cat) => (
                  <CategoryRow
                    key={cat._id}
                    cat={cat}
                    allFlat={allFlat}
                    depth={0}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddSub={handleAddSub}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REQUESTS TAB ── */}
        {tab === "requests" && (
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-border/50 shadow-sm">
                <EmptyState icon="💬" title="No category requests" description="Sellers haven't submitted any requests yet." />
              </div>
            ) : (
              requests.map((req, i) => (
                <motion.div
                  key={req._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-border/50 shadow-sm p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
                          {req.requestedName}
                        </p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          req.status === "pending" ? "bg-amber-50 text-amber-700" :
                          req.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                          "bg-red-50 text-red-600"
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Submitted by{" "}
                        <span className="font-medium text-foreground">{req.seller?.name}</span>{" "}
                        ({req.seller?.email})
                      </p>
                      {req.description && <p className="text-sm text-foreground mb-2">{req.description}</p>}
                      {req.adminComment && (
                        <p className="text-sm bg-secondary/60 rounded-lg px-3 py-2">
                          <span className="font-semibold">Comment:</span> {req.adminComment}
                        </p>
                      )}
                    </div>

                    {req.status === "pending" && (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <input
                          placeholder="Admin comment (optional)"
                          value={commentMap[req._id] ?? ""}
                          onChange={(e) => setCommentMap((m) => ({ ...m, [req._id]: e.target.value }))}
                          className="px-3 py-2 text-xs rounded-lg border border-border bg-secondary/30 focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRequest(req._id, "approved")}
                            disabled={processing === req._id}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white text-xs font-semibold py-2 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleRequest(req._id, "rejected")}
                            disabled={processing === req._id}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 text-white text-xs font-semibold py-2 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

      </DashboardLayout>
    </RoleGuard>
  );
}
