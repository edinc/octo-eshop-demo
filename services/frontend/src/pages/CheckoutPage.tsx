import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { AddressForm } from '@/components/checkout/AddressForm';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { useCart } from '@/hooks/useCart';
import { useCreateOrder } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import type { AddressFormData, PaymentFormData } from '@/utils/validators';

type CheckoutStep = 'address' | 'payment' | 'confirmation';

export function CheckoutPage() {
  const [step, setStep] = useState<CheckoutStep>('address');
  const [shippingAddress, setShippingAddress] = useState<AddressFormData | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const { items, totalPrice, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const createOrder = useCreateOrder();

  if (!isAuthenticated) {
    navigate('/login?redirect=/checkout');
    return null;
  }

  if (items.length === 0 && step !== 'confirmation') {
    navigate('/cart');
    return null;
  }

  const handleAddressSubmit = (data: AddressFormData) => {
    setShippingAddress(data);
    setStep('payment');
  };

  const handlePaymentSubmit = async (_data: PaymentFormData) => {
    if (!shippingAddress) return;

    try {
      const response = await createOrder.mutateAsync({
        shippingAddress,
        paymentMethod: 'card',
      });

      if (response.success && response.data) {
        setOrderId(response.data.id);
        clearCart();
        setStep('confirmation');
      }
    } catch (error) {
      console.error('Order creation failed:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div
          className={`flex items-center ${step === 'address' ? 'text-primary-600' : 'text-gray-400'}`}
        >
          <span className="w-8 h-8 rounded-full bg-current text-white flex items-center justify-center text-sm font-medium">
            1
          </span>
          <span className="ml-2 font-medium">Address</span>
        </div>
        <div className="w-16 h-0.5 bg-gray-300 mx-4" />
        <div
          className={`flex items-center ${step === 'payment' ? 'text-primary-600' : 'text-gray-400'}`}
        >
          <span className="w-8 h-8 rounded-full bg-current text-white flex items-center justify-center text-sm font-medium">
            2
          </span>
          <span className="ml-2 font-medium">Payment</span>
        </div>
        <div className="w-16 h-0.5 bg-gray-300 mx-4" />
        <div
          className={`flex items-center ${step === 'confirmation' ? 'text-primary-600' : 'text-gray-400'}`}
        >
          <span className="w-8 h-8 rounded-full bg-current text-white flex items-center justify-center text-sm font-medium">
            3
          </span>
          <span className="ml-2 font-medium">Confirm</span>
        </div>
      </div>

      {step === 'confirmation' ? (
        <div className="max-w-md mx-auto text-center py-12">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
          <p className="text-gray-600 mb-4">
            Thank you for your purchase. Your order #{orderId} has been placed.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            You will receive an email confirmation shortly.
          </p>
          <button onClick={() => navigate('/orders')} className="text-primary-600 hover:underline">
            View Order Details
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            {step === 'address' && <AddressForm onSubmit={handleAddressSubmit} />}
            {step === 'payment' && (
              <div>
                <button
                  onClick={() => setStep('address')}
                  className="text-primary-600 hover:underline mb-4 text-sm"
                >
                  ← Back to address
                </button>
                <PaymentForm onSubmit={handlePaymentSubmit} isLoading={createOrder.isPending} />
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <OrderSummary items={items} subtotal={totalPrice} />
          </div>
        </div>
      )}
    </div>
  );
}
