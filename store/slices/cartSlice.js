import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],        // [{ product, quantity, variant }]
  itemCount: 0,
  subtotal: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action) {
      const { product, quantity = 1, variant = null } = action.payload;
      const existing = state.items.find(
        (i) => i.product._id === product._id && i.variant === variant
      );
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ product, quantity, variant });
      }
      state.itemCount = state.items.reduce((t, i) => t + i.quantity, 0);
      state.subtotal = state.items.reduce(
        (t, i) => t + i.product.price * i.quantity,
        0
      );
    },
    removeFromCart(state, action) {
      state.items = state.items.filter(
        (i) => !(i.product._id === action.payload.productId && i.variant === action.payload.variant)
      );
      state.itemCount = state.items.reduce((t, i) => t + i.quantity, 0);
      state.subtotal = state.items.reduce(
        (t, i) => t + i.product.price * i.quantity,
        0
      );
    },
    updateQuantity(state, action) {
      const { productId, variant, quantity } = action.payload;
      const item = state.items.find(
        (i) => i.product._id === productId && i.variant === variant
      );
      if (item) item.quantity = quantity;
      state.itemCount = state.items.reduce((t, i) => t + i.quantity, 0);
      state.subtotal = state.items.reduce(
        (t, i) => t + i.product.price * i.quantity,
        0
      );
    },
    clearCart(state) {
      state.items = [];
      state.itemCount = 0;
      state.subtotal = 0;
    },
    // Sync cart from server response
    setCart(state, action) {
      const serverItems = action.payload?.items ?? [];
      state.items = serverItems.map((i) => ({
        product: i.product,
        quantity: i.quantity,
        variant: i.variant ?? null,
      }));
      state.itemCount = state.items.reduce((t, i) => t + i.quantity, 0);
      state.subtotal = state.items.reduce(
        (t, i) => t + (i.product?.price ?? 0) * i.quantity,
        0
      );
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, setCart } =
  cartSlice.actions;

export default cartSlice.reducer;
