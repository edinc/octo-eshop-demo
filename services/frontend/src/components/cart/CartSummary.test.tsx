import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CartSummary } from './CartSummary';

describe('CartSummary', () => {
  it('renders subtotal correctly', () => {
    render(
      <BrowserRouter>
        <CartSummary subtotal={100} />
      </BrowserRouter>
    );

    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
  });

  it('displays free shipping when shipping is 0', () => {
    render(
      <BrowserRouter>
        <CartSummary subtotal={100} shipping={0} />
      </BrowserRouter>
    );

    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('displays shipping cost when provided', () => {
    render(
      <BrowserRouter>
        <CartSummary subtotal={100} shipping={10} />
      </BrowserRouter>
    );

    expect(screen.getByText('$10.00')).toBeInTheDocument();
  });

  it('calculates tax at 8% by default', () => {
    render(
      <BrowserRouter>
        <CartSummary subtotal={100} />
      </BrowserRouter>
    );

    // Tax should be $8.00 (8% of $100)
    expect(screen.getByText('$8.00')).toBeInTheDocument();
  });

  it('uses provided tax value', () => {
    render(
      <BrowserRouter>
        <CartSummary subtotal={100} tax={15} />
      </BrowserRouter>
    );

    expect(screen.getByText('$15.00')).toBeInTheDocument();
  });

  it('calculates total correctly', () => {
    render(
      <BrowserRouter>
        <CartSummary subtotal={100} shipping={10} tax={8} />
      </BrowserRouter>
    );

    // Total = 100 + 10 + 8 = 118
    expect(screen.getByText('$118.00')).toBeInTheDocument();
  });

  it('shows checkout button by default', () => {
    render(
      <BrowserRouter>
        <CartSummary subtotal={100} />
      </BrowserRouter>
    );

    expect(screen.getByText('Proceed to Checkout')).toBeInTheDocument();
  });

  it('hides checkout button when showCheckoutButton is false', () => {
    render(
      <BrowserRouter>
        <CartSummary subtotal={100} showCheckoutButton={false} />
      </BrowserRouter>
    );

    expect(screen.queryByText('Proceed to Checkout')).not.toBeInTheDocument();
  });
});
