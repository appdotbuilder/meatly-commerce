import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateUserInput } from '../schema';
import { getUser } from '../handlers/get_user';

describe('getUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve an existing user by ID', async () => {
    // Create a test user first
    const testUser: CreateUserInput = {
      email: 'test@example.com',
      full_name: 'Test User',
      phone: '+1234567890',
      address: '123 Test Street'
    };

    const createResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const createdUser = createResult[0];

    // Retrieve the user using the handler
    const result = await getUser(createdUser.id);

    // Verify all fields are returned correctly
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.email).toEqual('test@example.com');
    expect(result!.full_name).toEqual('Test User');
    expect(result!.phone).toEqual('+1234567890');
    expect(result!.address).toEqual('123 Test Street');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should retrieve user with nullable fields as null', async () => {
    // Create a user with minimal required fields (phone and address are optional)
    const testUser: CreateUserInput = {
      email: 'minimal@example.com',
      full_name: 'Minimal User'
      // phone and address are optional and will be null
    };

    const createResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const createdUser = createResult[0];

    // Retrieve the user
    const result = await getUser(createdUser.id);

    // Verify nullable fields are null
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.email).toEqual('minimal@example.com');
    expect(result!.full_name).toEqual('Minimal User');
    expect(result!.phone).toBeNull();
    expect(result!.address).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent user ID', async () => {
    const result = await getUser(99999);

    expect(result).toBeNull();
  });

  it('should retrieve correct user when multiple users exist', async () => {
    // Create multiple test users
    const users: CreateUserInput[] = [
      {
        email: 'user1@example.com',
        full_name: 'User One',
        phone: '+1111111111',
        address: '111 First Street'
      },
      {
        email: 'user2@example.com',
        full_name: 'User Two',
        phone: '+2222222222',
        address: '222 Second Street'
      },
      {
        email: 'user3@example.com',
        full_name: 'User Three'
        // phone and address omitted
      }
    ];

    const createdUsers = [];
    for (const user of users) {
      const result = await db.insert(usersTable)
        .values(user)
        .returning()
        .execute();
      createdUsers.push(result[0]);
    }

    // Retrieve the second user specifically
    const result = await getUser(createdUsers[1].id);

    // Verify we got the correct user
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdUsers[1].id);
    expect(result!.email).toEqual('user2@example.com');
    expect(result!.full_name).toEqual('User Two');
    expect(result!.phone).toEqual('+2222222222');
    expect(result!.address).toEqual('222 Second Street');

    // Also verify we can retrieve the user with null fields
    const resultWithNulls = await getUser(createdUsers[2].id);
    expect(resultWithNulls).not.toBeNull();
    expect(resultWithNulls!.email).toEqual('user3@example.com');
    expect(resultWithNulls!.phone).toBeNull();
    expect(resultWithNulls!.address).toBeNull();
  });

  it('should handle database query correctly', async () => {
    // Create a user
    const testUser: CreateUserInput = {
      email: 'db-test@example.com',
      full_name: 'Database Test User',
      phone: '+9999999999',
      address: '999 Database Street'
    };

    const createResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const createdUserId = createResult[0].id;

    // Use the handler to retrieve the user
    const handlerResult = await getUser(createdUserId);

    // Verify by querying the database directly as well
    const directResult = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, createdUserId))
      .execute();

    // Both should return the same data
    expect(handlerResult).not.toBeNull();
    expect(directResult).toHaveLength(1);
    expect(handlerResult!.id).toEqual(directResult[0].id);
    expect(handlerResult!.email).toEqual(directResult[0].email);
    expect(handlerResult!.full_name).toEqual(directResult[0].full_name);
  });
});