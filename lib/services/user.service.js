/**
 * lib/services/user.service.js
 * User profile, wishlist, and orders.
 */

import api from "@/lib/api";

// ─── Profile ──────────────────────────────────────────────────────────────────

/** Get the authenticated user's profile */
export async function getProfile() {
  const res = await api.get("/users/profile");
  return res.data?.data?.user;
}

/**
 * Update profile (name, phone, avatar).
 * @param {FormData} formData - may include avatar file
 */
export async function updateProfile(formData) {
  const res = await api.put("/users/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data?.user;
}

/**
 * Change password.
 * @param {{ currentPassword, newPassword }} payload
 */
export async function changePassword({ currentPassword, newPassword }) {
  const res = await api.put("/users/change-password", {
    oldPassword: currentPassword,  // backend uses oldPassword
    newPassword,
  });
  return res.data;
}

// ─── Addresses ────────────────────────────────────────────────────────────────

/** Get all addresses for the authenticated user */
export async function getAddresses() {
  const res = await api.get("/addresses");
  return res.data?.data?.addresses ?? [];
}

/**
 * Add a new address.
 * @param {{ name, phone, street, city, state, pincode, country, isDefault }} payload
 */
export async function addAddress(payload) {
  const res = await api.post("/addresses", payload);
  return res.data?.data?.address;
}

/**
 * Update an existing address.
 * @param {string} id
 * @param {object} payload
 */
export async function updateAddress(id, payload) {
  const res = await api.put(`/addresses/${id}`, payload);
  return res.data?.data?.address;
}

/**
 * Delete an address.
 * @param {string} id
 */
export async function deleteAddress(id) {
  const res = await api.delete(`/addresses/${id}`);
  return res.data;
}

/**
 * Set an address as default.
 * @param {string} id
 */
export async function setDefaultAddress(id) {
  const res = await api.put(`/addresses/${id}/default`);
  return res.data?.data?.address;
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

/** Get the authenticated user's wishlist */
export async function getWishlist() {
  const res = await api.get("/wishlist");
  return res.data?.data;
}

/**
 * Check if a product is in the wishlist.
 * @param {string} productId
 */
export async function checkWishlist(productId) {
  const res = await api.get(`/wishlist/check/${productId}`);
  return res.data?.data?.isWishlisted ?? false;
}

/**
 * Toggle wishlist: add product.
 * @param {string} productId
 */
export async function addToWishlist(productId) {
  const res = await api.post(`/wishlist/${productId}`);
  return res.data?.data;
}

/**
 * Remove product from wishlist.
 * @param {string} productId
 */
export async function removeFromWishlist(productId) {
  const res = await api.delete(`/wishlist/${productId}`);
  return res.data?.data;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

/**
 * Create a new order.
 * @param {{ addressId, paymentMethod, items }} payload
 */
export async function createOrder(payload) {
  const res = await api.post("/orders", payload);
  return res.data?.data;
}

/**
 * Verify Razorpay payment after payment gateway callback.
 * @param {{ razorpay_order_id, razorpay_payment_id, razorpay_signature }} payload
 */
export async function verifyPayment(payload) {
  const res = await api.post("/orders/verify-payment", payload);
  return res.data?.data;
}

/** Get all orders for the current customer */
export async function getUserOrders() {
  const res = await api.get("/orders/my-orders");
  return res.data?.data;
}

/**
 * Get a single order by ID.
 * @param {string} orderId
 */
export async function getOrderById(orderId) {
  const res = await api.get(`/orders/${orderId}`);
  return res.data?.data;
}

/**
 * Cancel an order.
 * @param {string} orderId
 */
export async function cancelOrder(orderId) {
  const res = await api.put(`/orders/${orderId}/cancel`);
  return res.data?.data;
}

// ─── Admin API ────────────────────────────────────────────────────────────────

/**
 * Update a user's role (Admin only).
 * @param {string} userId
 * @param {string} role
 */
export async function updateUserRole(userId, role) {
  const res = await api.put(`/users/${userId}/role`, { role });
  return res.data?.data?.user;
}
