import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UiState, Toast } from '@/types';

const initialState: UiState = {
  isSidebarOpen: false,
  isCartOpen: false,
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: state => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    toggleCart: state => {
      state.isCartOpen = !state.isCartOpen;
    },
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isCartOpen = action.payload;
    },
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      state.toasts.push({
        ...action.payload,
        id: Date.now().toString(),
      });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
  },
});

export const { toggleSidebar, setSidebarOpen, toggleCart, setCartOpen, addToast, removeToast } =
  uiSlice.actions;
export default uiSlice.reducer;
