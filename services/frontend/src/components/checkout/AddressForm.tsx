import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { addressSchema, type AddressFormData } from '@/utils/validators';

interface AddressFormProps {
  onSubmit: (data: AddressFormData) => void;
  isLoading?: boolean;
  defaultValues?: Partial<AddressFormData>;
}

export function AddressForm({ onSubmit, isLoading, defaultValues }: AddressFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>

      <Input
        label="Street Address"
        placeholder="123 Main Street"
        error={errors.street?.message}
        {...register('street')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="City"
          placeholder="Portland"
          error={errors.city?.message}
          {...register('city')}
        />
        <Input
          label="State"
          placeholder="Oregon"
          error={errors.state?.message}
          {...register('state')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Postal Code"
          placeholder="97201"
          error={errors.postalCode?.message}
          {...register('postalCode')}
        />
        <Input
          label="Country"
          placeholder="USA"
          error={errors.country?.message}
          {...register('country')}
        />
      </div>

      <Button type="submit" isLoading={isLoading} className="w-full">
        Continue to Payment
      </Button>
    </form>
  );
}
