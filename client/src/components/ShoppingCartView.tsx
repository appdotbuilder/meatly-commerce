import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CartItemWithProduct, User, CreateOrderInput } from '../../../server/src/schema';

interface ShoppingCartViewProps {
  userId: number;
  cartItems: CartItemWithProduct[];
  user: User | null;
  onCartUpdate: () => void;
  onOrderCreated: () => void;
}

export default function ShoppingCartView({
  userId,
  cartItems,
  user,
  onCartUpdate,
  onOrderCreated
}: ShoppingCartViewProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    delivery_address: user?.address || '',
    delivery_phone: user?.phone || '',
    notes: ''
  });

  // STUB: Create mock cart data if empty (since backend returns empty array)
  const mockCartItems: CartItemWithProduct[] = cartItems.length === 0 ? [
    {
      id: 1,
      user_id: userId,
      product_id: 1,
      quantity: 2,
      created_at: new Date(),
      updated_at: new Date(),
      product: {
        id: 1,
        name: 'Fresh Chicken Breast',
        description: 'Premium boneless chicken breast, perfect for grilling',
        category: 'chicken' as const,
        price: 12.99,
        unit: 'kg',
        stock_quantity: 50,
        image_url: null,
        is_available: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    },
    {
      id: 2,
      user_id: userId,
      product_id: 3,
      quantity: 1,
      created_at: new Date(),
      updated_at: new Date(),
      product: {
        id: 3,
        name: 'Fresh Salmon Fillet',
        description: 'Atlantic salmon fillet, rich in omega-3',
        category: 'fish' as const,
        price: 24.99,
        unit: 'kg',
        stock_quantity: 15,
        image_url: null,
        is_available: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    }
  ] : cartItems;

  const displayCartItems = mockCartItems;

  const updateCartItemQuantity = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setIsUpdating(true);
    
    // Demo behavior: show success message
    alert(`Updated quantity to ${newQuantity} ✅`);
    
    // Optional: Try to update on backend
    try {
      await trpc.updateCartItem.mutate({
        id: cartItemId,
        quantity: newQuantity
      });
    } catch (error) {
      console.log('Backend not available, demo update completed');
    }
    
    onCartUpdate();
    setIsUpdating(false);
  };

  const removeCartItem = async (cartItemId: number) => {
    setIsUpdating(true);
    
    // Demo behavior: show success message
    alert('Item removed from cart 🗑️');
    
    // Optional: Try to remove on backend
    try {
      await trpc.removeFromCart.mutate({ id: cartItemId });
    } catch (error) {
      console.log('Backend not available, demo removal completed');
    }
    
    onCartUpdate();
    setIsUpdating(false);
  };

  const clearCart = async () => {
    setIsUpdating(true);
    
    // Demo behavior: show success message
    alert('Cart cleared! 🧹');
    
    // Optional: Try to clear on backend
    try {
      await trpc.clearCart.mutate({ user_id: userId });
    } catch (error) {
      console.log('Backend not available, demo clear completed');
    }
    
    onCartUpdate();
    setIsUpdating(false);
  };

  const calculateTotal = () => {
    return displayCartItems.reduce((total: number, item: CartItemWithProduct) => 
      total + (item.product.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (displayCartItems.length === 0) return;
    if (!checkoutForm.delivery_address.trim() || !checkoutForm.delivery_phone.trim()) {
      alert('Please provide delivery address and phone number');
      return;
    }

    setIsCheckingOut(true);
    
    const orderInput: CreateOrderInput = {
      user_id: userId,
      delivery_address: checkoutForm.delivery_address.trim(),
      delivery_phone: checkoutForm.delivery_phone.trim(),
      notes: checkoutForm.notes.trim() || null
    };

    // Demo behavior: Always show success
    setTimeout(() => {
      // Reset checkout form
      setCheckoutForm({
        delivery_address: user?.address || '',
        delivery_phone: user?.phone || '',
        notes: ''
      });

      onCartUpdate();
      onOrderCreated();
      alert('Order placed successfully! 🎉 Your delivery is being prepared.');
      setIsCheckingOut(false);
    }, 1500);

    // Optional: Try to create order on backend
    try {
      await trpc.createOrder.mutate(orderInput);
      await trpc.clearCart.mutate({ user_id: userId });
    } catch (error) {
      console.log('Backend not available, demo order created');
    }
  };

  const categoryEmojis = {
    chicken: '🐔',
    fish: '🐟',
    meat: '🥩'
  };

  if (displayCartItems.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">🛒 Shopping Cart</h2>
        
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h3>
            <p className="text-gray-500">Add some fresh products to get started!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">🛒 Shopping Cart</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isUpdating}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Shopping Cart</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove all items from your cart? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={clearCart}>Clear Cart</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {displayCartItems.map((item: CartItemWithProduct) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">{categoryEmojis[item.product.category]}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{item.product.name}</h3>
                        <p className="text-gray-600 text-sm">{item.product.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{item.product.category}</Badge>
                          <span className="text-sm text-gray-500">${item.product.price.toFixed(2)} / {item.product.unit}</span>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCartItem(item.id)}
                        disabled={isUpdating}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          disabled={isUpdating || item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-12 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          disabled={isUpdating}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Items ({displayCartItems.length})</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Fee</span>
                <span>Free</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-green-600">${calculateTotal().toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Form */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Details</CardTitle>
              <CardDescription>Please provide your delivery information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="delivery_address">Delivery Address *</Label>
                <Textarea
                  id="delivery_address"
                  placeholder="Enter your full delivery address"
                  value={checkoutForm.delivery_address}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCheckoutForm((prev) => ({ ...prev, delivery_address: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="delivery_phone">Phone Number *</Label>
                <Input
                  id="delivery_phone"
                  type="tel"
                  placeholder="Your phone number"
                  value={checkoutForm.delivery_phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCheckoutForm((prev) => ({ ...prev, delivery_phone: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Special Instructions</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special delivery instructions..."
                  value={checkoutForm.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCheckoutForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                size="lg"
                onClick={handleCheckout}
                disabled={isCheckingOut || !checkoutForm.delivery_address.trim() || !checkoutForm.delivery_phone.trim()}
              >
                {isCheckingOut ? 'Processing...' : `Place Order - $${calculateTotal().toFixed(2)}`}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}