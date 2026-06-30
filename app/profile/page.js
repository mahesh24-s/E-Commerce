"use client";

import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  User, Lock, Camera, Save, Eye, EyeOff,
  MapPin, Plus, Star, Trash2, ChevronDown, ChevronUp,
  LayoutDashboard, Phone, Mail, Edit2, X, Check,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import {
  getProfile, updateProfile, changePassword,
  getAddresses, addAddress, updateAddress,
  deleteAddress, setDefaultAddress,
} from "@/lib/services/user.service";
import { loginSuccess } from "@/store/slices/authSlice";
import toast from "react-hot-toast";

/* ── helpers ─────────────────────────────────────── */
function getDashboardHref(role) {
  if (role === "admin") return "/admin";
  if (role === "seller") return "/seller/dashboard";
  return "/customer";
}

const EMPTY_ADDR = { name: "", phone: "", street: "", city: "", state: "", pincode: "", country: "India", isDefault: false };

/* ── Section wrapper ─────────────────────────────── */
function Section({ title, icon: Icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border/50">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <h2 className="font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
          {title}
        </h2>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

/* ── Address card ────────────────────────────────── */
function AddressCard({ addr, onSetDefault, onEdit, onDelete }) {
  return (
    <div className={`relative rounded-xl border-2 p-4 transition-all ${addr.isDefault ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
      {addr.isDefault && (
        <span className="absolute top-3 right-3 text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full flex items-center gap-1">
          <Star className="w-2.5 h-2.5 fill-white" /> Default
        </span>
      )}
      <p className="font-semibold text-foreground text-sm mb-0.5">{addr.name}</p>
      <p className="text-xs text-muted-foreground mb-1">{addr.phone}</p>
      <p className="text-sm text-foreground/80">
        {addr.street}, {addr.city}, {addr.state} – {addr.pincode}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{addr.country}</p>
      <div className="flex items-center gap-2 mt-3">
        {!addr.isDefault && (
          <button
            onClick={() => onSetDefault(addr._id)}
            className="text-xs text-primary font-medium hover:underline"
          >
            Set as default
          </button>
        )}
        <button
          onClick={() => onEdit(addr)}
          className="ml-auto p-1.5 rounded-lg border border-border hover:bg-secondary transition-all"
          aria-label="Edit"
        >
          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={() => onDelete(addr._id)}
          className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-all"
          aria-label="Delete"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </button>
      </div>
    </div>
  );
}

/* ── Address form ────────────────────────────────── */
function AddressForm({ initial = EMPTY_ADDR, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(form); }}
      className="space-y-3 pt-4 border-t border-border"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Recipient Name *</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} required
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            placeholder="Full name" />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Phone *</label>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} required
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            placeholder="+91 9876543210" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-foreground mb-1">Street / Flat / Area *</label>
        <input value={form.street} onChange={(e) => set("street", e.target.value)} required
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
          placeholder="123 Main St, Apt 4B" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">City *</label>
          <input value={form.city} onChange={(e) => set("city", e.target.value)} required
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            placeholder="Mumbai" />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">State *</label>
          <input value={form.state} onChange={(e) => set("state", e.target.value)} required
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            placeholder="Maharashtra" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Pincode *</label>
          <input value={form.pincode} onChange={(e) => set("pincode", e.target.value)} required
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            placeholder="400001" />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Country</label>
          <input value={form.country} onChange={(e) => set("country", e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            placeholder="India" />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isDefault} onChange={(e) => set("isDefault", e.target.checked)}
          className="accent-primary w-4 h-4" />
        <span className="text-sm text-foreground">Set as default address</span>
      </label>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
          <Check className="w-4 h-4" /> {saving ? "Saving…" : "Save Address"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 border border-border rounded-xl text-sm hover:bg-secondary transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user, token, role, isAuthenticated, isLoading } = useSelector((s) => s.auth);
  const fileRef = useRef(null);
  const dashboardHref = getDashboardHref(role);

  /* ── Profile state ── */
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  /* ── Password state ── */
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  /* ── Address state ── */
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editingAddr, setEditingAddr] = useState(null); // address object being edited
  const [savingAddr, setSavingAddr] = useState(false);

  /* ── Load profile + addresses ── */
  useEffect(() => {
    if (!isAuthenticated && !isLoading) return;
    getProfile().then((u) => {
      if (u) setProfileForm({ name: u.name ?? "", phone: u.phone ?? "" });
    }).catch(() => {});

    getAddresses().then(setAddresses).catch(() => {}).finally(() => setAddrLoading(false));
  }, [isAuthenticated]);

  /* ── Profile handlers ── */
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) { toast.error("Name is required"); return; }
    setSavingProfile(true);
    try {
      const fd = new FormData();
      fd.append("name", profileForm.name);
      fd.append("phone", profileForm.phone);
      if (avatarFile) fd.append("avatar", avatarFile);
      const updated = await updateProfile(fd);
      dispatch(loginSuccess({ user: updated, token, role }));
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err?.message ?? "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  /* ── Password handler ── */
  const handlePwSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error("Passwords do not match"); return; }
    if (pwForm.newPassword.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    setSavingPw(true);
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success("Password changed successfully!");
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error(err?.message ?? "Failed to change password");
    } finally {
      setSavingPw(false);
    }
  };

  /* ── Address handlers ── */
  const handleSaveAddress = async (form) => {
    setSavingAddr(true);
    try {
      if (editingAddr) {
        const updated = await updateAddress(editingAddr._id, form);
        setAddresses((prev) => prev.map((a) => a._id === editingAddr._id ? updated : a));
        toast.success("Address updated!");
      } else {
        const newAddr = await addAddress(form);
        if (form.isDefault) {
          setAddresses((prev) => [...prev.map((a) => ({ ...a, isDefault: false })), newAddr]);
        } else {
          setAddresses((prev) => [...prev, newAddr]);
        }
        toast.success("Address added!");
      }
      setShowAddrForm(false);
      setEditingAddr(null);
    } catch (err) {
      toast.error(err?.message ?? "Failed to save address");
    } finally {
      setSavingAddr(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a._id === id })));
    } catch (err) {
      toast.error(err?.message ?? "Failed to update default");
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm("Delete this address?")) return;
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a._id !== id));
      toast.success("Address removed");
    } catch (err) {
      toast.error(err?.message ?? "Failed to delete address");
    }
  };

  const handleEditAddress = (addr) => {
    setEditingAddr(addr);
    setShowAddrForm(true);
  };

  /* ── Guard: redirect if not auth (soft) ── */
  if (!isLoading && !isAuthenticated) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
              My Profile
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your account details and addresses</p>
          </div>
          <Link
            href={dashboardHref}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        <div className="space-y-6">

          {/* ── Personal Info ── */}
          <Section title="Personal Information" icon={User}>
            {/* Avatar row */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden text-2xl font-bold text-primary">
                  {avatarPreview || user?.avatar?.url ? (
                    <img src={avatarPreview || user.avatar.url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.[0]?.toUpperCase() ?? "U"
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md hover:opacity-90 transition-all"
                  aria-label="Change avatar"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{role} account</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                <input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                  placeholder="Your full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <Phone className="w-3.5 h-3.5 inline mr-1 text-primary" />
                    Phone Number
                  </label>
                  <input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <Mail className="w-3.5 h-3.5 inline mr-1 text-primary" />
                    Email
                  </label>
                  <input
                    value={user?.email ?? ""}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-muted-foreground text-sm cursor-not-allowed"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? "Saving…" : "Save Changes"}
              </button>
            </form>
          </Section>

          {/* ── Addresses ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                </div>
                <h2 className="font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
                  Saved Addresses
                </h2>
              </div>
              {!showAddrForm && (
                <button
                  onClick={() => { setEditingAddr(null); setShowAddrForm(true); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-semibold hover:bg-primary/20 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add New
                </button>
              )}
            </div>

            <div className="p-6">
              {addrLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <div key={i} className="h-28 bg-secondary rounded-xl animate-pulse" />)}
                </div>
              ) : (
                <>
                  {addresses.length === 0 && !showAddrForm && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No saved addresses yet.</p>
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {addresses.map((addr) => (
                      <AddressCard
                        key={addr._id}
                        addr={addr}
                        onSetDefault={handleSetDefault}
                        onEdit={handleEditAddress}
                        onDelete={handleDeleteAddress}
                      />
                    ))}
                  </div>

                  <AnimatePresence>
                    {showAddrForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <AddressForm
                          initial={editingAddr ? {
                            name: editingAddr.name,
                            phone: editingAddr.phone,
                            street: editingAddr.street,
                            city: editingAddr.city,
                            state: editingAddr.state,
                            pincode: editingAddr.pincode,
                            country: editingAddr.country,
                            isDefault: editingAddr.isDefault,
                          } : EMPTY_ADDR}
                          onSave={handleSaveAddress}
                          onCancel={() => { setShowAddrForm(false); setEditingAddr(null); }}
                          saving={savingAddr}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </motion.div>

          {/* ── Change Password ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border/50">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-primary" />
              </div>
              <h2 className="font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
                Change Password
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handlePwSave} className="space-y-4">
                {[
                  { key: "currentPassword", label: "Current Password", pwKey: "current" },
                  { key: "newPassword", label: "New Password", pwKey: "new" },
                  { key: "confirm", label: "Confirm New Password", pwKey: "confirm" },
                ].map(({ key, label, pwKey }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
                    <div className="relative">
                      <input
                        type={showPw[pwKey] ? "text" : "password"}
                        value={pwForm[key]}
                        onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                        className="w-full px-4 py-3 pr-11 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((p) => ({ ...p, [pwKey]: !p[pwKey] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPw[pwKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={savingPw || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirm}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  <Lock className="w-4 h-4" />
                  {savingPw ? "Updating…" : "Update Password"}
                </button>
              </form>
            </div>
          </motion.div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
