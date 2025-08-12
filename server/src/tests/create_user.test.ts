import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInputComplete: CreateUserInput = {
  email: 'test@example.com',
  full_name: 'Test User',
  phone: '+1234567890',
  address: '123 Test Street, Test City'
};

// Test input with only required fields
const testInputMinimal: CreateUserInput = {
  email: 'minimal@example.com',
  full_name: 'Minimal User'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with all fields', async () => {
    const result = await createUser(testInputComplete);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.full_name).toEqual('Test User');
    expect(result.phone).toEqual('+1234567890');
    expect(result.address).toEqual('123 Test Street, Test City');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a user with only required fields', async () => {
    const result = await createUser(testInputMinimal);

    // Basic field validation
    expect(result.email).toEqual('minimal@example.com');
    expect(result.full_name).toEqual('Minimal User');
    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInputComplete);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].full_name).toEqual('Test User');
    expect(users[0].phone).toEqual('+1234567890');
    expect(users[0].address).toEqual('123 Test Street, Test City');
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle optional fields correctly', async () => {
    const inputWithUndefined: CreateUserInput = {
      email: 'optional@example.com',
      full_name: 'Optional User',
      phone: undefined,
      address: undefined
    };

    const result = await createUser(inputWithUndefined);

    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();

    // Verify in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users[0].phone).toBeNull();
    expect(users[0].address).toBeNull();
  });

  it('should enforce email uniqueness', async () => {
    // Create first user
    await createUser(testInputComplete);

    // Try to create another user with same email
    const duplicateInput: CreateUserInput = {
      email: 'test@example.com', // Same email
      full_name: 'Another User'
    };

    await expect(createUser(duplicateInput))
      .rejects.toThrow(/unique constraint|duplicate key/i);
  });

  it('should create multiple users with different emails', async () => {
    const user1 = await createUser({
      email: 'user1@example.com',
      full_name: 'User One'
    });

    const user2 = await createUser({
      email: 'user2@example.com',
      full_name: 'User Two'
    });

    expect(user1.id).not.toEqual(user2.id);
    expect(user1.email).toEqual('user1@example.com');
    expect(user2.email).toEqual('user2@example.com');

    // Verify both exist in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });

  it('should set timestamps correctly', async () => {
    const beforeCreate = new Date();
    const result = await createUser(testInputComplete);
    const afterCreate = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });
});