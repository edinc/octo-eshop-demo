import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CartItem, CartState } from '@/types';
import cartService from '@/services/cartService';

const initialState: CartState = {
  items: cartService.getLocalCart(),
  isLoading: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      cartService.setLocalCart(action.payload);
    },
    addItem: (state, action: PayloadAction<CartItem>) => {
      const existingIndex = state.items.findIndex(
        item => item.productId === action.payload.productId
      );
      if (existingIndex >= 0) {
        state.items[existingIndex].quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      cartService.setLocalCart(state.items);
    },
    updateItemQuantity: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const item = state.items.find(i => i.productId === action.payload.productId);
      if (item) {
        item.quantity = action.payload.quantity;
        cartService.setLocalCart(state.items);
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.productId !== action.payload);
      cartService.setLocalCart(state.items);
    },
    clearCart: state => {
      state.items = [];
      cartService.clearLocalCart();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCartItems, addItem, updateItemQuantity, removeItem, clearCart, setLoading } =
  cartSlice.actions;
export default cartSlice.reducer;
