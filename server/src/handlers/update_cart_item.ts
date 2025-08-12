import { db } from '../db';
import { cartItemsTable } from '../db/schema';
import { type UpdateCartItemInput, type CartItem } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const updateCartItem = async (input: UpdateCartItemInput): Promise<CartItem> => {
  try {
    // Update the cart item quantity and set updated_at timestamp
    const result = await db.update(cartItemsTable)
      .set({
        quantity: input.quantity,
        updated_at: sql`NOW()` // Use SQL NOW() function to get current timestamp
      })
      .where(eq(cartItemsTable.id, input.id))
      .returning()
      .execute();

    // Check if cart item was found and updated
    if (result.length === 0) {
      throw new Error(`Cart item with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Cart item update failed:', error);
    throw error;
  }
};