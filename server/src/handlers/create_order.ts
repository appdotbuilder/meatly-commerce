import { db } from '../db';
import { cartItemsTable, ordersTable, orderItemsTable, productsTable } from '../db/schema';
import { type CreateOrderInput, type OrderWithItems } from '../schema';
import { eq } from 'drizzle-orm';

export const createOrder = async (input: CreateOrderInput): Promise<OrderWithItems> => {
  try {
    // Get user's cart items with product details
    const cartItems = await db.select({
      id: cartItemsTable.id,
      quantity: cartItemsTable.quantity,
      product: {
        id: productsTable.id,
        name: productsTable.name,
        description: productsTable.description,
        category: productsTable.category,
        price: productsTable.price,
        unit: productsTable.unit,
        stock_quantity: productsTable.stock_quantity,
        image_url: productsTable.image_url,
        is_available: productsTable.is_available,
        created_at: productsTable.created_at,
        updated_at: productsTable.updated_at
      }
    })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.product_id, productsTable.id))
    .where(eq(cartItemsTable.user_id, input.user_id))
    .execute();

    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const item of cartItems) {
      const unitPrice = parseFloat(item.product.price);
      totalAmount += unitPrice * item.quantity;
    }

    // Create the order
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: input.user_id,
        total_amount: totalAmount.toString(),
        delivery_address: input.delivery_address,
        delivery_phone: input.delivery_phone,
        notes: input.notes || null
      })
      .returning()
      .execute();

    const order = orderResult[0];

    // Create order items
    const orderItemsData = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.product.price, // Keep as string for insertion
      total_price: (parseFloat(item.product.price) * item.quantity).toString()
    }));

    const orderItemsResult = await db.insert(orderItemsTable)
      .values(orderItemsData)
      .returning()
      .execute();

    // Clear the user's cart
    await db.delete(cartItemsTable)
      .where(eq(cartItemsTable.user_id, input.user_id))
      .execute();

    // Build the response with proper numeric conversions
    const orderWithItems: OrderWithItems = {
      id: order.id,
      user_id: order.user_id,
      total_amount: parseFloat(order.total_amount),
      status: order.status,
      delivery_address: order.delivery_address,
      delivery_phone: order.delivery_phone,
      notes: order.notes,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items: orderItemsResult.map((orderItem, index) => ({
        id: orderItem.id,
        order_id: orderItem.order_id,
        product_id: orderItem.product_id,
        quantity: orderItem.quantity,
        unit_price: parseFloat(orderItem.unit_price),
        total_price: parseFloat(orderItem.total_price),
        product: {
          id: cartItems[index].product.id,
          name: cartItems[index].product.name,
          description: cartItems[index].product.description,
          category: cartItems[index].product.category,
          price: parseFloat(cartItems[index].product.price),
          unit: cartItems[index].product.unit,
          stock_quantity: cartItems[index].product.stock_quantity,
          image_url: cartItems[index].product.image_url,
          is_available: cartItems[index].product.is_available,
          created_at: cartItems[index].product.created_at,
          updated_at: cartItems[index].product.updated_at
        }
      }))
    };

    return orderWithItems;
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
};