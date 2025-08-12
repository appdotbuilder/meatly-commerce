import { db } from '../db';
import { cartItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetUserCartInput } from '../schema';

export const clearCart = async (input: GetUserCartInput): Promise<{ success: boolean }> => {
  try {
    // Delete all cart items for the specified user
    await db.delete(cartItemsTable)
      .where(eq(cartItemsTable.user_id, input.user_id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Clear cart failed:', error);
    throw error;
  }
};