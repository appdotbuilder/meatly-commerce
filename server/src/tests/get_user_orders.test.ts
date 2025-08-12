import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, ordersTable, orderItemsTable } from '../db/schema';
import { type GetUserOrdersInput } from '../schema';
import { getUserOrders } from '../handlers/get_user_orders';

describe('getUserOrders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no orders', async () => {
    // Create a user without any orders
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '1234567890',
        address: '123 Test St'
      })
      .returning()
      .execute();

    const input: GetUserOrdersInput = {
      user_id: users[0].id
    };

    const result = await getUserOrders(input);

    expect(result).toEqual([]);
  });

  it('should return user orders with items and product details', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '1234567890',
        address: '123 Test St'
      })
      .returning()
      .execute();

    const userId = users[0].id;

    // Create test products
    const products = await db.insert(productsTable)
      .values([
        {
          name: 'Chicken Breast',
          description: 'Fresh chicken breast',
          category: 'chicken',
          price: '12.99',
          unit: 'lb',
          stock_quantity: 50,
          is_available: true
        },
        {
          name: 'Salmon Fillet',
          description: 'Fresh salmon fillet',
          category: 'fish',
          price: '18.50',
          unit: 'lb',
          stock_quantity: 30,
          is_available: true
        }
      ])
      .returning()
      .execute();

    // Create test orders (insert separately to ensure different timestamps)
    const firstOrder = await db.insert(ordersTable)
      .values({
        user_id: userId,
        total_amount: '31.49',
        status: 'delivered',
        delivery_address: '123 Test St',
        delivery_phone: '1234567890',
        notes: 'First order'
      })
      .returning()
      .execute();

    // Add a small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondOrder = await db.insert(ordersTable)
      .values({
        user_id: userId,
        total_amount: '37.00',
        status: 'pending',
        delivery_address: '456 Another St',
        delivery_phone: '0987654321',
        notes: 'Second order'
      })
      .returning()
      .execute();

    const orders = [firstOrder[0], secondOrder[0]];

    // Create order items for first order
    await db.insert(orderItemsTable)
      .values([
        {
          order_id: orders[0].id,
          product_id: products[0].id,
          quantity: 2,
          unit_price: '12.99',
          total_price: '25.98'
        },
        {
          order_id: orders[0].id,
          product_id: products[1].id,
          quantity: 1,
          unit_price: '5.51',
          total_price: '5.51'
        }
      ])
      .execute();

    // Create order items for second order
    await db.insert(orderItemsTable)
      .values([
        {
          order_id: orders[1].id,
          product_id: products[1].id,
          quantity: 2,
          unit_price: '18.50',
          total_price: '37.00'
        }
      ])
      .execute();

    const input: GetUserOrdersInput = {
      user_id: userId
    };

    const result = await getUserOrders(input);

    // Verify basic structure
    expect(result).toHaveLength(2);

    // Find orders by their unique total amounts since sorting might not be perfectly predictable
    const newerOrder = result.find(order => order.total_amount === 37.00);
    const olderOrder = result.find(order => order.total_amount === 31.49);

    expect(newerOrder).toBeDefined();
    expect(olderOrder).toBeDefined();

    // The newer order should be first (newest first sorting)
    expect(result[0].id).toEqual(newerOrder!.id);

    // Verify newer order details
    expect(newerOrder!.user_id).toEqual(userId);
    expect(newerOrder!.total_amount).toEqual(37.00);
    expect(typeof newerOrder!.total_amount).toBe('number');
    expect(newerOrder!.status).toEqual('pending');
    expect(newerOrder!.delivery_address).toEqual('456 Another St');
    expect(newerOrder!.delivery_phone).toEqual('0987654321');
    expect(newerOrder!.notes).toEqual('Second order');
    expect(newerOrder!.created_at).toBeInstanceOf(Date);
    expect(newerOrder!.updated_at).toBeInstanceOf(Date);

    // Verify newer order items
    expect(newerOrder!.items).toHaveLength(1);
    const newerOrderItem = newerOrder!.items[0];
    expect(newerOrderItem.product_id).toEqual(products[1].id);
    expect(newerOrderItem.quantity).toEqual(2);
    expect(newerOrderItem.unit_price).toEqual(18.50);
    expect(typeof newerOrderItem.unit_price).toBe('number');
    expect(newerOrderItem.total_price).toEqual(37.00);
    expect(typeof newerOrderItem.total_price).toBe('number');

    // Verify product details in newer order item
    expect(newerOrderItem.product.id).toEqual(products[1].id);
    expect(newerOrderItem.product.name).toEqual('Salmon Fillet');
    expect(newerOrderItem.product.category).toEqual('fish');
    expect(newerOrderItem.product.price).toEqual(18.50);
    expect(typeof newerOrderItem.product.price).toBe('number');
    expect(newerOrderItem.product.unit).toEqual('lb');

    // Verify older order details
    expect(olderOrder!.id).toEqual(orders[0].id);
    expect(olderOrder!.total_amount).toEqual(31.49);
    expect(olderOrder!.status).toEqual('delivered');
    expect(olderOrder!.items).toHaveLength(2);

    // Verify older order has two different products
    const productIds = olderOrder!.items.map(item => item.product_id);
    expect(productIds).toContain(products[0].id);
    expect(productIds).toContain(products[1].id);
  });

  it('should return only orders for the specified user', async () => {
    // Create two users
    const users = await db.insert(usersTable)
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

    // Create a product
    const products = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        category: 'chicken',
        price: '10.00',
        unit: 'lb',
        stock_quantity: 100,
        is_available: true
      })
      .returning()
      .execute();

    // Create orders for both users (insert separately to ensure different timestamps)
    const order1 = await db.insert(ordersTable)
      .values({
        user_id: users[0].id,
        total_amount: '10.00',
        status: 'pending',
        delivery_address: '111 First St',
        delivery_phone: '1111111111'
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const order2 = await db.insert(ordersTable)
      .values({
        user_id: users[1].id,
        total_amount: '20.00',
        status: 'delivered',
        delivery_address: '222 Second St',
        delivery_phone: '2222222222'
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const order3 = await db.insert(ordersTable)
      .values({
        user_id: users[0].id,
        total_amount: '30.00',
        status: 'confirmed',
        delivery_address: '111 First St',
        delivery_phone: '1111111111'
      })
      .returning()
      .execute();

    const orders = [order1[0], order2[0], order3[0]];

    // Create order items
    await db.insert(orderItemsTable)
      .values([
        {
          order_id: orders[0].id,
          product_id: products[0].id,
          quantity: 1,
          unit_price: '10.00',
          total_price: '10.00'
        },
        {
          order_id: orders[1].id,
          product_id: products[0].id,
          quantity: 2,
          unit_price: '10.00',
          total_price: '20.00'
        },
        {
          order_id: orders[2].id,
          product_id: products[0].id,
          quantity: 3,
          unit_price: '10.00',
          total_price: '30.00'
        }
      ])
      .execute();

    // Get orders for first user
    const input: GetUserOrdersInput = {
      user_id: users[0].id
    };

    const result = await getUserOrders(input);

    // Should only return orders for user 1
    expect(result).toHaveLength(2);
    
    // All orders should belong to the first user
    result.forEach(order => {
      expect(order.user_id).toEqual(users[0].id);
    });

    // Find orders by their unique total amounts
    const orderAmounts = result.map(order => order.total_amount);
    expect(orderAmounts).toContain(10.00); // First order
    expect(orderAmounts).toContain(30.00); // Third order
    expect(orderAmounts).not.toContain(20.00); // Second order belongs to user 2

    // The newer order (30.00) should be first due to sorting
    expect(result[0].total_amount).toEqual(30.00);
  });

  it('should handle orders with no items gracefully', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '1234567890',
        address: '123 Test St'
      })
      .returning()
      .execute();

    // Create an order without items
    const orders = await db.insert(ordersTable)
      .values({
        user_id: users[0].id,
        total_amount: '0.00',
        status: 'pending',
        delivery_address: '123 Test St',
        delivery_phone: '1234567890'
      })
      .returning()
      .execute();

    const input: GetUserOrdersInput = {
      user_id: users[0].id
    };

    const result = await getUserOrders(input);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(orders[0].id);
    expect(result[0].items).toEqual([]);
    expect(result[0].total_amount).toEqual(0.00);
  });

  it('should preserve order status and delivery information', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '1234567890',
        address: '123 Test St'
      })
      .returning()
      .execute();

    // Create test product
    const products = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        category: 'meat',
        price: '15.00',
        unit: 'kg',
        stock_quantity: 25,
        is_available: true
      })
      .returning()
      .execute();

    // Create orders with different statuses (insert separately)
    const order1 = await db.insert(ordersTable)
      .values({
        user_id: users[0].id,
        total_amount: '15.00',
        status: 'out_for_delivery',
        delivery_address: '123 Main St',
        delivery_phone: '555-0123',
        notes: 'Ring doorbell twice'
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const order2 = await db.insert(ordersTable)
      .values({
        user_id: users[0].id,
        total_amount: '30.00',
        status: 'cancelled',
        delivery_address: '456 Oak Ave',
        delivery_phone: '555-0456',
        notes: null
      })
      .returning()
      .execute();

    const orders = [order1[0], order2[0]];

    // Create order items
    await db.insert(orderItemsTable)
      .values([
        {
          order_id: orders[0].id,
          product_id: products[0].id,
          quantity: 1,
          unit_price: '15.00',
          total_price: '15.00'
        },
        {
          order_id: orders[1].id,
          product_id: products[0].id,
          quantity: 2,
          unit_price: '15.00',
          total_price: '30.00'
        }
      ])
      .execute();

    const input: GetUserOrdersInput = {
      user_id: users[0].id
    };

    const result = await getUserOrders(input);

    expect(result).toHaveLength(2);

    // Find orders by their total amounts to verify details
    const outForDeliveryOrder = result.find(order => order.total_amount === 15.00);
    const cancelledOrder = result.find(order => order.total_amount === 30.00);

    expect(outForDeliveryOrder).toBeDefined();
    expect(outForDeliveryOrder!.status).toEqual('out_for_delivery');
    expect(outForDeliveryOrder!.delivery_address).toEqual('123 Main St');
    expect(outForDeliveryOrder!.delivery_phone).toEqual('555-0123');
    expect(outForDeliveryOrder!.notes).toEqual('Ring doorbell twice');

    expect(cancelledOrder).toBeDefined();
    expect(cancelledOrder!.status).toEqual('cancelled');
    expect(cancelledOrder!.delivery_address).toEqual('456 Oak Ave');
    expect(cancelledOrder!.delivery_phone).toEqual('555-0456');
    expect(cancelledOrder!.notes).toBeNull();
  });
});