import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { PageSpinner } from '@/components/common/Spinner';
import { useOrder, useCancelOrder } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, formatDate } from '@/utils/formatters';
import type { OrderStatus } from '@/types';

const statusVariants: Record<OrderStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  pending: 'warning',
  paid: 'info',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'error',
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useOrder(id!);
  const cancelOrder = useCancelOrder();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (isLoading) return <PageSpinner />;

  const order = data?.data;

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
        <Link to="/orders">
          <Button leftIcon={<ArrowLeft className="w-4 h-4" />}>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel this order?')) {
      await cancelOrder.mutateAsync(order.id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/orders" className="inline-flex items-center text-primary-600 hover:underline mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Orders
      </Link>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(0, 8)}</h1>
            <p className="text-gray-500">{formatDate(order.createdAt)}</p>
          </div>
          <Badge
            variant={statusVariants[order.status]}
            size="md"
            className="mt-2 sm:mt-0 capitalize"
          >
            {order.status}
          </Badge>
        </div>

        {/* Items */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Items
          </h3>
          <div className="divide-y">
            {order.items.map(item => (
              <div key={item.productId} className="py-3 flex justify-between">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium text-gray-900">
                  {formatPrice(item.priceAtPurchase * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Shipping Address
          </h3>
          <p className="text-gray-600">
            {order.shippingAddress.street}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
            {order.shippingAddress.postalCode}
            <br />
            {order.shippingAddress.country}
          </p>
        </div>

        {/* Total */}
        <div className="border-t pt-4">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </div>

        {/* Actions */}
        {order.status === 'pending' && (
          <div className="mt-6">
            <Button variant="danger" onClick={handleCancel} isLoading={cancelOrder.isPending}>
              Cancel Order
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
