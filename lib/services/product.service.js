/**
 * lib/services/product.service.js
 * Products & categories API calls.
 */

import api from "@/lib/api";

// ─── Products ─────────────────────────────────────────────────────────────────

/**
 * Fetch paginated products with optional filters.
 * @param {object} params - { q, category, minPrice, maxPrice, minRating, tag, sort, page, limit }
 * @returns { products, pagination }
 */
export async function getAllProducts(params = {}) {
  const res = await api.get("/products", { params });
  return res.data?.data; // { products, pagination }
}

/**
 * Fetch featured products (up to 10).
 * @returns { products }
 */
export async function getFeaturedProducts() {
  const res = await api.get("/products/featured");
  return res.data?.data?.products ?? [];
}

/**
 * Fetch a single product by its slug.
 * @param {string} slug
 * @returns product object
 */
export async function getProductBySlug(slug) {
  const res = await api.get(`/products/${slug}`);
  return {
    product: res.data?.data?.product,
    reviews: res.data?.data?.reviews || []
  };
}

/**
 * Fetch products by category slug (optimized).
 * @param {string} slug
 * @param {object} params - { page, limit }
 * @returns { category, products, pagination }
 */
export async function getProductsByCategorySlug(slug, params = {}) {
  const res = await api.get(`/products/category/${slug}`, { params });
  return res.data?.data;
}

/**
 * Submit a product review.
 * @param {FormData} formData - Must contain productId, rating, comment, and optional images
 */
export async function submitReview(formData) {
  const res = await api.post("/reviews", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data?.review;
}

/**
 * Seller: fetch their own products (paginated).
 * @param {object} params - { page, limit, q }
 * @returns { products, pagination }
 */
export async function getSellerProducts(params = {}) {
  const res = await api.get("/products/seller/my-products", { params });
  return res.data?.data;
}

/**
 * Seller: create a product.
 * @param {FormData} formData - multipart form data with images
 * @returns created product
 */
export async function createProduct(formData) {
  const res = await api.post("/products", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data?.product;
}

/**
 * Seller: update a product.
 * @param {string} id - product _id
 * @param {FormData} formData
 */
export async function updateProduct(id, formData) {
  const res = await api.put(`/products/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data?.product;
}

/**
 * Seller: soft-delete a product.
 * @param {string} id
 */
export async function deleteProduct(id) {
  const res = await api.delete(`/products/${id}`);
  return res.data;
}

// ─── Categories ───────────────────────────────────────────────────────────────

/**
 * Fetch all active categories.
 * @returns category[]
 */
export async function getAllCategories() {
  const res = await api.get("/categories");
  return res.data?.data?.categories ?? res.data?.data ?? [];
}

// ─── Admin Endpoints ──────────────────────────────────────────────────────────

/**
 * Admin: fetch all products (including deleted or non-featured).
 * @param {object} params
 */
export async function getAdminProducts(params = {}) {
  const res = await api.get("/products/admin/all", { params });
  return res.data?.data;
}

/**
 * Admin: toggle a product's featured status.
 * @param {string} id 
 */
export async function toggleProductFeatured(id) {
  const res = await api.patch(`/products/admin/${id}/featured`);
  return res.data?.data?.product;
}

/**
 * Admin: soft delete a product regardless of seller.
 * @param {string} id 
 */
export async function adminDeleteProduct(id) {
  const res = await api.delete(`/products/admin/${id}`);
  return res.data;
}
