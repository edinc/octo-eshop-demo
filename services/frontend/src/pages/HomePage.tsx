import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, Award, HeadphonesIcon } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useFeaturedProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import type { ProductCategory } from '@/types';

const categories: {
  name: string;
  category: ProductCategory;
  image: string;
  description: string;
}[] = [
  { name: 'Mountain Bikes', category: 'mountain', image: '🏔️', description: 'Conquer any trail' },
  { name: 'Road Bikes', category: 'road', image: '🛣️', description: 'Speed on pavement' },
  {
    name: 'Electric Bikes',
    category: 'electric',
    image: '⚡',
    description: 'Power-assisted rides',
  },
  { name: 'Hybrid Bikes', category: 'hybrid', image: '🚴', description: 'Best of both worlds' },
  { name: 'Kids Bikes', category: 'kids', image: '👶', description: 'Safe for little ones' },
];

const features = [
  { icon: Truck, title: 'Free Shipping', description: 'On orders over $99' },
  { icon: Shield, title: 'Secure Payments', description: '256-bit SSL encryption' },
  { icon: Award, title: 'Quality Guarantee', description: '2-year warranty' },
  { icon: HeadphonesIcon, title: '24/7 Support', description: 'Expert assistance' },
];

export function HomePage() {
  const { data: featuredData, isLoading } = useFeaturedProducts();
  const { addToCart } = useCart();

  const handleAddToCart = (productId: string) => {
    const product = featuredData?.data?.find(p => p.id === productId);
    if (product) {
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
      });
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Find Your Perfect Ride</h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Premium bicycles for every adventure. Quality craftsmanship meets modern design.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/products">
                <Button
                  size="lg"
                  variant="secondary"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Shop Now
                </Button>
              </Link>
              <Link to="/products?category=electric">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Explore Electric
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map(feature => (
              <div key={feature.title} className="text-center">
                <feature.icon className="w-10 h-10 mx-auto text-primary-600 mb-3" />
                <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Shop by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map(cat => (
              <Link
                key={cat.category}
                to={`/products?category=${cat.category}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 text-center group"
              >
                <span className="text-4xl block mb-3">{cat.image}</span>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-sm text-gray-500">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Bikes</h2>
            <Link
              to="/products"
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <ProductGrid
            products={featuredData?.data || []}
            onAddToCart={handleAddToCart}
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Join thousands of happy cyclists who found their perfect ride with Octo E-Shop.
          </p>
          <Link to="/products">
            <Button size="lg">Browse All Bikes</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
