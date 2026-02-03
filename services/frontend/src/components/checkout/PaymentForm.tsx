import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, Lock } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { paymentSchema, type PaymentFormData } from '@/utils/validators';

interface PaymentFormProps {
  onSubmit: (data: PaymentFormData) => void;
  isLoading?: boolean;
}

export function PaymentForm({ onSubmit, isLoading }: PaymentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <CreditCard className="w-5 h-5 mr-2" />
        Payment Details
      </h3>

      <Input
        label="Cardholder Name"
        placeholder="John Doe"
        error={errors.cardholderName?.message}
        {...register('cardholderName')}
      />

      <Input
        label="Card Number"
        placeholder="1234 5678 9012 3456"
        maxLength={16}
        error={errors.cardNumber?.message}
        {...register('cardNumber')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Expiry Date"
          placeholder="MM/YY"
          maxLength={5}
          error={errors.expiryDate?.message}
          {...register('expiryDate')}
        />
        <Input
          label="CVV"
          placeholder="123"
          maxLength={4}
          type="password"
          error={errors.cvv?.message}
          {...register('cvv')}
        />
      </div>

      <div className="flex items-center text-sm text-gray-500 mt-2">
        <Lock className="w-4 h-4 mr-2" />
        Your payment information is secure and encrypted
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
        Place Order
      </Button>
    </form>
  );
}
