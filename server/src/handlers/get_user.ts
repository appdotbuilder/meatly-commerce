import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type User } from '../schema';

export const getUser = async (id: number): Promise<User | null> => {
  try {
    // Query the user by ID
    const result = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .execute();

    // Return null if user not found
    if (result.length === 0) {
      return null;
    }

    // Return the user (no numeric field conversions needed for users table)
    return result[0];
  } catch (error) {
    console.error('User retrieval failed:', error);
    throw error;
  }
};