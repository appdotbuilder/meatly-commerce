import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, cartItemsTable } from '../db/schema';
import { type UpdateCartItemInput } from '../schema';
import { updateCartItem } from '../handlers/update_cart_item';
import { eq } from 'drizzle-orm';

describe('updateCartItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testProductId: number;
  let testCartItemId: number;

  const createTestData = async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '1234567890',
        address: '123 Test St'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        category: 'chicken',
        price: '19.99',
        unit: 'kg',
        stock_quantity: 100,
        is_available: true
      })
      .returning()
      .execute();
    testProductId = productResult[0].id;

    // Create test cart item
    const cartItemResult = await db.insert(cartItemsTable)
      .values({
        user_id: testUserId,
        product_id: testProductId,
        quantity: 2
      })
      .returning()
      .execute();
    testCartItemId = cartItemResult[0].id;
  };

  it('should update cart item quantity successfully', async () => {
    await createTestData();

    const input: UpdateCartItemInput = {
      id: testCartItemId,
      quantity: 5
    };

    const result = await updateCartItem(input);

    // Verify returned cart item
    expect(result.id).toEqual(testCartItemId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.product_id).toEqual(testProductId);
    expect(result.quantity).toEqual(5);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify updated_at is more recent than created_at
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(result.created_at.getTime());
  });

  it('should persist quantity change to database', async () => {
    await createTestData();

    const input: UpdateCartItemInput = {
      id: testCartItemId,
      quantity: 3
    };

    await updateCartItem(input);

    // Verify in database
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, testCartItemId))
      .execute();

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].quantity).toEqual(3);
    expect(cartItems[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update quantity to minimum allowed value', async () => {
    await createTestData();

    const input: UpdateCartItemInput = {
      id: testCartItemId,
      quantity: 1 // Minimum positive quantity
    };

    const result = await updateCartItem(input);

    expect(result.quantity).toEqual(1);

    // Verify in database
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, testCartItemId))
      .execute();

    expect(cartItems[0].quantity).toEqual(1);
  });

  it('should update quantity to large value', async () => {
    await createTestData();

    const input: UpdateCartItemInput = {
      id: testCartItemId,
      quantity: 100
    };

    const result = await updateCartItem(input);

    expect(result.quantity).toEqual(100);

    // Verify in database
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, testCartItemId))
      .execute();

    expect(cartItems[0].quantity).toEqual(100);
  });

  it('should throw error when cart item does not exist', async () => {
    const input: UpdateCartItemInput = {
      id: 99999, // Non-existent cart item ID
      quantity: 5
    };

    await expect(updateCartItem(input))
      .rejects
      .toThrow(/cart item with id 99999 not found/i);
  });

  it('should preserve other cart item fields when updating quantity', async () => {
    await createTestData();

    // Get original cart item
    const original = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, testCartItemId))
      .execute();

    const input: UpdateCartItemInput = {
      id: testCartItemId,
      quantity: 7
    };

    const result = await updateCartItem(input);

    // Verify that only quantity and updated_at changed
    expect(result.id).toEqual(original[0].id);
    expect(result.user_id).toEqual(original[0].user_id);
    expect(result.product_id).toEqual(original[0].product_id);
    expect(result.created_at.getTime()).toEqual(original[0].created_at.getTime());
    
    // Only these should have changed
    expect(result.quantity).toEqual(7);
    expect(result.updated_at.getTime()).toBeGreaterThan(original[0].updated_at.getTime());
  });
});