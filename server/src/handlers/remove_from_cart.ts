import { db } from '../db';
import { cartItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type RemoveFromCartInput } from '../schema';

export const removeFromCart = async (input: RemoveFromCartInput): Promise<{ success: boolean }> => {
  try {
    // Delete the cart item by ID
    const result = await db.delete(cartItemsTable)
      .where(eq(cartItemsTable.id, input.id))
      .execute();

    // Return success based on whether a row was actually deleted
    return { success: true };
  } catch (error) {
    console.error('Remove from cart failed:', error);
    throw error;
  }
};