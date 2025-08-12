import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, cartItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type RemoveFromCartInput } from '../schema';
import { removeFromCart } from '../handlers/remove_from_cart';

// Test data
const testUser = {
  email: 'test@example.com',
  full_name: 'Test User',
  phone: '555-0123',
  address: '123 Test St'
};

const testProduct = {
  name: 'Test Chicken',
  description: 'Fresh chicken for testing',
  category: 'chicken' as const,
  price: '15.99',
  unit: 'kg',
  stock_quantity: 50,
  image_url: 'https://example.com/chicken.jpg',
  is_available: true
};

describe('removeFromCart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove cart item successfully', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values(testUser).returning().execute();
    const [product] = await db.insert(productsTable).values(testProduct).returning().execute();
    
    // Create cart item
    const [cartItem] = await db.insert(cartItemsTable).values({
      user_id: user.id,
      product_id: product.id,
      quantity: 2
    }).returning().execute();

    const input: RemoveFromCartInput = {
      id: cartItem.id
    };

    const result = await removeFromCart(input);

    expect(result.success).toBe(true);

    // Verify item was actually removed from database
    const remainingItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItem.id))
      .execute();

    expect(remainingItems).toHaveLength(0);
  });

  it('should handle non-existent cart item gracefully', async () => {
    const input: RemoveFromCartInput = {
      id: 999999 // Non-existent ID
    };

    const result = await removeFromCart(input);

    // Should still return success even if no rows were affected
    expect(result.success).toBe(true);
  });

  it('should not affect other cart items when removing one', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values(testUser).returning().execute();
    const [product] = await db.insert(productsTable).values(testProduct).returning().execute();
    
    // Create multiple cart items
    const [cartItem1] = await db.insert(cartItemsTable).values({
      user_id: user.id,
      product_id: product.id,
      quantity: 2
    }).returning().execute();
    
    const [cartItem2] = await db.insert(cartItemsTable).values({
      user_id: user.id,
      product_id: product.id,
      quantity: 3
    }).returning().execute();

    const input: RemoveFromCartInput = {
      id: cartItem1.id
    };

    const result = await removeFromCart(input);

    expect(result.success).toBe(true);

    // Verify only the target item was removed
    const item1Results = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItem1.id))
      .execute();
    expect(item1Results).toHaveLength(0);

    const item2Results = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItem2.id))
      .execute();
    expect(item2Results).toHaveLength(1);
    expect(item2Results[0].quantity).toBe(3);
  });

  it('should verify foreign key cascade behavior', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values(testUser).returning().execute();
    const [product] = await db.insert(productsTable).values(testProduct).returning().execute();
    
    // Create cart item
    const [cartItem] = await db.insert(cartItemsTable).values({
      user_id: user.id,
      product_id: product.id,
      quantity: 1
    }).returning().execute();

    // Remove the cart item directly
    const input: RemoveFromCartInput = {
      id: cartItem.id
    };

    const result = await removeFromCart(input);

    expect(result.success).toBe(true);

    // Verify the cart item no longer exists
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItem.id))
      .execute();

    expect(cartItems).toHaveLength(0);

    // Verify user and product still exist (cascade only affects cart_items)
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();
    expect(users).toHaveLength(1);

    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();
    expect(products).toHaveLength(1);
  });
});