import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import reducer, {
  toggleSidebar,
  setSidebarOpen,
  toggleCart,
  setCartOpen,
  addToast,
  removeToast,
} from './uiSlice';

describe('uiSlice', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1234567890);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('toggles sidebar and cart state', () => {
    let state = reducer(undefined, toggleSidebar());
    state = reducer(state, toggleCart());

    expect(state.isSidebarOpen).toBe(true);
    expect(state.isCartOpen).toBe(true);
  });

  it('sets sidebar/cart open flags explicitly', () => {
    let state = reducer(undefined, setSidebarOpen(true));
    state = reducer(state, setCartOpen(true));

    expect(state.isSidebarOpen).toBe(true);
    expect(state.isCartOpen).toBe(true);
  });

  it('adds and removes toast notifications', () => {
    let state = reducer(undefined, addToast({ type: 'success', message: 'Saved' }));
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0].id).toBe('1234567890');

    state = reducer(state, removeToast('1234567890'));
    expect(state.toasts).toEqual([]);
  });
});
