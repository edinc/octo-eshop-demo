import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import { useFeaturedProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';

vi.mock('@/hooks/useProducts', () => ({
  useFeaturedProducts: vi.fn(),
}));

vi.mock('@/hooks/useCart', () => ({
  useCart: vi.fn(),
}));

vi.mock('@/components/products/ProductGrid', () => ({
  ProductGrid: ({ onAddToCart }: { onAddToCart: (productId: string) => void }) => (
    <div>
      <button onClick={() => onAddToCart('p1')}>add featured</button>
      <button onClick={() => onAddToCart('missing')}>add missing</button>
    </div>
  ),
}));

const mockedUseFeaturedProducts = useFeaturedProducts as unknown as ReturnType<typeof vi.fn>;
const mockedUseCart = useCart as unknown as ReturnType<typeof vi.fn>;

describe('HomePage', () => {
  const addToCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseCart.mockReturnValue({ addToCart });
    mockedUseFeaturedProducts.mockReturnValue({
      isLoading: false,
      data: {
        data: [
          {
            id: 'p1',
            name: 'Road Pro',
            price: 1999,
          },
        ],
      },
    });
  });

  it('renders key sections and routes', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Find Your Perfect Ride')).toBeInTheDocument();
    expect(screen.getByText('Shop by Category')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /shop now/i })).toHaveAttribute('href', '/products');
  });

  it('adds mapped featured product to cart and ignores unknown ids', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('add featured'));
    expect(addToCart).toHaveBeenCalledWith({
      productId: 'p1',
      name: 'Road Pro',
      price: 1999,
      quantity: 1,
    });

    fireEvent.click(screen.getByText('add missing'));
    expect(addToCart).toHaveBeenCalledTimes(1);
  });
});
