import { db } from '../db';
import { ordersTable, orderItemsTable, productsTable } from '../db/schema';
import { type GetUserOrdersInput, type OrderWithItems } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getUserOrders = async (input: GetUserOrdersInput): Promise<OrderWithItems[]> => {
  try {
    // Get all orders for the user, ordered by creation date (newest first)
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.user_id, input.user_id))
      .orderBy(desc(ordersTable.created_at))
      .execute();

    // Convert numeric fields for orders
    const ordersWithNumericFields = orders.map(order => ({
      ...order,
      total_amount: parseFloat(order.total_amount)
    }));

    // Get order items with product details for all orders
    const ordersWithItems: OrderWithItems[] = await Promise.all(
      ordersWithNumericFields.map(async (order) => {
        // Get order items with joined product details
        const orderItemsWithProducts = await db.select()
          .from(orderItemsTable)
          .innerJoin(productsTable, eq(orderItemsTable.product_id, productsTable.id))
          .where(eq(orderItemsTable.order_id, order.id))
          .execute();

        // Transform the joined results and convert numeric fields
        const items = orderItemsWithProducts.map(result => ({
          id: result.order_items.id,
          order_id: result.order_items.order_id,
          product_id: result.order_items.product_id,
          quantity: result.order_items.quantity,
          unit_price: parseFloat(result.order_items.unit_price),
          total_price: parseFloat(result.order_items.total_price),
          product: {
            ...result.products,
            price: parseFloat(result.products.price)
          }
        }));

        return {
          ...order,
          items
        };
      })
    );

    return ordersWithItems;
  } catch (error) {
    console.error('Failed to get user orders:', error);
    throw error;
  }
};