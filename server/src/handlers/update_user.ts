import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUser = async (input: UpdateUserInput): Promise<User> => {
  try {
    // Build the update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date()
    };

    if (input.email !== undefined) {
      updateData['email'] = input.email;
    }

    if (input.full_name !== undefined) {
      updateData['full_name'] = input.full_name;
    }

    if (input.phone !== undefined) {
      updateData['phone'] = input.phone;
    }

    if (input.address !== undefined) {
      updateData['address'] = input.address;
    }

    // Update user record
    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
};