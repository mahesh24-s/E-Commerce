import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,   // start true so RoleGuard shows spinner until rehydration completes
  error: null,
  otpEmail: null, // holds email during OTP verification flow
  role: null, // "customer" | "seller"
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading(state, action) {
      state.isLoading = action.payload;
    },
    loginSuccess(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.role = null;
      state.error = null;
      state.otpEmail = null;
    },
    setOtpEmail(state, action) {
      state.otpEmail = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  loginSuccess,
  logout,
  setOtpEmail,
  setError,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
