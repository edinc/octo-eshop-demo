import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Truck, Shield, ArrowLeft, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { PageSpinner } from '@/components/common/Spinner';
import { useProduct } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/utils/formatters';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useProduct(id!);
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  if (isLoading) return <PageSpinner />;

  if (error || !data?.data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
        <Link to="/products">
          <Button leftIcon={<ArrowLeft className="w-4 h-4" />}>Back to Products</Button>
        </Link>
      </div>
    );
  }

  const product = data.data;

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-primary-600">
          Home
        </Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary-600">
          Products
        </Link>
        <span>/</span>
        <Link
          to={`/products?category=${product.category}`}
          className="hover:text-primary-600 capitalize"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
            <img
              src={product.images[selectedImage] || '/images/placeholder-bike.jpg'}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/placeholder-bike.jpg';
              }}
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex space-x-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-primary-600' : 'border-transparent'
                  }`}
                >
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm text-gray-500 uppercase tracking-wide">{product.brand}</span>
            {product.featured && <Badge variant="info">Featured</Badge>}
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

          <p className="text-gray-600 mb-6">{product.description}</p>

          <div className="text-3xl font-bold text-gray-900 mb-6">{formatPrice(product.price)}</div>

          {/* Stock Status */}
          <div className="mb-6">
            {product.stock > 10 ? (
              <Badge variant="success">In Stock</Badge>
            ) : product.stock > 0 ? (
              <Badge variant="warning">Only {product.stock} left</Badge>
            ) : (
              <Badge variant="error">Out of Stock</Badge>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center space-x-4 mb-6">
            <span className="text-gray-700">Quantity:</span>
            <div className="flex items-center border rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-gray-100"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="p-2 hover:bg-gray-100"
                disabled={quantity >= product.stock}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 mb-8">
            <Button
              size="lg"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              leftIcon={<ShoppingCart className="w-5 h-5" />}
              className="flex-grow"
            >
              Add to Cart
            </Button>
            <Button variant="outline" size="lg">
              <Heart className="w-5 h-5" />
            </Button>
          </div>

          {/* Features */}
          <div className="space-y-3 border-t pt-6">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Truck className="w-5 h-5 text-primary-600" />
              <span>Free shipping on orders over $99</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Shield className="w-5 h-5 text-primary-600" />
              <span>2-year warranty included</span>
            </div>
          </div>

          {/* Specifications */}
          <div className="border-t mt-8 pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Frame Size</dt>
                <dd className="font-medium text-gray-900">{product.specifications.frameSize}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Wheel Size</dt>
                <dd className="font-medium text-gray-900">{product.specifications.wheelSize}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Weight</dt>
                <dd className="font-medium text-gray-900">{product.specifications.weight} kg</dd>
              </div>
              <div>
                <dt className="text-gray-500">Material</dt>
                <dd className="font-medium text-gray-900">{product.specifications.material}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Gears</dt>
                <dd className="font-medium text-gray-900">{product.specifications.gears}-speed</dd>
              </div>
              <div>
                <dt className="text-gray-500">Color</dt>
                <dd className="font-medium text-gray-900">{product.specifications.color}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
