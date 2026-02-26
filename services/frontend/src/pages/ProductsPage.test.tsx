import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductsPage } from './ProductsPage';
import { useProducts, useCategories, useBrands } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';

const setSearchParams = vi.fn();

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams('category=road&page=2'), setSearchParams] as const,
  };
});

vi.mock('@/hooks/useProducts', () => ({
  useProducts: vi.fn(),
  useCategories: vi.fn(),
  useBrands: vi.fn(),
}));

vi.mock('@/hooks/useCart', () => ({
  useCart: vi.fn(),
}));

vi.mock('@/components/products/ProductFilters', () => ({
  ProductFilters: ({
    onFilterChange,
  }: {
    onFilterChange: (value: { brand?: string; page?: number }) => void;
  }) => <button onClick={() => onFilterChange({ brand: 'Canyon', page: 1 })}>apply filter</button>,
}));

vi.mock('@/components/products/ProductSearch', () => ({
  ProductSearch: ({ onSearch }: { onSearch: (query: string) => void }) => (
    <button onClick={() => onSearch('gravel')}>run search</button>
  ),
}));

vi.mock('@/components/products/ProductGrid', () => ({
  ProductGrid: ({ onAddToCart }: { onAddToCart: (productId: string) => void }) => (
    <button onClick={() => onAddToCart('p1')}>add from grid</button>
  ),
}));

const mockedUseProducts = useProducts as unknown as ReturnType<typeof vi.fn>;
const mockedUseCategories = useCategories as unknown as ReturnType<typeof vi.fn>;
const mockedUseBrands = useBrands as unknown as ReturnType<typeof vi.fn>;
const mockedUseCart = useCart as unknown as ReturnType<typeof vi.fn>;

describe('ProductsPage', () => {
  const addToCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseCart.mockReturnValue({ addToCart });
    mockedUseCategories.mockReturnValue({ data: { data: ['road', 'mountain'] } });
    mockedUseBrands.mockReturnValue({ data: { data: ['Canyon', 'Trek'] } });
    mockedUseProducts.mockReturnValue({
      isLoading: false,
      data: {
        data: [
          {
            id: 'p1',
            name: 'Roadster',
            price: '1099.99',
          },
        ],
        meta: {
          page: 2,
          totalPages: 3,
          total: 15,
          limit: 12,
        },
      },
    });
  });

  it('renders result count, syncs query params, and adds parsed-price product to cart', () => {
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Showing 1 of 15 products')).toBeInTheDocument();
    expect(setSearchParams).toHaveBeenCalled();

    fireEvent.click(screen.getByText('add from grid'));
    expect(addToCart).toHaveBeenCalledWith({
      productId: 'p1',
      name: 'Roadster',
      price: 1099.99,
      quantity: 1,
    });
  });

  it('handles filter/search changes and pagination controls', () => {
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('apply filter'));
    fireEvent.click(screen.getByText('run search'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Previous'));

    expect(setSearchParams).toHaveBeenCalled();
  });
});
