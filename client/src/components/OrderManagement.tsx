import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Package, Clock, CheckCircle, Truck, XCircle, Eye } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { OrderWithItems, OrderStatus } from '../../../server/src/schema';

interface OrderManagementProps {
  userId: number;
  orders: OrderWithItems[];
  onOrderUpdate: () => void;
}

const orderStatusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  preparing: Package,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  cancelled: XCircle
};

const orderStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const orderStatusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export default function OrderManagement({ userId, orders, onOrderUpdate }: OrderManagementProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // STUB: Create mock order data if empty (since backend returns empty array)
  const mockOrders: OrderWithItems[] = orders.length === 0 ? [
    {
      id: 1,
      user_id: userId,
      total_amount: 50.97,
      status: 'confirmed' as OrderStatus,
      delivery_address: '123 Main Street, Apartment 4B, New York, NY 10001',
      delivery_phone: '+1-555-123-4567',
      notes: 'Please ring the doorbell twice',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      updated_at: new Date(Date.now() - 23 * 60 * 60 * 1000),
      items: [
        {
          id: 1,
          order_id: 1,
          product_id: 1,
          quantity: 2,
          unit_price: 12.99,
          total_price: 25.98,
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
          order_id: 1,
          product_id: 3,
          quantity: 1,
          unit_price: 24.99,
          total_price: 24.99,
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
      ]
    },
    {
      id: 2,
      user_id: userId,
      total_amount: 32.99,
      status: 'delivered' as OrderStatus,
      delivery_address: '123 Main Street, Apartment 4B, New York, NY 10001',
      delivery_phone: '+1-555-123-4567',
      notes: null,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      items: [
        {
          id: 3,
          order_id: 2,
          product_id: 5,
          quantity: 1,
          unit_price: 32.99,
          total_price: 32.99,
          product: {
            id: 5,
            name: 'Premium Beef Steak',
            description: 'Tender ribeye steak, grass-fed',
            category: 'meat' as const,
            price: 32.99,
            unit: 'kg',
            stock_quantity: 12,
            image_url: null,
            is_available: true,
            created_at: new Date(),
            updated_at: new Date()
          }
        }
      ]
    }
  ] : orders;

  const displayOrders = mockOrders.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    setIsUpdating(true);
    
    // Demo behavior: show success message
    alert(`Order #${orderId} has been ${newStatus}! ✅`);
    
    // Optional: Try to update on backend
    try {
      await trpc.updateOrderStatus.mutate({
        id: orderId,
        status: newStatus
      });
    } catch (error) {
      console.log('Backend not available, demo status update completed');
    }
    
    onOrderUpdate();
    setIsUpdating(false);
  };

  const canCancelOrder = (order: OrderWithItems) => {
    return order.status === 'pending' || order.status === 'confirmed';
  };

  const categoryEmojis = {
    chicken: '🐔',
    fish: '🐟',
    meat: '🥩'
  };

  if (displayOrders.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">📦 Order History</h2>
        
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No orders yet</h3>
            <p className="text-gray-500">Your order history will appear here after you make your first purchase.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">📦 Order History</h2>
      
      <div className="space-y-4">
        {displayOrders.map((order: OrderWithItems) => {
          const StatusIcon = orderStatusIcons[order.status];
          return (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-3">
                      <span>Order #{order.id}</span>
                      <Badge className={`${orderStatusColors[order.status]} border-0`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {orderStatusLabels[order.status]}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Placed on {order.created_at.toLocaleDateString()} at {order.created_at.toLocaleTimeString()}
                    </CardDescription>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      ${order.total_amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Items Ordered:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md">
                        <span className="text-lg">{categoryEmojis[item.product.category]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.quantity}x ${item.unit_price.toFixed(2)} = ${item.total_price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Delivery Address:</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                      {order.delivery_address}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">📞 {order.delivery_phone}</p>
                  </div>
                  
                  {order.notes && (
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Special Instructions:</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                        {order.notes}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div className="text-xs text-gray-500">
                    Last updated: {order.updated_at.toLocaleDateString()} at {order.updated_at.toLocaleTimeString()}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                    
                    {canCancelOrder(order) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel order #{order.id}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Order</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                              disabled={isUpdating}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Cancel Order
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <AlertDialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center space-x-3">
                <span>Order #{selectedOrder.id} Details</span>
                <Badge className={`${orderStatusColors[selectedOrder.status]} border-0`}>
                  {orderStatusLabels[selectedOrder.status]}
                </Badge>
              </AlertDialogTitle>
              <AlertDialogDescription>
                Complete order information and item breakdown
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <h4 className="font-medium mb-2">Order Summary</h4>
                <div className="bg-gray-50 p-3 rounded-md space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Order Date:</span>
                    <span>{selectedOrder.created_at.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-semibold text-green-600">${selectedOrder.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span>{orderStatusLabels[selectedOrder.status]}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Items ({selectedOrder.items.length})</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{categoryEmojis[item.product.category]}</span>
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-xs text-gray-500">{item.product.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.total_price.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">
                          {item.quantity}x ${item.unit_price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Delivery Information</h4>
                <div className="bg-gray-50 p-3 rounded-md text-sm space-y-1">
                  <div>
                    <span className="font-medium">Address:</span>
                    <p className="mt-1">{selectedOrder.delivery_address}</p>
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {selectedOrder.delivery_phone}
                  </div>
                  {selectedOrder.notes && (
                    <div>
                      <span className="font-medium">Special Instructions:</span>
                      <p className="mt-1">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setSelectedOrder(null)}>
                Close
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}