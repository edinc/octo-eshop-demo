import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Spinner, PageSpinner } from './Spinner';

describe('Spinner', () => {
  it('renders with default medium size', () => {
    const { container } = render(<Spinner />);
    const spinner = container.firstChild;
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('renders with small size when specified', () => {
    const { container } = render(<Spinner size="sm" />);
    const spinner = container.firstChild;
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  it('renders with large size when specified', () => {
    const { container } = render(<Spinner size="lg" />);
    const spinner = container.firstChild;
    expect(spinner).toHaveClass('w-12', 'h-12');
  });

  it('applies animation class', () => {
    const { container } = render(<Spinner />);
    const spinner = container.firstChild;
    expect(spinner).toHaveClass('animate-spin');
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="custom-spinner" />);
    const spinner = container.firstChild;
    expect(spinner).toHaveClass('custom-spinner');
  });
});

describe('PageSpinner', () => {
  it('renders a large spinner centered', () => {
    const { container } = render(<PageSpinner />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
  });
});
