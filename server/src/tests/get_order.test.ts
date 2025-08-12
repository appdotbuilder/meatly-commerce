import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, ordersTable, orderItemsTable } from '../db/schema';
import { type GetOrderInput } from '../schema';
import { getOrder } from '../handlers/get_order';

describe('getOrder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get an order with its items and product details', async () => {
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
    
    const userId = userResult[0].id;

    // Create test products
    const productResult1 = await db.insert(productsTable)
      .values({
        name: 'Chicken Breast',
        description: 'Fresh chicken breast',
        category: 'chicken',
        price: '15.99',
        unit: 'kg',
        stock_quantity: 50,
        is_available: true
      })
      .returning()
      .execute();

    const productResult2 = await db.insert(productsTable)
      .values({
        name: 'Salmon Fillet',
        description: 'Fresh salmon fillet',
        category: 'fish',
        price: '25.50',
        unit: 'kg',
        stock_quantity: 30,
        is_available: true
      })
      .returning()
      .execute();

    const product1 = productResult1[0];
    const product2 = productResult2[0];

    // Create test order
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: userId,
        total_amount: '67.48', // (15.99 * 2) + (25.50 * 1)
        status: 'confirmed',
        delivery_address: '456 Delivery Ave',
        delivery_phone: '0987654321',
        notes: 'Test order notes'
      })
      .returning()
      .execute();

    const orderId = orderResult[0].id;

    // Create test order items
    await db.insert(orderItemsTable)
      .values([
        {
          order_id: orderId,
          product_id: product1.id,
          quantity: 2,
          unit_price: '15.99',
          total_price: '31.98'
        },
        {
          order_id: orderId,
          product_id: product2.id,
          quantity: 1,
          unit_price: '25.50',
          total_price: '25.50'
        }
      ])
      .execute();

    const input: GetOrderInput = { id: orderId };
    const result = await getOrder(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(orderId);
    expect(result!.user_id).toEqual(userId);
    expect(result!.total_amount).toEqual(67.48);
    expect(result!.status).toEqual('confirmed');
    expect(result!.delivery_address).toEqual('456 Delivery Ave');
    expect(result!.delivery_phone).toEqual('0987654321');
    expect(result!.notes).toEqual('Test order notes');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify order items
    expect(result!.items).toHaveLength(2);
    
    const item1 = result!.items.find(item => item.product_id === product1.id);
    expect(item1).toBeDefined();
    expect(item1!.quantity).toEqual(2);
    expect(item1!.unit_price).toEqual(15.99);
    expect(item1!.total_price).toEqual(31.98);
    expect(item1!.product.name).toEqual('Chicken Breast');
    expect(item1!.product.category).toEqual('chicken');
    expect(item1!.product.price).toEqual(15.99);

    const item2 = result!.items.find(item => item.product_id === product2.id);
    expect(item2).toBeDefined();
    expect(item2!.quantity).toEqual(1);
    expect(item2!.unit_price).toEqual(25.50);
    expect(item2!.total_price).toEqual(25.50);
    expect(item2!.product.name).toEqual('Salmon Fillet');
    expect(item2!.product.category).toEqual('fish');
    expect(item2!.product.price).toEqual(25.50);
  });

  it('should return null for non-existent order', async () => {
    const input: GetOrderInput = { id: 999 };
    const result = await getOrder(input);

    expect(result).toBeNull();
  });

  it('should return order with empty items array when no items exist', async () => {
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
    
    const userId = userResult[0].id;

    // Create test order without items
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: userId,
        total_amount: '0.00',
        status: 'pending',
        delivery_address: '456 Delivery Ave',
        delivery_phone: '0987654321'
      })
      .returning()
      .execute();

    const orderId = orderResult[0].id;

    const input: GetOrderInput = { id: orderId };
    const result = await getOrder(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(orderId);
    expect(result!.user_id).toEqual(userId);
    expect(result!.total_amount).toEqual(0);
    expect(result!.status).toEqual('pending');
    expect(result!.items).toHaveLength(0);
  });

  it('should handle orders with nullable notes field', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test order with null notes
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: userId,
        total_amount: '10.00',
        status: 'pending',
        delivery_address: '456 Delivery Ave',
        delivery_phone: '0987654321',
        notes: null
      })
      .returning()
      .execute();

    const orderId = orderResult[0].id;

    const input: GetOrderInput = { id: orderId };
    const result = await getOrder(input);

    expect(result).not.toBeNull();
    expect(result!.notes).toBeNull();
  });

  it('should verify numeric type conversions', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();
    
    const userId = userResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        category: 'chicken',
        price: '12.34',
        unit: 'piece',
        stock_quantity: 10,
        is_available: true
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create test order
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: userId,
        total_amount: '24.68',
        status: 'pending',
        delivery_address: '456 Delivery Ave',
        delivery_phone: '0987654321'
      })
      .returning()
      .execute();

    const orderId = orderResult[0].id;

    // Create order item
    await db.insert(orderItemsTable)
      .values({
        order_id: orderId,
        product_id: productId,
        quantity: 2,
        unit_price: '12.34',
        total_price: '24.68'
      })
      .execute();

    const input: GetOrderInput = { id: orderId };
    const result = await getOrder(input);

    expect(result).not.toBeNull();
    
    // Verify numeric conversions
    expect(typeof result!.total_amount).toBe('number');
    expect(result!.total_amount).toEqual(24.68);
    
    expect(result!.items).toHaveLength(1);
    expect(typeof result!.items[0].unit_price).toBe('number');
    expect(typeof result!.items[0].total_price).toBe('number');
    expect(typeof result!.items[0].product.price).toBe('number');
    
    expect(result!.items[0].unit_price).toEqual(12.34);
    expect(result!.items[0].total_price).toEqual(24.68);
    expect(result!.items[0].product.price).toEqual(12.34);
  });
});