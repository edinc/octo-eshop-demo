import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';

const mockProduct = {
  id: '1',
  name: 'Trek Marlin 7',
  description: 'A versatile hardtail mountain bike',
  price: 1099.99,
  category: 'mountain' as const,
  brand: 'Trek',
  images: ['/images/trek-marlin.jpg'],
  stock: 10,
  featured: true,
  specifications: {
    frameSize: 'M',
    wheelSize: '29"',
    weight: 13.5,
    material: 'Aluminum',
    gears: 18,
    color: 'Black',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} onAddToCart={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText('Trek Marlin 7')).toBeInTheDocument();
    expect(screen.getByText('Trek')).toBeInTheDocument();
    expect(screen.getByText('$1,099.99')).toBeInTheDocument();
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('calls onAddToCart when Add button is clicked', () => {
    const handleAddToCart = vi.fn();
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} onAddToCart={handleAddToCart} />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Add'));
    expect(handleAddToCart).toHaveBeenCalledWith('1');
  });

  it('disables Add button when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    render(
      <BrowserRouter>
        <ProductCard product={outOfStockProduct} onAddToCart={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText('Add')).toBeDisabled();
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });
});
