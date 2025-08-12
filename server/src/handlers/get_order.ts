import { db } from '../db';
import { ordersTable, orderItemsTable, productsTable } from '../db/schema';
import { type GetOrderInput, type OrderWithItems } from '../schema';
import { eq } from 'drizzle-orm';

export const getOrder = async (input: GetOrderInput): Promise<OrderWithItems | null> => {
  try {
    // First, get the order by ID
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, input.id))
      .execute();

    if (orders.length === 0) {
      return null;
    }

    const order = orders[0];

    // Get order items with product details
    const orderItems = await db.select()
      .from(orderItemsTable)
      .innerJoin(productsTable, eq(orderItemsTable.product_id, productsTable.id))
      .where(eq(orderItemsTable.order_id, input.id))
      .execute();

    // Transform the order items to match the expected structure
    const items = orderItems.map(item => ({
      id: item.order_items.id,
      order_id: item.order_items.order_id,
      product_id: item.order_items.product_id,
      quantity: item.order_items.quantity,
      unit_price: parseFloat(item.order_items.unit_price), // Convert numeric to number
      total_price: parseFloat(item.order_items.total_price), // Convert numeric to number
      product: {
        ...item.products,
        price: parseFloat(item.products.price) // Convert numeric to number
      }
    }));

    // Return the complete order with items
    return {
      id: order.id,
      user_id: order.user_id,
      total_amount: parseFloat(order.total_amount), // Convert numeric to number
      status: order.status,
      delivery_address: order.delivery_address,
      delivery_phone: order.delivery_phone,
      notes: order.notes,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items
    };
  } catch (error) {
    console.error('Get order failed:', error);
    throw error;
  }
};