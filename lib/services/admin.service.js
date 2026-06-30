/**
 * lib/services/admin.service.js
 * Admin-only API calls.
 */

import api from "@/lib/api";

// ─── Categories ───────────────────────────────────────────────────────────────

/** Get all categories including inactive (admin view) */
export async function getAdminCategories() {
  const res = await api.get("/categories/admin/all");
  return res.data?.data?.categories ?? [];
}

/**
 * Create a new category.
 * @param {FormData} formData - { name, parent?, image? }
 */
export async function createCategory(formData) {
  const res = await api.post("/categories", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data?.category;
}

/**
 * Update a category.
 * @param {string} id
 * @param {FormData} formData
 */
export async function updateCategory(id, formData) {
  const res = await api.put(`/categories/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data?.category;
}

/**
 * Soft-delete (deactivate) a category.
 * @param {string} id
 */
export async function deleteCategory(id) {
  const res = await api.delete(`/categories/${id}`);
  return res.data;
}

// ─── Category Requests ────────────────────────────────────────────────────────

/**
 * Get all category requests (optionally filtered by status).
 * @param {'pending'|'approved'|'rejected'} [status]
 */
export async function getCategoryRequests(status) {
  const res = await api.get("/category-requests", {
    params: status ? { status } : {},
  });
  return res.data?.data?.requests ?? [];
}

/**
 * Approve or reject a category request.
 * @param {string} id
 * @param {{ status: 'approved'|'rejected', adminComment?: string }} payload
 */
export async function updateCategoryRequestStatus(id, payload) {
  const res = await api.put(`/category-requests/${id}/status`, payload);
  return res.data?.data;
}
