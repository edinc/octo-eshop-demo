import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartItem } from './CartItem';

const mockItem = {
  productId: '1',
  name: 'Trek Marlin 7',
  price: 1099.99,
  quantity: 2,
};

describe('CartItem', () => {
  it('renders item information correctly', () => {
    render(<CartItem item={mockItem} onUpdateQuantity={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByText('Trek Marlin 7')).toBeInTheDocument();
    expect(screen.getByText('$1,099.99')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('$2,199.98')).toBeInTheDocument();
  });

  it('calls onUpdateQuantity with decreased quantity when minus is clicked', () => {
    const onUpdateQuantity = vi.fn();
    render(<CartItem item={mockItem} onUpdateQuantity={onUpdateQuantity} onRemove={vi.fn()} />);

    const minusButton = screen.getAllByRole('button')[0];
    fireEvent.click(minusButton);
    expect(onUpdateQuantity).toHaveBeenCalledWith('1', 1);
  });

  it('calls onUpdateQuantity with increased quantity when plus is clicked', () => {
    const onUpdateQuantity = vi.fn();
    render(<CartItem item={mockItem} onUpdateQuantity={onUpdateQuantity} onRemove={vi.fn()} />);

    const plusButton = screen.getAllByRole('button')[1];
    fireEvent.click(plusButton);
    expect(onUpdateQuantity).toHaveBeenCalledWith('1', 3);
  });

  it('calls onRemove when trash button is clicked', () => {
    const onRemove = vi.fn();
    render(<CartItem item={mockItem} onUpdateQuantity={vi.fn()} onRemove={onRemove} />);

    const removeButton = screen.getAllByRole('button')[2];
    fireEvent.click(removeButton);
    expect(onRemove).toHaveBeenCalledWith('1');
  });

  it('disables minus button when quantity is 1', () => {
    const singleItem = { ...mockItem, quantity: 1 };
    render(<CartItem item={singleItem} onUpdateQuantity={vi.fn()} onRemove={vi.fn()} />);

    const minusButton = screen.getAllByRole('button')[0];
    expect(minusButton).toBeDisabled();
  });
});
