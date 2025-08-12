import { db } from '../db';
import { deliveriesTable, ordersTable } from '../db/schema';
import { type CreateDeliveryInput, type Delivery } from '../schema';
import { eq } from 'drizzle-orm';

export const createDelivery = async (input: CreateDeliveryInput): Promise<Delivery> => {
  try {
    // First, verify the order exists
    const existingOrder = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, input.order_id))
      .execute();

    if (existingOrder.length === 0) {
      throw new Error(`Order with id ${input.order_id} does not exist`);
    }

    // Insert delivery record
    const result = await db.insert(deliveriesTable)
      .values({
        order_id: input.order_id,
        status: 'pending', // Default status
        estimated_delivery_time: input.estimated_delivery_time || null,
        delivery_person_name: input.delivery_person_name || null,
        delivery_person_phone: input.delivery_person_phone || null
      })
      .returning()
      .execute();

    const delivery = result[0];
    return delivery;
  } catch (error) {
    console.error('Delivery creation failed:', error);
    throw error;
  }
};