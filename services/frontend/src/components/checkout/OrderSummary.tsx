import type { CartItem } from '@/types';
import { formatPrice } from '@/utils/formatters';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping?: number;
  tax?: number;
}

export function OrderSummary({ items, subtotal, shipping = 0, tax }: OrderSummaryProps) {
  const calculatedTax = tax ?? subtotal * 0.08;
  const total = subtotal + shipping + calculatedTax;

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

      <div className="space-y-3 mb-4">
        {items.map(item => (
          <div key={item.productId} className="flex justify-between text-sm">
            <span className="text-gray-600">
              {item.name} × {item.quantity}
            </span>
            <span className="text-gray-900">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="text-gray-900">{shipping > 0 ? formatPrice(shipping) : 'Free'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax</span>
          <span className="text-gray-900">{formatPrice(calculatedTax)}</span>
        </div>
      </div>

      <div className="border-t mt-4 pt-4">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
