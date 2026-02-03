import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItem as CartItemType } from '@/types';
import { formatPrice } from '@/utils/formatters';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex items-center space-x-4 py-4 border-b">
      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-2xl">🚲</span>
      </div>

      <div className="flex-grow">
        <h3 className="font-medium text-gray-900">{item.name}</h3>
        <p className="text-sm text-gray-500">{formatPrice(item.price)}</p>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          disabled={item.quantity <= 1}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center font-medium">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="text-right">
        <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
        <button
          onClick={() => onRemove(item.productId)}
          className="text-red-500 hover:text-red-700 transition-colors mt-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
