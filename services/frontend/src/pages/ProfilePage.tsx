import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/formatters';

export function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="md:col-span-2">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-500">Customer</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-gray-600">
              <Mail className="w-5 h-5" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span>Member since {formatDate(user.createdAt)}</span>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/orders')}
              className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              View Orders
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
              Edit Profile
            </button>
            <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
              Manage Addresses
            </button>
            <hr className="my-2" />
            <Button variant="danger" className="w-full" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
