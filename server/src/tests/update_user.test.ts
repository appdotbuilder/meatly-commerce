import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type CreateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Helper function to create a test user
const createTestUser = async (userData: CreateUserInput) => {
  const result = await db.insert(usersTable)
    .values({
      email: userData.email,
      full_name: userData.full_name,
      phone: userData.phone || null,
      address: userData.address || null
    })
    .returning()
    .execute();
  
  return result[0];
};

const testUserData: CreateUserInput = {
  email: 'test@example.com',
  full_name: 'Test User',
  phone: '123-456-7890',
  address: '123 Test Street'
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all user fields', async () => {
    // Create a test user first
    const createdUser = await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      email: 'updated@example.com',
      full_name: 'Updated User',
      phone: '987-654-3210',
      address: '456 Updated Avenue'
    };

    const result = await updateUser(updateInput);

    // Verify all fields are updated
    expect(result.id).toEqual(createdUser.id);
    expect(result.email).toEqual('updated@example.com');
    expect(result.full_name).toEqual('Updated User');
    expect(result.phone).toEqual('987-654-3210');
    expect(result.address).toEqual('456 Updated Avenue');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdUser.updated_at).toBe(true);
  });

  it('should update only provided fields', async () => {
    // Create a test user first
    const createdUser = await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      email: 'partial@example.com',
      full_name: 'Partially Updated User'
      // phone and address not provided
    };

    const result = await updateUser(updateInput);

    // Verify only provided fields are updated
    expect(result.id).toEqual(createdUser.id);
    expect(result.email).toEqual('partial@example.com');
    expect(result.full_name).toEqual('Partially Updated User');
    expect(result.phone).toEqual(createdUser.phone); // Should remain unchanged
    expect(result.address).toEqual(createdUser.address); // Should remain unchanged
    expect(result.updated_at > createdUser.updated_at).toBe(true);
  });

  it('should handle nullable fields being set to null', async () => {
    // Create a test user with phone and address
    const createdUser = await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      phone: null,
      address: null
    };

    const result = await updateUser(updateInput);

    // Verify nullable fields are set to null
    expect(result.id).toEqual(createdUser.id);
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.email).toEqual(createdUser.email); // Should remain unchanged
    expect(result.full_name).toEqual(createdUser.full_name); // Should remain unchanged
  });

  it('should update user in database', async () => {
    // Create a test user first
    const createdUser = await createTestUser(testUserData);

    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      email: 'database@example.com',
      full_name: 'Database User'
    };

    await updateUser(updateInput);

    // Verify update was persisted in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, createdUser.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('database@example.com');
    expect(users[0].full_name).toEqual('Database User');
    expect(users[0].phone).toEqual(createdUser.phone); // Should remain unchanged
    expect(users[0].address).toEqual(createdUser.address); // Should remain unchanged
  });

  it('should throw error when user does not exist', async () => {
    const updateInput: UpdateUserInput = {
      id: 99999, // Non-existent ID
      email: 'nonexistent@example.com'
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/user.*not found/i);
  });

  it('should handle updating user with minimal data', async () => {
    // Create a user with minimal data (no phone or address)
    const minimalUserData: CreateUserInput = {
      email: 'minimal@example.com',
      full_name: 'Minimal User'
    };

    const createdUser = await createTestUser(minimalUserData);

    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      address: 'New Address Added'
    };

    const result = await updateUser(updateInput);

    // Verify the address was added while other fields remained unchanged
    expect(result.id).toEqual(createdUser.id);
    expect(result.email).toEqual('minimal@example.com');
    expect(result.full_name).toEqual('Minimal User');
    expect(result.phone).toBeNull(); // Should remain null
    expect(result.address).toEqual('New Address Added');
  });
});