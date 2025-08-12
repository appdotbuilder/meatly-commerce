import { db } from '../db';
import { deliveriesTable } from '../db/schema';
import { type UpdateDeliveryInput, type Delivery } from '../schema';
import { eq } from 'drizzle-orm';

export const updateDelivery = async (input: UpdateDeliveryInput): Promise<Delivery> => {
  try {
    // Build the update object with only provided fields
    const updateData: Partial<typeof deliveriesTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    if (input.estimated_delivery_time !== undefined) {
      updateData.estimated_delivery_time = input.estimated_delivery_time;
    }

    if (input.actual_delivery_time !== undefined) {
      updateData.actual_delivery_time = input.actual_delivery_time;
    }

    if (input.delivery_person_name !== undefined) {
      updateData.delivery_person_name = input.delivery_person_name;
    }

    if (input.delivery_person_phone !== undefined) {
      updateData.delivery_person_phone = input.delivery_person_phone;
    }

    if (input.tracking_notes !== undefined) {
      updateData.tracking_notes = input.tracking_notes;
    }

    // Update delivery record
    const result = await db.update(deliveriesTable)
      .set(updateData)
      .where(eq(deliveriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Delivery with id ${input.id} not found`);
    }

    const delivery = result[0];
    return delivery;
  } catch (error) {
    console.error('Delivery update failed:', error);
    throw error;
  }
};