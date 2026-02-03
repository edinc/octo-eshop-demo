import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

interface ProductSearchProps {
  initialValue?: string;
  onSearch?: (query: string) => void;
}

export function ProductSearch({ initialValue = '', onSearch }: ProductSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        navigate(`/products?search=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        placeholder="Search products..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
