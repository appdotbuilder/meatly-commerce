import { db } from '../db';
import { cartItemsTable, productsTable } from '../db/schema';
import { type GetUserCartInput, type CartItemWithProduct } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserCart = async (input: GetUserCartInput): Promise<CartItemWithProduct[]> => {
  try {
    // Query cart items with joined product details
    const results = await db.select()
      .from(cartItemsTable)
      .innerJoin(productsTable, eq(cartItemsTable.product_id, productsTable.id))
      .where(eq(cartItemsTable.user_id, input.user_id))
      .execute();

    // Transform the joined results to match CartItemWithProduct schema
    return results.map(result => ({
      id: result.cart_items.id,
      user_id: result.cart_items.user_id,
      product_id: result.cart_items.product_id,
      quantity: result.cart_items.quantity,
      created_at: result.cart_items.created_at,
      updated_at: result.cart_items.updated_at,
      product: {
        id: result.products.id,
        name: result.products.name,
        description: result.products.description,
        category: result.products.category,
        price: parseFloat(result.products.price), // Convert numeric string to number
        unit: result.products.unit,
        stock_quantity: result.products.stock_quantity,
        image_url: result.products.image_url,
        is_available: result.products.is_available,
        created_at: result.products.created_at,
        updated_at: result.products.updated_at
      }
    }));
  } catch (error) {
    console.error('Failed to get user cart:', error);
    throw error;
  }
};