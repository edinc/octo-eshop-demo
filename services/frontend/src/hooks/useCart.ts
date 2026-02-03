import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { RootState } from '@/store';
import { addItem, removeItem, updateItemQuantity, clearCart } from '@/store/cartSlice';
import { addToast } from '@/store/uiSlice';
import cartService from '@/services/cartService';
import type { CartItem } from '@/types';

export function useCart() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { items, isLoading } = useSelector((state: RootState) => state.cart);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const addToCartMutation = useMutation({
    mutationFn: async (item: CartItem) => {
      if (isAuthenticated) {
        return cartService.addToCart(item.productId, item.quantity);
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const handleAddToCart = useCallback(
    (item: CartItem) => {
      dispatch(addItem(item));
      dispatch(addToast({ type: 'success', message: `${item.name} added to cart` }));
      if (isAuthenticated) {
        addToCartMutation.mutate(item);
      }
    },
    [dispatch, isAuthenticated, addToCartMutation]
  );

  const handleRemoveFromCart = useCallback(
    (productId: string) => {
      dispatch(removeItem(productId));
      if (isAuthenticated) {
        cartService.removeFromCart(productId);
      }
    },
    [dispatch, isAuthenticated]
  );

  const handleUpdateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        handleRemoveFromCart(productId);
      } else {
        dispatch(updateItemQuantity({ productId, quantity }));
        if (isAuthenticated) {
          cartService.updateCartItem(productId, quantity);
        }
      }
    },
    [dispatch, isAuthenticated, handleRemoveFromCart]
  );

  const handleClearCart = useCallback(() => {
    dispatch(clearCart());
    if (isAuthenticated) {
      cartService.clearCart();
    }
  }, [dispatch, isAuthenticated]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    items,
    isLoading,
    totalItems,
    totalPrice,
    addToCart: handleAddToCart,
    removeFromCart: handleRemoveFromCart,
    updateQuantity: handleUpdateQuantity,
    clearCart: handleClearCart,
  };
}
