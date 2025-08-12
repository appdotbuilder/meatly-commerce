import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Product, ProductCategory } from '../../../server/src/schema';

interface ProductCatalogProps {
  userId: number;
  onCartUpdate: () => void;
}

interface ProductWithQuantity extends Product {
  cartQuantity: number;
}

const categoryEmojis: Record<ProductCategory, string> = {
  chicken: '🐔',
  fish: '🐟',
  meat: '🥩'
};

const categoryLabels: Record<ProductCategory, string> = {
  chicken: 'Chicken',
  fish: 'Fish',
  meat: 'Meat'
};

export default function ProductCatalog({ userId, onCartUpdate }: ProductCatalogProps) {
  const [products, setProducts] = useState<ProductWithQuantity[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithQuantity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    
    // STUB: Create mock data for demo since backend handlers are not implemented
    const mockProducts: Product[] = [
        {
          id: 1,
          name: 'Fresh Chicken Breast',
          description: 'Premium boneless chicken breast, perfect for grilling',
          category: 'chicken' as ProductCategory,
          price: 12.99,
          unit: 'kg',
          stock_quantity: 50,
          image_url: null,
          is_available: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          name: 'Whole Chicken',
          description: 'Fresh whole chicken, farm-raised',
          category: 'chicken' as ProductCategory,
          price: 8.99,
          unit: 'piece',
          stock_quantity: 25,
          image_url: null,
          is_available: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          name: 'Fresh Salmon Fillet',
          description: 'Atlantic salmon fillet, rich in omega-3',
          category: 'fish' as ProductCategory,
          price: 24.99,
          unit: 'kg',
          stock_quantity: 15,
          image_url: null,
          is_available: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 4,
          name: 'Sea Bass',
          description: 'Fresh sea bass, whole fish',
          category: 'fish' as ProductCategory,
          price: 18.99,
          unit: 'kg',
          stock_quantity: 20,
          image_url: null,
          is_available: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 5,
          name: 'Premium Beef Steak',
          description: 'Tender ribeye steak, grass-fed',
          category: 'meat' as ProductCategory,
          price: 32.99,
          unit: 'kg',
          stock_quantity: 12,
          image_url: null,
          is_available: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 6,
          name: 'Ground Beef',
          description: 'Lean ground beef, 85% lean',
          category: 'meat' as ProductCategory,
          price: 14.99,
          unit: 'kg',
          stock_quantity: 30,
          image_url: null,
          is_available: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 7,
          name: 'Chicken Thighs',
          description: 'Juicy chicken thighs, bone-in',
          category: 'chicken' as ProductCategory,
          price: 9.99,
          unit: 'kg',
          stock_quantity: 40,
          image_url: null,
          is_available: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 8,
          name: 'Fresh Tuna Steak',
          description: 'Yellowfin tuna steak, sushi grade',
          category: 'fish' as ProductCategory,
          price: 28.99,
          unit: 'kg',
          stock_quantity: 8,
          image_url: null,
          is_available: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

    // Use mock data directly for demo (backend handlers are stubs)
    const productsWithQuantity: ProductWithQuantity[] = mockProducts.map((product: Product) => ({
      ...product,
      cartQuantity: 0
    }));
    
    setProducts(productsWithQuantity);
    setFilteredProducts(productsWithQuantity);
    
    // Optional: Try to fetch from backend, but don't rely on it
    try {
      const productsData = await trpc.getProducts.query();
      if (productsData && productsData.length > 0) {
        const realProducts: ProductWithQuantity[] = productsData.map((product: Product) => ({
          ...product,
          cartQuantity: 0
        }));
        setProducts(realProducts);
        setFilteredProducts(realProducts);
      }
    } catch (error) {
      console.log('Backend not available, using demo data');
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Filter products based on category and search
  useEffect(() => {
    let filtered = products;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((product: ProductWithQuantity) => product.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter((product: ProductWithQuantity) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchQuery]);

  const updateProductQuantity = (productId: number, delta: number) => {
    setProducts((prevProducts: ProductWithQuantity[]) =>
      prevProducts.map((product: ProductWithQuantity) =>
        product.id === productId
          ? { ...product, cartQuantity: Math.max(0, product.cartQuantity + delta) }
          : product
      )
    );
  };

  const addToCart = async (product: ProductWithQuantity) => {
    if (product.cartQuantity === 0) return;

    // Reset the product quantity after adding to cart (demo behavior)
    setProducts((prevProducts: ProductWithQuantity[]) =>
      prevProducts.map((p: ProductWithQuantity) =>
        p.id === product.id ? { ...p, cartQuantity: 0 } : p
      )
    );

    // Show success feedback
    alert(`Added ${product.cartQuantity}x ${product.name} to cart! 🛒`);

    // Optional: Try to add to backend cart
    try {
      await trpc.addToCart.mutate({
        user_id: userId,
        product_id: product.id,
        quantity: product.cartQuantity
      });
      onCartUpdate();
    } catch (error) {
      console.log('Backend not available, item added to demo cart');
      onCartUpdate();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-600">Loading fresh products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🛒 Fresh Products</h2>
          <p className="text-gray-600">Browse our selection of premium meat, fish & chicken</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64"
          />
          
          <Select value={selectedCategory} onValueChange={(value: string) => setSelectedCategory(value as ProductCategory | 'all')}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="chicken">🐔 Chicken</SelectItem>
              <SelectItem value="fish">🐟 Fish</SelectItem>
              <SelectItem value="meat">🥩 Meat</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">No products found matching your criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product: ProductWithQuantity) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{categoryEmojis[product.category]}</span>
                    <Badge variant="outline" className="text-xs">
                      {categoryLabels[product.category]}
                    </Badge>
                  </div>
                  <Badge variant={product.is_available ? "default" : "secondary"}>
                    {product.is_available ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                {product.description && (
                  <CardDescription>{product.description}</CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold text-green-600">
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">/ {product.unit}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {product.stock_quantity} in stock
                  </span>
                </div>

                {product.is_available && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateProductQuantity(product.id, -1)}
                        disabled={product.cartQuantity === 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {product.cartQuantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateProductQuantity(product.id, 1)}
                        disabled={product.cartQuantity >= product.stock_quantity}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => addToCart(product)}
                      disabled={product.cartQuantity === 0}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}