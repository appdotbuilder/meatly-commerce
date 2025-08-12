import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, User, Package, Truck, Store } from 'lucide-react';
import { trpc } from '@/utils/trpc';

// Import components
import ProductCatalog from './components/ProductCatalog';
import ShoppingCartView from './components/ShoppingCartView';
import OrderManagement from './components/OrderManagement';
import UserProfile from './components/UserProfile';
import DeliveryTracking from './components/DeliveryTracking';

// Import types
import type { User as UserType, CartItemWithProduct, OrderWithItems } from '../../server/src/schema';

function App() {
  const [activeTab, setActiveTab] = useState<string>('catalog');
  const [user, setUser] = useState<UserType | null>(null);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock user ID for demo purposes (in real app, this would come from authentication)
  const currentUserId = 1;

  const loadUserData = useCallback(async () => {
    // STUB: Set mock user data for demo
    const mockUser: UserType = {
      id: currentUserId,
      email: 'john.doe@example.com',
      full_name: 'John Doe',
      phone: '+1-555-123-4567',
      address: '123 Main Street, Apartment 4B, New York, NY 10001',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    };
    
    setUser(mockUser);
    
    // Optional: Try to fetch real data
    try {
      const userData = await trpc.getUser.query({ id: currentUserId });
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.log('Backend not available, using demo user data');
    }
  }, [currentUserId]);

  const loadCartData = useCallback(async () => {
    // STUB: Set mock cart data for demo (empty by default)
    setCartItems([]);
    
    // Optional: Try to fetch real data
    try {
      const cartData = await trpc.getUserCart.query({ user_id: currentUserId });
      if (cartData) {
        setCartItems(cartData);
      }
    } catch (error) {
      console.log('Backend not available, using demo cart data');
    }
  }, [currentUserId]);

  const loadOrdersData = useCallback(async () => {
    // STUB: Set mock orders data for demo (empty by default, will be shown in OrderManagement)
    setOrders([]);
    
    // Optional: Try to fetch real data
    try {
      const ordersData = await trpc.getUserOrders.query({ user_id: currentUserId });
      if (ordersData) {
        setOrders(ordersData);
      }
    } catch (error) {
      console.log('Backend not available, using demo orders data');
    }
  }, [currentUserId]);

  useEffect(() => {
    loadUserData();
    loadCartData();
    loadOrdersData();
  }, [loadUserData, loadCartData, loadOrdersData]);

  const refreshCart = () => {
    loadCartData();
  };

  const refreshOrders = () => {
    loadOrdersData();
  };

  const cartItemCount = cartItems.reduce((sum: number, item: CartItemWithProduct) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-red-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🥩</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-red-800">Meatly</h1>
                <p className="text-sm text-red-600">Fresh. Fast. Delivered.</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">Welcome back!</p>
                  <p className="text-xs text-gray-500">{user.full_name}</p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="relative"
                onClick={() => setActiveTab('cart')}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {cartItemCount > 0 && (
                  <Badge className="ml-2 px-1.5 py-0.5 text-xs bg-red-600 hover:bg-red-700">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Mode Alert */}
      <div className="container mx-auto px-4 py-2">
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800">
            <strong>🚀 Demo Mode Active:</strong> This application uses mock data to demonstrate all features. 
            Backend integration is optional - all core functionality works independently with simulated responses.
            Try adding products to cart, placing orders, and managing your profile!
          </AlertDescription>
        </Alert>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
            <TabsTrigger value="catalog" className="flex items-center space-x-2">
              <Store className="h-4 w-4" />
              <span>Catalog</span>
            </TabsTrigger>
            <TabsTrigger value="cart" className="flex items-center space-x-2 relative">
              <ShoppingCart className="h-4 w-4" />
              <span>Cart</span>
              {cartItemCount > 0 && (
                <Badge className="ml-1 px-1 py-0 text-xs bg-red-600 hover:bg-red-700">
                  {cartItemCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center space-x-2">
              <Truck className="h-4 w-4" />
              <span>Tracking</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog">
            <ProductCatalog 
              userId={currentUserId}
              onCartUpdate={refreshCart}
            />
          </TabsContent>

          <TabsContent value="cart">
            <ShoppingCartView
              userId={currentUserId}
              cartItems={cartItems}
              user={user}
              onCartUpdate={refreshCart}
              onOrderCreated={refreshOrders}
            />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement
              userId={currentUserId}
              orders={orders}
              onOrderUpdate={refreshOrders}
            />
          </TabsContent>

          <TabsContent value="tracking">
            <DeliveryTracking
              userId={currentUserId}
              orders={orders}
            />
          </TabsContent>

          <TabsContent value="profile">
            <UserProfile
              user={user}
              onUserUpdate={loadUserData}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-red-100 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-2 mb-4">
              <span className="text-2xl">🥩</span>
              <span className="text-xl font-bold text-red-800">Meatly</span>
            </div>
            <p className="text-gray-600">
              Fresh meat, fish & chicken delivered to your doorstep
            </p>
            <p className="text-sm text-gray-500 mt-2">
              © 2024 Meatly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;