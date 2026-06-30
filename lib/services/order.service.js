/**
 * lib/services/order.service.js
 * Order API calls.
 */

import api from "@/lib/api";

/** Create a Razorpay order from cart. Returns { orderId, razorpayOrderId, amount, currency, keyId } */
export async function createOrder({ addressId }) {
  const res = await api.post("/orders", { addressId });
  return res.data?.data;
}

/** Verify Razorpay payment signature after payment success */
export async function verifyPayment({ orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const res = await api.post("/orders/verify-payment", {
    orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature,
  });
  return res.data?.data;
}

/** Get current user's orders */
export async function getUserOrders({ page = 1, limit = 10, status } = {}) {
  const params = { page, limit };
  if (status) params.status = status;
  const res = await api.get("/orders/my-orders", { params });
  return res.data?.data;
}

/** Get single order by ID */
export async function getOrderById(id) {
  const res = await api.get(`/orders/${id}`);
  return res.data?.data?.order;
}

/** Cancel an order (customer) */
export async function cancelOrder(id) {
  const res = await api.put(`/orders/${id}/cancel`);
  return res.data?.data?.order;
}

/** Update order status (seller) */
export async function updateOrderStatus(id, status) {
  const res = await api.put(`/orders/${id}/status`, { status });
  return res.data?.data?.order;
}
