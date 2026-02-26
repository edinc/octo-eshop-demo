import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProductDetailPage } from './ProductDetailPage';
import { useProduct } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';

vi.mock('@/hooks/useProducts', () => ({
  useProduct: vi.fn(),
}));

vi.mock('@/hooks/useCart', () => ({
  useCart: vi.fn(),
}));

const mockedUseProduct = useProduct as unknown as ReturnType<typeof vi.fn>;
const mockedUseCart = useCart as unknown as ReturnType<typeof vi.fn>;

describe('ProductDetailPage', () => {
  const addToCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseCart.mockReturnValue({ addToCart });
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/products/p1']}>
        <Routes>
          <Route path="/products/:id" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

  it('renders not-found state when product is missing', () => {
    mockedUseProduct.mockReturnValue({ isLoading: false, error: new Error('missing'), data: null });

    renderPage();

    expect(screen.getByText('Product Not Found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to products/i })).toHaveAttribute(
      'href',
      '/products'
    );
  });

  it('renders product details and adds default quantity to cart', () => {
    mockedUseProduct.mockReturnValue({
      isLoading: false,
      error: null,
      data: {
        data: {
          id: 'p1',
          name: 'Trail Master',
          description: 'All-around mountain bike',
          price: 1499,
          category: 'mountain',
          brand: 'Canyon',
          images: ['/a.jpg', '/b.jpg'],
          stock: 2,
          featured: true,
          specifications: {
            frameSize: 'M',
            wheelSize: '29',
            weight: 14,
            material: 'Aluminum',
            gears: 12,
            color: 'Black',
          },
        },
      },
    });

    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Trail Master' })).toBeInTheDocument();
    expect(screen.getByText('Only 2 left')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Add to Cart'));

    expect(addToCart).toHaveBeenCalledWith({
      productId: 'p1',
      name: 'Trail Master',
      price: 1499,
      quantity: 1,
    });
  });
});
