/**
 * lib/services/auth.service.js
 * All authentication API calls.
 */

import api from "@/lib/api";

/** Register a new user (customer or seller). Returns { email } */
export async function registerUser({ name, email, password, phone, role }) {
  const res = await api.post("/auth/register", { name, email, password, phone, role });
  return res.data?.data;
}

/** Verify OTP after registration. Returns { user, accessToken } */
export async function verifyOTP({ email, otp }) {
  const res = await api.post("/auth/verify-otp", { email, otp });
  return res.data?.data; // { user, accessToken }
}

/** Resend verification OTP to email */
export async function resendOTP({ email }) {
  const res = await api.post("/auth/resend-otp", { email });
  return res.data;
}

/** Login. Returns { user, accessToken } */
export async function loginUser({ email, password }) {
  const res = await api.post("/auth/login", { email, password });
  return res.data?.data; // { user, accessToken }
}

/** Logout (requires valid access token, clears refreshToken cookie) */
export async function logoutUser() {
  const res = await api.post("/auth/logout");
  return res.data;
}

/** Send forgot-password OTP. Returns { email } */
export async function forgotPassword({ email }) {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data?.data;
}

/** Reset password using OTP */
export async function resetPassword({ email, otp, newPassword }) {
  const res = await api.post("/auth/reset-password", { email, otp, newPassword });
  return res.data;
}
