import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],       // populated product objects
  itemCount: 0,
  loading: false,
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    setWishlist(state, action) {
      const products = action.payload ?? [];
      state.items = products;
      state.itemCount = products.length;
    },
    addWishlistItem(state, action) {
      const exists = state.items.find((p) => p._id === action.payload._id);
      if (!exists) {
        state.items.push(action.payload);
        state.itemCount = state.items.length;
      }
    },
    removeWishlistItem(state, action) {
      state.items = state.items.filter((p) => p._id !== action.payload);
      state.itemCount = state.items.length;
    },
    clearWishlist(state) {
      state.items = [];
      state.itemCount = 0;
    },
    setWishlistLoading(state, action) {
      state.loading = action.payload;
    },
  },
});

export const {
  setWishlist,
  addWishlistItem,
  removeWishlistItem,
  clearWishlist,
  setWishlistLoading,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
