import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CheckoutPage } from './CheckoutPage';
import { useCart } from '@/hooks/useCart';
import { useCreateOrder } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';

const navigate = vi.fn();

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@/hooks/useCart', () => ({
  useCart: vi.fn(),
}));

vi.mock('@/hooks/useOrders', () => ({
  useCreateOrder: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/components/checkout/AddressForm', () => ({
  AddressForm: ({ onSubmit }: { onSubmit: (data: Record<string, string>) => void }) => (
    <button
      onClick={() =>
        onSubmit({
          street: '1 Main',
          city: 'Seattle',
          state: 'WA',
          postalCode: '98101',
          country: 'US',
        })
      }
    >
      submit address
    </button>
  ),
}));

vi.mock('@/components/checkout/PaymentForm', () => ({
  PaymentForm: ({
    onSubmit,
    isLoading,
  }: {
    onSubmit: (data: { cardNumber: string; cardholderName: string }) => void;
    isLoading: boolean;
  }) => (
    <button
      disabled={isLoading}
      onClick={() =>
        onSubmit({
          cardNumber: '4242424242424242',
          cardholderName: 'Jane Doe',
        })
      }
    >
      submit payment
    </button>
  ),
}));

vi.mock('@/components/checkout/OrderSummary', () => ({
  OrderSummary: ({ subtotal }: { subtotal: number }) => <div>summary {subtotal}</div>,
}));

const mockedUseCart = useCart as unknown as ReturnType<typeof vi.fn>;
const mockedUseCreateOrder = useCreateOrder as unknown as ReturnType<typeof vi.fn>;
const mockedUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

describe('CheckoutPage', () => {
  const clearCart = vi.fn();
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseAuth.mockReturnValue({ isAuthenticated: true });
    mockedUseCart.mockReturnValue({
      items: [{ productId: 'p1', quantity: 1, price: 100, name: 'Roadster' }],
      totalPrice: 100,
      clearCart,
    });
    mockedUseCreateOrder.mockReturnValue({
      mutateAsync,
      isPending: false,
    });
  });

  it('redirects to login when user is not authenticated', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    expect(navigate).toHaveBeenCalledWith('/login?redirect=/checkout');
  });

  it('redirects to cart when checkout has no items', () => {
    mockedUseCart.mockReturnValue({
      items: [],
      totalPrice: 0,
      clearCart,
    });

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    expect(navigate).toHaveBeenCalledWith('/cart');
  });

  it('completes address -> payment -> confirmation flow', async () => {
    mutateAsync.mockResolvedValue({
      success: true,
      data: { id: 'ORD-123' },
    });

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('submit address'));
    expect(screen.getByText('submit payment')).toBeInTheDocument();

    fireEvent.click(screen.getByText('submit payment'));
    expect(await screen.findByText('Order Confirmed!')).toBeInTheDocument();
    expect(clearCart).toHaveBeenCalledOnce();
    expect(screen.getByText(/order #ORD-123/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('View Order Details'));
    expect(navigate).toHaveBeenCalledWith('/orders');
  });
});
