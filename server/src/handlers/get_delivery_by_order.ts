import { db } from '../db';
import { deliveriesTable } from '../db/schema';
import { type GetDeliveryByOrderInput, type Delivery } from '../schema';
import { eq } from 'drizzle-orm';

export const getDeliveryByOrder = async (input: GetDeliveryByOrderInput): Promise<Delivery | null> => {
  try {
    const result = await db.select()
      .from(deliveriesTable)
      .where(eq(deliveriesTable.order_id, input.order_id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const delivery = result[0];
    return delivery;
  } catch (error) {
    console.error('Failed to fetch delivery by order:', error);
    throw error;
  }
};