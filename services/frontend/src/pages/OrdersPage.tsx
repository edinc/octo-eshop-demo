import { Link, useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { PageSpinner } from '@/components/common/Spinner';
import { Button } from '@/components/common/Button';
import { useOrders } from '@/hooks/useOrders';
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

export function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useOrders();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (isLoading) return <PageSpinner />;

  const orders = data?.data?.orders || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
          <p className="text-gray-600 mb-6">Start shopping to see your orders here.</p>
          <Link to="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
                <Badge variant={statusVariants[order.status]} className="mt-2 sm:mt-0 capitalize">
                  {order.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  {order.items.length} item{order.items.length > 1 ? 's' : ''}
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatPrice(order.totalAmount)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
