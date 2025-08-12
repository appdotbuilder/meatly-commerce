import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Phone, Truck, CheckCircle, Package, User } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { OrderWithItems, Delivery, DeliveryStatus } from '../../../server/src/schema';

interface DeliveryTrackingProps {
  userId: number;
  orders: OrderWithItems[];
}

const deliveryStatusIcons = {
  pending: Clock,
  assigned: User,
  picked_up: Package,
  in_transit: Truck,
  delivered: CheckCircle
};

const deliveryStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-orange-100 text-orange-800',
  in_transit: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800'
};

const deliveryStatusLabels = {
  pending: 'Pending Assignment',
  assigned: 'Driver Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered'
};

const getProgressPercentage = (status: DeliveryStatus): number => {
  const statusProgress = {
    pending: 20,
    assigned: 40,
    picked_up: 60,
    in_transit: 80,
    delivered: 100
  };
  return statusProgress[status];
};

export default function DeliveryTracking({ userId, orders }: DeliveryTrackingProps) {
  const [deliveries, setDeliveries] = useState<Record<number, Delivery>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Filter orders that can be tracked (confirmed, preparing, out_for_delivery)
  const trackableOrders = orders.filter(order => 
    ['confirmed', 'preparing', 'out_for_delivery', 'delivered'].includes(order.status)
  );

  // STUB: Create mock delivery data if no orders exist
  const mockDeliveries: Record<number, Delivery> = trackableOrders.length === 0 ? {
    1: {
      id: 1,
      order_id: 1,
      status: 'in_transit' as DeliveryStatus,
      estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
      actual_delivery_time: null,
      delivery_person_name: 'Mike Johnson',
      delivery_person_phone: '+1-555-987-6543',
      tracking_notes: 'Driver is on the way. Expected delivery in 10-15 minutes.',
      created_at: new Date(Date.now() - 30 * 60 * 1000),
      updated_at: new Date(Date.now() - 5 * 60 * 1000)
    },
    2: {
      id: 2,
      order_id: 2,
      status: 'delivered' as DeliveryStatus,
      estimated_delivery_time: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      actual_delivery_time: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000),
      delivery_person_name: 'Sarah Davis',
      delivery_person_phone: '+1-555-456-7890',
      tracking_notes: 'Successfully delivered to the customer.',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000)
    }
  } : deliveries;

  // Mock trackable orders if none exist
  const mockTrackableOrders = trackableOrders.length === 0 ? [
    {
      id: 1,
      user_id: userId,
      total_amount: 50.97,
      status: 'out_for_delivery' as const,
      delivery_address: '123 Main Street, Apartment 4B, New York, NY 10001',
      delivery_phone: '+1-555-123-4567',
      notes: 'Please ring the doorbell twice',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 30 * 60 * 1000),
      items: []
    },
    {
      id: 2,
      user_id: userId,
      total_amount: 32.99,
      status: 'delivered' as const,
      delivery_address: '123 Main Street, Apartment 4B, New York, NY 10001',
      delivery_phone: '+1-555-123-4567',
      notes: null,
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      items: []
    }
  ] : trackableOrders;

  const loadDeliveryData = useCallback(async () => {
    if (mockTrackableOrders.length === 0) return;

    setIsLoading(true);
    
    // Use mock data for demo
    setDeliveries(mockDeliveries);
    
    // Optional: Try to fetch real delivery data
    try {
      const deliveryPromises = mockTrackableOrders.map(async (order) => {
        try {
          const delivery = await trpc.getDeliveryByOrder.query({ order_id: order.id });
          return { orderId: order.id, delivery };
        } catch (error) {
          return null;
        }
      });

      const deliveryResults = await Promise.all(deliveryPromises);
      const deliveryMap: Record<number, Delivery> = {};

      deliveryResults.forEach((result) => {
        if (result && result.delivery) {
          deliveryMap[result.orderId] = result.delivery;
        }
      });

      if (Object.keys(deliveryMap).length > 0) {
        setDeliveries(deliveryMap);
      }
    } catch (error) {
      console.log('Backend not available, using demo delivery data');
    }
    
    setIsLoading(false);
  }, [mockTrackableOrders, mockDeliveries]);

  useEffect(() => {
    loadDeliveryData();
  }, [loadDeliveryData]);

  const displayOrders = mockTrackableOrders.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  const displayDeliveries = Object.keys(deliveries).length > 0 ? deliveries : mockDeliveries;

  if (displayOrders.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">🚚 Delivery Tracking</h2>
        
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No active deliveries</h3>
            <p className="text-gray-500">Your delivery tracking information will appear here once you have active orders.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">🚚 Delivery Tracking</h2>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-600">Loading delivery information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">🚚 Delivery Tracking</h2>
      
      <div className="space-y-6">
        {displayOrders.map((order) => {
          const delivery = displayDeliveries[order.id];
          
          if (!delivery) {
            return (
              <Card key={order.id}>
                <CardHeader>
                  <CardTitle>Order #{order.id}</CardTitle>
                  <CardDescription>Delivery information not available yet</CardDescription>
                </CardHeader>
              </Card>
            );
          }

          const StatusIcon = deliveryStatusIcons[delivery.status];
          const progressPercentage = getProgressPercentage(delivery.status);

          return (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-3">
                      <span>Order #{order.id}</span>
                      <Badge className={`${deliveryStatusColors[delivery.status]} border-0`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {deliveryStatusLabels[delivery.status]}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Total: ${order.total_amount.toFixed(2)} • Ordered {order.created_at.toLocaleString()}
                    </CardDescription>
                  </div>
                  
                  {delivery.estimated_delivery_time && delivery.status !== 'delivered' && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        ETA: {delivery.estimated_delivery_time.toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {delivery.estimated_delivery_time.toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {delivery.actual_delivery_time && delivery.status === 'delivered' && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        Delivered at {delivery.actual_delivery_time.toLocaleTimeString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {delivery.actual_delivery_time.toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Progress</span>
                    <span className="font-medium">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Order Confirmed</span>
                    <span>Delivered</span>
                  </div>
                </div>

                <Separator />

                {/* Status Timeline */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-700">Delivery Status</h4>
                  <div className="space-y-2">
                    {(['pending', 'assigned', 'picked_up', 'in_transit', 'delivered'] as DeliveryStatus[]).map((status) => {
                      const StepIcon = deliveryStatusIcons[status];
                      const isActive = status === delivery.status;
                      const isCompleted = getProgressPercentage(status) <= progressPercentage && status !== delivery.status;
                      
                      return (
                        <div
                          key={status}
                          className={`flex items-center space-x-3 p-2 rounded-md ${
                            isActive ? 'bg-blue-50 border border-blue-200' : 
                            isCompleted ? 'bg-green-50' : 'bg-gray-50'
                          }`}
                        >
                          <StepIcon
                            className={`h-4 w-4 ${
                              isActive ? 'text-blue-600' :
                              isCompleted ? 'text-green-600' : 'text-gray-400'
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              isActive ? 'text-blue-800' :
                              isCompleted ? 'text-green-700' : 'text-gray-500'
                            }`}
                          >
                            {deliveryStatusLabels[status]}
                          </span>
                          {isActive && (
                            <Badge className="ml-auto bg-blue-600 text-xs">
                              Current
                            </Badge>
                          )}
                          {isCompleted && (
                            <CheckCircle className="h-3 w-3 text-green-600 ml-auto" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Delivery Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">Delivery Address</h4>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700">{order.delivery_address}</p>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-700">{order.delivery_phone}</p>
                      </div>
                    </div>
                  </div>

                  {delivery.delivery_person_name && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-gray-700">Delivery Person</h4>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <p className="text-sm font-medium text-gray-700">{delivery.delivery_person_name}</p>
                        </div>
                        {delivery.delivery_person_phone && (
                          <div className="flex items-center space-x-2 mt-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <p className="text-sm text-gray-700">{delivery.delivery_person_phone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tracking Notes */}
                {delivery.tracking_notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">Latest Update</h4>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                      <p className="text-sm text-blue-800">{delivery.tracking_notes}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Updated {delivery.updated_at.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Special Instructions */}
                {order.notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">Special Instructions</h4>
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                      <p className="text-sm text-yellow-800">{order.notes}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <p className="text-xs text-gray-500">
                    Last updated: {delivery.updated_at.toLocaleString()}
                  </p>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadDeliveryData()}
                  >
                    Refresh Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}