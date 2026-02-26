import { describe, expect, it } from 'vitest';
import {
  addressSchema,
  loginSchema,
  passwordSchema,
  paymentSchema,
  registerSchema,
} from './validators';

describe('validators', () => {
  it('validates login schema', () => {
    expect(loginSchema.safeParse({ email: 'user@example.com', password: 'secret' }).success).toBe(
      true
    );
    expect(loginSchema.safeParse({ email: 'invalid-email', password: '' }).success).toBe(false);
  });

  it('validates password complexity rules', () => {
    expect(passwordSchema.safeParse('Password1').success).toBe(true);
    expect(passwordSchema.safeParse('password1').success).toBe(false);
  });

  it('validates register schema and confirm password match', () => {
    expect(
      registerSchema.safeParse({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'Password1',
        confirmPassword: 'Password1',
      }).success
    ).toBe(true);

    expect(
      registerSchema.safeParse({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'Password1',
        confirmPassword: 'Mismatch1',
      }).success
    ).toBe(false);
  });

  it('validates address and payment schemas', () => {
    expect(
      addressSchema.safeParse({
        street: '123 Main St',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'US',
      }).success
    ).toBe(true);
    expect(
      paymentSchema.safeParse({
        cardNumber: '4242424242424242',
        expiryDate: '12/30',
        cvv: '123',
        cardholderName: 'Jane Doe',
      }).success
    ).toBe(true);
    expect(
      paymentSchema.safeParse({
        cardNumber: '123',
        expiryDate: '13/99',
        cvv: '12',
        cardholderName: '',
      }).success
    ).toBe(false);
  });
});
