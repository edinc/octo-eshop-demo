import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartPage } from './CartPage';
import { useCart } from '@/hooks/useCart';

vi.mock('@/hooks/useCart', () => ({
  useCart: vi.fn(),
}));

vi.mock('@/components/cart/CartItem', () => ({
  CartItem: ({
    item,
    onUpdateQuantity,
    onRemove,
  }: {
    item: { productId: string };
    onUpdateQuantity: (id: string, qty: number) => void;
    onRemove: (id: string) => void;
  }) => (
    <div>
      <span>{item.productId}</span>
      <button onClick={() => onUpdateQuantity(item.productId, 2)}>update item</button>
      <button onClick={() => onRemove(item.productId)}>remove item</button>
    </div>
  ),
}));

vi.mock('@/components/cart/CartSummary', () => ({
  CartSummary: ({ subtotal }: { subtotal: number }) => <div>subtotal {subtotal}</div>,
}));

const mockedUseCart = useCart as unknown as ReturnType<typeof vi.fn>;

describe('CartPage', () => {
  const updateQuantity = vi.fn();
  const removeFromCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty cart state when there are no items', () => {
    mockedUseCart.mockReturnValue({
      items: [],
      totalPrice: 0,
      updateQuantity,
      removeFromCart,
    });

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start shopping/i })).toHaveAttribute(
      'href',
      '/products'
    );
  });

  it('renders items and wires update/remove handlers', () => {
    mockedUseCart.mockReturnValue({
      items: [{ productId: 'p1' }],
      totalPrice: 1200,
      updateQuantity,
      removeFromCart,
    });

    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
    expect(screen.getByText('subtotal 1200')).toBeInTheDocument();

    fireEvent.click(screen.getByText('update item'));
    expect(updateQuantity).toHaveBeenCalledWith('p1', 2);

    fireEvent.click(screen.getByText('remove item'));
    expect(removeFromCart).toHaveBeenCalledWith('p1');
  });
});
