"use client";

import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { User, Lock, Camera, Save, Eye, EyeOff } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/guards/RoleGuard";
import { getProfile, updateProfile, changePassword } from "@/lib/services/user.service";
import { loginSuccess } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function CustomerProfile() {
  const dispatch = useDispatch();
  const { user, token, role } = useSelector((s) => s.auth);
  const fileRef = useRef(null);

  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    getProfile().then((u) => {
      if (u) setProfileForm({ name: u.name ?? "", phone: u.phone ?? "" });
    }).catch(() => {});
  }, []);

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

  return (
    <RoleGuard allowedRoles={["customer", "seller", "admin"]}>
      <DashboardLayout title="My Profile">
        <div className="max-w-2xl space-y-6">
          {/* Profile Info */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-border/50 shadow-sm p-6"
          >
            <h3 className="font-bold text-foreground mb-5 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
              <User className="w-4.5 h-4.5 text-primary" /> Personal Information
            </h3>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden text-2xl font-bold text-primary">
                  {avatarPreview || user?.avatar?.url ? (
                    <img
                      src={avatarPreview || user.avatar.url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
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
                <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
              </div>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                <input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number</label>
                <input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                  placeholder="+91 9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input
                  value={user?.email ?? ""}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/50 text-muted-foreground text-sm cursor-not-allowed"
                />
              </div>
              <Button
                type="submit"
                disabled={savingProfile}
                className="rounded-full bg-primary text-white px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </motion.div>

          {/* Change Password */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-border/50 shadow-sm p-6"
          >
            <h3 className="font-bold text-foreground mb-5 flex items-center gap-2" style={{ fontFamily: "Manrope, sans-serif" }}>
              <Lock className="w-4.5 h-4.5 text-primary" /> Change Password
            </h3>

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
              <Button
                type="submit"
                disabled={savingPw || !pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirm}
                className="rounded-full bg-primary text-white px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {savingPw ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </motion.div>
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
