import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, cartItemsTable, ordersTable, orderItemsTable } from '../db/schema';
import { type CreateOrderInput } from '../schema';
import { createOrder } from '../handlers/create_order';
import { eq } from 'drizzle-orm';

describe('createOrder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testUser = {
    email: 'test@example.com',
    full_name: 'Test User',
    phone: '123-456-7890',
    address: '123 Test St'
  };

  const testProduct1 = {
    name: 'Fresh Chicken Breast',
    description: 'Premium chicken breast',
    category: 'chicken' as const,
    price: '15.99',
    unit: 'kg',
    stock_quantity: 50,
    image_url: 'https://example.com/chicken.jpg',
    is_available: true
  };

  const testProduct2 = {
    name: 'Salmon Fillet',
    description: 'Fresh salmon',
    category: 'fish' as const,
    price: '25.50',
    unit: 'kg',
    stock_quantity: 30,
    image_url: 'https://example.com/salmon.jpg',
    is_available: true
  };

  const testInput: CreateOrderInput = {
    user_id: 1,
    delivery_address: '456 Delivery Ave',
    delivery_phone: '987-654-3210',
    notes: 'Leave at front door'
  };

  it('should create order from cart items', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user = userResult[0];

    // Create products
    const product1Result = await db.insert(productsTable)
      .values(testProduct1)
      .returning()
      .execute();
    const product1 = product1Result[0];

    const product2Result = await db.insert(productsTable)
      .values(testProduct2)
      .returning()
      .execute();
    const product2 = product2Result[0];

    // Add items to cart
    await db.insert(cartItemsTable)
      .values([
        { user_id: user.id, product_id: product1.id, quantity: 2 },
        { user_id: user.id, product_id: product2.id, quantity: 1 }
      ])
      .execute();

    const result = await createOrder({
      ...testInput,
      user_id: user.id
    });

    // Verify order properties
    expect(result.user_id).toBe(user.id);
    expect(result.delivery_address).toBe('456 Delivery Ave');
    expect(result.delivery_phone).toBe('987-654-3210');
    expect(result.notes).toBe('Leave at front door');
    expect(result.status).toBe('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify total amount calculation
    const expectedTotal = (15.99 * 2) + (25.50 * 1);
    expect(result.total_amount).toBeCloseTo(expectedTotal, 2);
    expect(typeof result.total_amount).toBe('number');

    // Verify order items
    expect(result.items).toHaveLength(2);

    const item1 = result.items.find(item => item.product.name === 'Fresh Chicken Breast');
    expect(item1).toBeDefined();
    expect(item1!.quantity).toBe(2);
    expect(item1!.unit_price).toBe(15.99);
    expect(item1!.total_price).toBeCloseTo(31.98, 2);
    expect(typeof item1!.unit_price).toBe('number');
    expect(typeof item1!.total_price).toBe('number');
    expect(item1!.product.category).toBe('chicken');

    const item2 = result.items.find(item => item.product.name === 'Salmon Fillet');
    expect(item2).toBeDefined();
    expect(item2!.quantity).toBe(1);
    expect(item2!.unit_price).toBe(25.50);
    expect(item2!.total_price).toBe(25.50);
    expect(item2!.product.category).toBe('fish');
  });

  it('should save order to database', async () => {
    // Create user and product
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user = userResult[0];

    const productResult = await db.insert(productsTable)
      .values(testProduct1)
      .returning()
      .execute();
    const product = productResult[0];

    // Add item to cart
    await db.insert(cartItemsTable)
      .values({ user_id: user.id, product_id: product.id, quantity: 3 })
      .execute();

    const result = await createOrder({
      ...testInput,
      user_id: user.id
    });

    // Verify order exists in database
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, result.id))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].user_id).toBe(user.id);
    expect(parseFloat(orders[0].total_amount)).toBeCloseTo(47.97, 2);
    expect(orders[0].status).toBe('pending');

    // Verify order items exist in database
    const orderItems = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.order_id, result.id))
      .execute();

    expect(orderItems).toHaveLength(1);
    expect(orderItems[0].product_id).toBe(product.id);
    expect(orderItems[0].quantity).toBe(3);
    expect(parseFloat(orderItems[0].unit_price)).toBe(15.99);
  });

  it('should clear cart after creating order', async () => {
    // Create user and product
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user = userResult[0];

    const productResult = await db.insert(productsTable)
      .values(testProduct1)
      .returning()
      .execute();
    const product = productResult[0];

    // Add item to cart
    await db.insert(cartItemsTable)
      .values({ user_id: user.id, product_id: product.id, quantity: 1 })
      .execute();

    // Verify cart has items before order creation
    const cartBefore = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.user_id, user.id))
      .execute();
    expect(cartBefore).toHaveLength(1);

    await createOrder({
      ...testInput,
      user_id: user.id
    });

    // Verify cart is empty after order creation
    const cartAfter = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.user_id, user.id))
      .execute();
    expect(cartAfter).toHaveLength(0);
  });

  it('should create order with null notes', async () => {
    // Create user and product
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user = userResult[0];

    const productResult = await db.insert(productsTable)
      .values(testProduct1)
      .returning()
      .execute();
    const product = productResult[0];

    // Add item to cart
    await db.insert(cartItemsTable)
      .values({ user_id: user.id, product_id: product.id, quantity: 1 })
      .execute();

    const result = await createOrder({
      user_id: user.id,
      delivery_address: '123 Main St',
      delivery_phone: '555-0123'
      // notes not provided
    });

    expect(result.notes).toBeNull();
  });

  it('should throw error when cart is empty', async () => {
    // Create user but no cart items
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user = userResult[0];

    await expect(createOrder({
      ...testInput,
      user_id: user.id
    })).rejects.toThrow(/cart is empty/i);
  });

  it('should throw error when user does not exist', async () => {
    // Try to create order for non-existent user
    await expect(createOrder({
      ...testInput,
      user_id: 999
    })).rejects.toThrow();
  });

  it('should handle multiple cart items with same product correctly', async () => {
    // Create user and product
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user = userResult[0];

    const productResult = await db.insert(productsTable)
      .values(testProduct1)
      .returning()
      .execute();
    const product = productResult[0];

    // Add multiple cart entries for same product (edge case)
    await db.insert(cartItemsTable)
      .values([
        { user_id: user.id, product_id: product.id, quantity: 2 },
        { user_id: user.id, product_id: product.id, quantity: 1 }
      ])
      .execute();

    const result = await createOrder({
      ...testInput,
      user_id: user.id
    });

    // Should create separate order items for each cart entry
    expect(result.items).toHaveLength(2);
    
    // Find items by quantity (since order is not guaranteed)
    const quantities = result.items.map(item => item.quantity).sort();
    expect(quantities).toEqual([1, 2]);

    // All items should be for the same product
    expect(result.items[0].product.name).toBe('Fresh Chicken Breast');
    expect(result.items[1].product.name).toBe('Fresh Chicken Breast');

    // Total should be sum of all quantities
    const expectedTotal = 15.99 * (2 + 1);
    expect(result.total_amount).toBeCloseTo(expectedTotal, 2);
  });
});