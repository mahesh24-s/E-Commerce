/**
 * lib/api.js
 *
 * Central axios instance for ShopEase.
 * - Attaches Bearer token from localStorage on every request
 * - On 401 → silently calls /auth/refresh-token (uses httpOnly refreshToken cookie)
 * - Queues concurrent requests during the refresh and retries them
 * - Dispatches logout to Redux store when refresh fails
 */

import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,       // send httpOnly cookies (refreshToken)
  headers: { "Content-Type": "application/json" },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue = [];           // requests waiting for new token

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("shopease_token");
}

function setToken(token) {
  if (typeof window === "undefined") return;
  localStorage.setItem("shopease_token", token);
}

function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("shopease_token");
}

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  // Success – return the `data` payload directly
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Only handle 401s that haven't been retried yet and aren't the refresh call itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh-token")
    ) {
      if (isRefreshing) {
        // Queue the request until the current refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token is in httpOnly cookie – send credentials
        const res = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data?.data?.accessToken;
        setToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearToken();

        // Dynamically import store to avoid circular deps at module init time
        try {
          const { default: store } = await import("@/store/store");
          const { logout } = await import("@/store/slices/authSlice");
          store.dispatch(logout());
        } catch (_) {
          // store not yet initialised (SSR edge case) – just clear storage
        }

        if (typeof window !== "undefined") {
          window.location.href = "/login?session=expired";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalise error message so callers can do: err.message
    const normalised = new Error(
      error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "An unexpected error occurred"
    );
    normalised.status = error.response?.status;
    normalised.data   = error.response?.data;
    return Promise.reject(normalised);
  }
);

export default api;
