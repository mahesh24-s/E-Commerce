/**
 * lib/services/seller.service.js
 * Seller-specific API calls.
 */

import api from "@/lib/api";

// ─── Orders ───────────────────────────────────────────────────────────────────

/**
 * Get orders containing the seller's products.
 * @param {{ page?, limit?, status? }} params
 */
export async function getSellerOrders(params = {}) {
  const res = await api.get("/orders/seller-orders", { params });
  return res.data?.data;
}

/**
 * Update order status (processing → shipped → delivered).
 * @param {string} id - order _id
 * @param {string} status - new status
 */
export async function updateOrderStatus(id, status) {
  const res = await api.put(`/orders/${id}/status`, { status });
  return res.data?.data?.order;
}

// ─── Category Requests ────────────────────────────────────────────────────────

/**
 * Submit a new category request.
 * @param {{ requestedName, description?, parentCategory? }} payload
 */
export async function createCategoryRequest(payload) {
  const res = await api.post("/category-requests", payload);
  return res.data?.data?.request;
}
