import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/common/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-8">Oops! The page you're looking for doesn't exist.</p>
        <Link to="/">
          <Button leftIcon={<Home className="w-4 h-4" />}>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
