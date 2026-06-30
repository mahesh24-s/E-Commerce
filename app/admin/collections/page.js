"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye, EyeOff, X, Upload, Search, Image as ImageIcon } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/guards/RoleGuard";
import { getAllCollections, deleteCollection, createCollection, updateCollection } from "@/lib/services/collection.service";
import { getAllProducts } from "@/lib/services/product.service";
import toast from "react-hot-toast";

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  
  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [bannerImage, setBannerImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Products for Selection
  const [allProducts, setAllProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCollections();
    getAllProducts({ limit: 1000 }).then((res) => {
      setAllProducts(res?.products || []);
    }).catch(console.error);
  }, []);

  const fetchCollections = () => {
    setLoading(true);
    getAllCollections()
      .then((data) => setCollections(data))
      .catch(() => toast.error("Failed to load collections"))
      .finally(() => setLoading(false));
  };

  const handleOpenModal = (collection = null) => {
    if (collection) {
      setEditingCollection(collection);
      setName(collection.name || "");
      setDescription(collection.description || "");
      setIsActive(collection.isActive ?? true);
      setPreviewImage(collection.bannerImage?.url || null);
      setBannerImage(null);
      // Filter out any null products caused by deleted references
      setSelectedProducts((collection.products || []).filter(Boolean));
    } else {
      setEditingCollection(null);
      setName("");
      setDescription("");
      setIsActive(true);
      setPreviewImage(null);
      setBannerImage(null);
      setSelectedProducts([]);
    }
    setSearchQuery("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCollection(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const toggleProductSelection = (product) => {
    const isSelected = selectedProducts.some((p) => p._id === product._id);
    if (isSelected) {
      setSelectedProducts(selectedProducts.filter((p) => p._id !== product._id));
    } else {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const handleToggleStatus = async (collection) => {
    try {
      const formData = new FormData();
      formData.append("isActive", !collection.isActive);
      
      const updated = await updateCollection(collection._id, formData);
      setCollections((prev) => prev.map((c) => c._id === updated._id ? updated : c));
      toast.success(`Collection ${updated.isActive ? 'activated' : 'hidden'}`);
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return toast.error("Name is required");

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("isActive", isActive);
      formData.append("products", JSON.stringify(selectedProducts.map(p => p._id)));
      
      if (bannerImage) {
        formData.append("image", bannerImage);
      }

      if (editingCollection) {
        const updated = await updateCollection(editingCollection._id, formData);
        setCollections((prev) => prev.map((c) => c._id === updated._id ? updated : c));
        toast.success("Collection updated");
      } else {
        const created = await createCollection(formData);
        setCollections((prev) => [created, ...prev]);
        toast.success("Collection created");
      }
      handleCloseModal();
    } catch (err) {
      toast.error(err?.message || "Failed to save collection");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this collection?")) return;
    try {
      await deleteCollection(id);
      setCollections((prev) => prev.filter((c) => c._id !== id));
      toast.success("Collection deleted");
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  };

  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <DashboardLayout title="Manage Collections">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground text-sm">
            Create and manage product collections for campaigns and seasons.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> New Collection
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-secondary/40 text-muted-foreground border-b border-border">
                <tr>
                  <th className="font-semibold p-4 pl-6">Banner</th>
                  <th className="font-semibold p-4">Name</th>
                  <th className="font-semibold p-4">Status</th>
                  <th className="font-semibold p-4">Products</th>
                  <th className="font-semibold p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-muted-foreground">Loading collections...</td>
                  </tr>
                ) : collections.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-muted-foreground">No collections found.</td>
                  </tr>
                ) : (
                  collections.map((c) => (
                    <tr key={c._id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="w-20 h-10 rounded-lg overflow-hidden bg-secondary">
                          {c.bannerImage?.url ? (
                            <img src={c.bannerImage.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs">No img</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-foreground">
                        {c.name}
                        <br/>
                        <span className="text-xs font-normal text-muted-foreground">/{c.slug}</span>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => handleToggleStatus(c)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            c.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          }`}
                          title="Toggle Status"
                        >
                          {c.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {c.isActive ? "Active" : "Hidden"}
                        </button>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {c.products?.length || 0} items
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/collections/${c.slug}`}
                            target="_blank"
                            className="p-2 text-muted-foreground hover:text-primary transition-colors bg-secondary/40 hover:bg-primary/10 rounded-lg"
                            title="View Public Page"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenModal(c)}
                            className="p-2 text-muted-foreground hover:text-blue-600 transition-colors bg-secondary/40 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c._id)}
                            className="p-2 text-muted-foreground hover:text-rose-600 transition-colors bg-secondary/40 hover:bg-rose-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>

      {/* Collection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {editingCollection ? "Edit Collection" : "Create New Collection"}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-secondary rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="collectionForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Banner Upload */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Banner Image</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 rounded-2xl border-2 border-dashed border-border/70 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer overflow-hidden relative"
                  >
                    {previewImage ? (
                      <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Click to upload banner</span>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Summer Essentials"
                      className="w-full bg-secondary/30 border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Short description for the collection..."
                      className="w-full bg-secondary/30 border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-20"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary border-border"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-foreground cursor-pointer">
                    Publish immediately (Active)
                  </label>
                </div>

                {/* Product Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-foreground">Select Products</label>
                    <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-lg">
                      {selectedProducts.length} selected
                    </span>
                  </div>
                  
                  <div className="bg-secondary/20 border border-border rounded-xl overflow-hidden">
                    <div className="p-3 border-b border-border flex items-center gap-2 bg-white">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search products to add..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent text-sm focus:outline-none"
                      />
                    </div>
                    <div className="h-48 overflow-y-auto custom-scrollbar p-2 space-y-1">
                      {filteredProducts.map((p) => {
                        const isSelected = selectedProducts.some((sp) => sp?._id === p._id);
                        return (
                          <div 
                            key={p._id}
                            onClick={() => toggleProductSelection(p)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${
                              isSelected ? 'bg-primary/5 border-primary/30' : 'hover:bg-secondary/50 border-transparent'
                            }`}
                          >
                            <input type="checkbox" checked={isSelected} readOnly className="w-4 h-4 rounded text-primary" />
                            <div className="w-8 h-8 rounded bg-white flex-shrink-0 overflow-hidden border border-border/50">
                              {p.images?.[0]?.url ? <img src={p.images[0].url} className="w-full h-full object-cover" alt=""/> : null}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">{p.category?.name || "Uncategorized"}</p>
                            </div>
                            <span className="text-xs font-bold">₹{(p.discountPrice || p.price).toLocaleString("en-IN")}</span>
                          </div>
                        );
                      })}
                      {filteredProducts.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-4">No products match your search.</p>
                      )}
                    </div>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-border bg-secondary/20 flex items-center justify-end gap-3">
              <button 
                onClick={handleCloseModal}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="collectionForm"
                disabled={submitting}
                className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : "Save Collection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
