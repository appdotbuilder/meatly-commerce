import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, cartItemsTable } from '../db/schema';
import { type AddToCartInput } from '../schema';
import { addToCart } from '../handlers/add_to_cart';
import { eq, and } from 'drizzle-orm';

describe('addToCart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data
  let testUserId: number;
  let testProductId: number;
  let unavailableProductId: number;

  beforeEach(async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '123-456-7890',
        address: '123 Test St'
      })
      .returning()
      .execute();
    testUserId = user[0].id;

    // Create test product (available)
    const product = await db.insert(productsTable)
      .values({
        name: 'Test Chicken',
        description: 'Fresh chicken for testing',
        category: 'chicken',
        price: '15.99',
        unit: 'kg',
        stock_quantity: 100,
        is_available: true
      })
      .returning()
      .execute();
    testProductId = product[0].id;

    // Create unavailable product
    const unavailableProduct = await db.insert(productsTable)
      .values({
        name: 'Unavailable Fish',
        description: 'Out of stock fish',
        category: 'fish',
        price: '20.99',
        unit: 'kg',
        stock_quantity: 0,
        is_available: false
      })
      .returning()
      .execute();
    unavailableProductId = unavailableProduct[0].id;
  });

  it('should add new item to cart', async () => {
    const input: AddToCartInput = {
      user_id: testUserId,
      product_id: testProductId,
      quantity: 2
    };

    const result = await addToCart(input);

    // Verify returned cart item
    expect(result.user_id).toEqual(testUserId);
    expect(result.product_id).toEqual(testProductId);
    expect(result.quantity).toEqual(2);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save cart item to database', async () => {
    const input: AddToCartInput = {
      user_id: testUserId,
      product_id: testProductId,
      quantity: 3
    };

    const result = await addToCart(input);

    // Query database to verify item was saved
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, result.id))
      .execute();

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].user_id).toEqual(testUserId);
    expect(cartItems[0].product_id).toEqual(testProductId);
    expect(cartItems[0].quantity).toEqual(3);
  });

  it('should update quantity when item already exists in cart', async () => {
    // First add item to cart
    const initialInput: AddToCartInput = {
      user_id: testUserId,
      product_id: testProductId,
      quantity: 2
    };

    await addToCart(initialInput);

    // Add the same product again
    const additionalInput: AddToCartInput = {
      user_id: testUserId,
      product_id: testProductId,
      quantity: 3
    };

    const result = await addToCart(additionalInput);

    // Should have updated quantity (2 + 3 = 5)
    expect(result.quantity).toEqual(5);
    expect(result.user_id).toEqual(testUserId);
    expect(result.product_id).toEqual(testProductId);

    // Verify only one cart item exists for this user-product combination
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.user_id, testUserId),
          eq(cartItemsTable.product_id, testProductId)
        )
      )
      .execute();

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].quantity).toEqual(5);
  });

  it('should throw error when user does not exist', async () => {
    const input: AddToCartInput = {
      user_id: 99999, // Non-existent user ID
      product_id: testProductId,
      quantity: 1
    };

    await expect(addToCart(input)).rejects.toThrow(/user with id 99999 not found/i);
  });

  it('should throw error when product does not exist', async () => {
    const input: AddToCartInput = {
      user_id: testUserId,
      product_id: 99999, // Non-existent product ID
      quantity: 1
    };

    await expect(addToCart(input)).rejects.toThrow(/product with id 99999 not found/i);
  });

  it('should throw error when product is not available', async () => {
    const input: AddToCartInput = {
      user_id: testUserId,
      product_id: unavailableProductId,
      quantity: 1
    };

    await expect(addToCart(input)).rejects.toThrow(/product with id .+ is not available/i);
  });

  it('should handle multiple users adding same product', async () => {
    // Create second user
    const secondUser = await db.insert(usersTable)
      .values({
        email: 'test2@example.com',
        full_name: 'Test User 2',
        phone: '987-654-3210',
        address: '456 Test Ave'
      })
      .returning()
      .execute();

    const secondUserId = secondUser[0].id;

    // Both users add same product
    const input1: AddToCartInput = {
      user_id: testUserId,
      product_id: testProductId,
      quantity: 2
    };

    const input2: AddToCartInput = {
      user_id: secondUserId,
      product_id: testProductId,
      quantity: 3
    };

    const result1 = await addToCart(input1);
    const result2 = await addToCart(input2);

    // Both should succeed with different cart items
    expect(result1.user_id).toEqual(testUserId);
    expect(result1.quantity).toEqual(2);
    expect(result2.user_id).toEqual(secondUserId);
    expect(result2.quantity).toEqual(3);

    // Verify both items exist in database
    const allCartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.product_id, testProductId))
      .execute();

    expect(allCartItems).toHaveLength(2);
  });

  it('should update updated_at timestamp when updating existing item', async () => {
    // Add initial item
    const initialInput: AddToCartInput = {
      user_id: testUserId,
      product_id: testProductId,
      quantity: 1
    };

    const initialResult = await addToCart(initialInput);
    const initialUpdatedAt = initialResult.updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Add same product again
    const additionalInput: AddToCartInput = {
      user_id: testUserId,
      product_id: testProductId,
      quantity: 1
    };

    const updatedResult = await addToCart(additionalInput);

    // Updated timestamp should be newer
    expect(updatedResult.updated_at.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    expect(updatedResult.quantity).toEqual(2);
  });
});