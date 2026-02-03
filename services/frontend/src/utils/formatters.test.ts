import { describe, it, expect } from 'vitest';
import { formatPrice, formatDate, formatDateTime, truncate, capitalizeFirst } from './formatters';

describe('formatPrice', () => {
  it('formats price in USD currency', () => {
    expect(formatPrice(1099.99)).toBe('$1,099.99');
  });

  it('formats whole numbers with decimals', () => {
    expect(formatPrice(100)).toBe('$100.00');
  });

  it('formats zero correctly', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('formats large numbers with commas', () => {
    expect(formatPrice(10000)).toBe('$10,000.00');
  });
});

describe('formatDate', () => {
  it('formats Date object correctly', () => {
    const date = new Date('2024-01-15T12:00:00Z');
    const result = formatDate(date);
    expect(result).toContain('January');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('formats date string correctly', () => {
    const result = formatDate('2024-06-20');
    expect(result).toContain('June');
    expect(result).toContain('20');
    expect(result).toContain('2024');
  });
});

describe('formatDateTime', () => {
  it('includes time in the output', () => {
    const date = new Date('2024-01-15T14:30:00Z');
    const result = formatDateTime(date);
    expect(result).toContain('2024');
  });
});

describe('truncate', () => {
  it('returns original string if shorter than length', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('returns original string if equal to length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });

  it('truncates and adds ellipsis if longer than length', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
  });

  it('handles empty string', () => {
    expect(truncate('', 5)).toBe('');
  });
});

describe('capitalizeFirst', () => {
  it('capitalizes first letter', () => {
    expect(capitalizeFirst('hello')).toBe('Hello');
  });

  it('handles already capitalized string', () => {
    expect(capitalizeFirst('Hello')).toBe('Hello');
  });

  it('handles single character', () => {
    expect(capitalizeFirst('h')).toBe('H');
  });

  it('handles empty string', () => {
    expect(capitalizeFirst('')).toBe('');
  });
});
