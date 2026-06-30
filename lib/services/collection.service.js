/**
 * lib/services/collection.service.js
 * Collections API calls.
 */

import api from "@/lib/api";

export async function getAllCollections() {
  const res = await api.get("/collections");
  return res.data?.data?.collections ?? [];
}

export async function getCollectionBySlug(slug) {
  const res = await api.get(`/collections/${slug}`);
  return res.data?.data?.collection;
}

export async function createCollection(formData) {
  const res = await api.post("/collections", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data?.collection;
}

export async function updateCollection(id, formData) {
  const res = await api.put(`/collections/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data?.collection;
}

export async function deleteCollection(id) {
  const res = await api.delete(`/collections/${id}`);
  return res.data;
}
