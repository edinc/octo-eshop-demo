import { Link } from 'react-router-dom';
import { Button } from '../common/Button';
import { formatPrice } from '@/utils/formatters';

interface CartSummaryProps {
  subtotal: number;
  shipping?: number;
  tax?: number;
  showCheckoutButton?: boolean;
}

export function CartSummary({
  subtotal,
  shipping = 0,
  tax,
  showCheckoutButton = true,
}: CartSummaryProps) {
  const calculatedTax = tax ?? subtotal * 0.08; // Default 8% tax
  const total = subtotal + shipping + calculatedTax;

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

      <div className="space-y-3">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          <span>{shipping > 0 ? formatPrice(shipping) : 'Free'}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Tax</span>
          <span>{formatPrice(calculatedTax)}</span>
        </div>

        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between text-lg font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {showCheckoutButton && (
        <Link to="/checkout" className="block mt-6">
          <Button className="w-full" size="lg">
            Proceed to Checkout
          </Button>
        </Link>
      )}
    </div>
  );
}
