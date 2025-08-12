import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { cartItemsTable, usersTable, productsTable } from '../db/schema';
import { type GetUserCartInput } from '../schema';
import { clearCart } from '../handlers/clear_cart';
import { eq } from 'drizzle-orm';

describe('clearCart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should clear all cart items for a user', async () => {
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

    const user = userResult[0];

    // Create test products
    const productResults = await db.insert(productsTable)
      .values([
        {
          name: 'Test Product 1',
          description: 'A test product',
          category: 'chicken',
          price: '19.99',
          unit: 'kg',
          stock_quantity: 100,
          is_available: true
        },
        {
          name: 'Test Product 2',
          description: 'Another test product',
          category: 'fish',
          price: '29.99',
          unit: 'piece',
          stock_quantity: 50,
          is_available: true
        }
      ])
      .returning()
      .execute();

    // Add items to cart
    await db.insert(cartItemsTable)
      .values([
        {
          user_id: user.id,
          product_id: productResults[0].id,
          quantity: 2
        },
        {
          user_id: user.id,
          product_id: productResults[1].id,
          quantity: 1
        }
      ])
      .execute();

    // Verify cart has items before clearing
    const cartBeforeClear = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.user_id, user.id))
      .execute();

    expect(cartBeforeClear).toHaveLength(2);

    // Test input
    const testInput: GetUserCartInput = {
      user_id: user.id
    };

    // Clear cart
    const result = await clearCart(testInput);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify cart is empty after clearing
    const cartAfterClear = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.user_id, user.id))
      .execute();

    expect(cartAfterClear).toHaveLength(0);
  });

  it('should handle empty cart gracefully', async () => {
    // Create test user with no cart items
    const userResult = await db.insert(usersTable)
      .values({
        email: 'empty@example.com',
        full_name: 'Empty Cart User',
        phone: '9876543210',
        address: '456 Empty St'
      })
      .returning()
      .execute();

    const user = userResult[0];

    const testInput: GetUserCartInput = {
      user_id: user.id
    };

    // Clear empty cart
    const result = await clearCart(testInput);

    // Should still return success
    expect(result.success).toBe(true);

    // Verify no cart items exist
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.user_id, user.id))
      .execute();

    expect(cartItems).toHaveLength(0);
  });

  it('should not affect other users\' cart items', async () => {
    // Create two test users
    const userResults = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          full_name: 'User One',
          phone: '1111111111',
          address: '111 First St'
        },
        {
          email: 'user2@example.com',
          full_name: 'User Two',
          phone: '2222222222',
          address: '222 Second St'
        }
      ])
      .returning()
      .execute();

    const [user1, user2] = userResults;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Shared Product',
        description: 'A product both users have',
        category: 'meat',
        price: '39.99',
        unit: 'kg',
        stock_quantity: 200,
        is_available: true
      })
      .returning()
      .execute();

    const product = productResult[0];

    // Add items to both users' carts
    await db.insert(cartItemsTable)
      .values([
        {
          user_id: user1.id,
          product_id: product.id,
          quantity: 3
        },
        {
          user_id: user2.id,
          product_id: product.id,
          quantity: 5
        }
      ])
      .execute();

    // Clear only user1's cart
    const testInput: GetUserCartInput = {
      user_id: user1.id
    };

    const result = await clearCart(testInput);

    expect(result.success).toBe(true);

    // Verify user1's cart is empty
    const user1Cart = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.user_id, user1.id))
      .execute();

    expect(user1Cart).toHaveLength(0);

    // Verify user2's cart is unchanged
    const user2Cart = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.user_id, user2.id))
      .execute();

    expect(user2Cart).toHaveLength(1);
    expect(user2Cart[0].quantity).toBe(5);
  });

  it('should handle non-existent user gracefully', async () => {
    const testInput: GetUserCartInput = {
      user_id: 99999 // Non-existent user ID
    };

    // Should not throw error even if user doesn't exist
    const result = await clearCart(testInput);

    expect(result.success).toBe(true);

    // Verify no cart items were affected
    const allCartItems = await db.select()
      .from(cartItemsTable)
      .execute();

    expect(allCartItems).toHaveLength(0);
  });
});