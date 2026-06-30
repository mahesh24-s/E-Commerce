/**
 * lib/services/cart.service.js
 * Shopping cart API calls. All routes are customer + JWT protected.
 */

import api from "@/lib/api";

/** Get current user's cart */
export async function getCart() {
  const res = await api.get("/cart");
  return res.data?.data; // { cart }
}

/**
 * Add a product to cart.
 * @param {string} productId
 * @param {number} quantity
 */
export async function addToCart({ productId, quantity = 1 }) {
  const res = await api.post("/cart", { productId, quantity });
  return res.data?.data;
}

/**
 * Update quantity of a cart item.
 * @param {string} productId
 * @param {number} quantity - new quantity (0 removes the item)
 */
export async function updateCartItem({ productId, quantity }) {
  const res = await api.put(`/cart/${productId}`, { quantity });
  return res.data?.data;
}

/**
 * Remove a single item from cart.
 * @param {string} productId
 */
export async function removeFromCart(productId) {
  const res = await api.delete(`/cart/${productId}`);
  return res.data?.data;
}

/** Clear the entire cart */
export async function clearCart() {
  const res = await api.delete("/cart/clear");
  return res.data;
}
