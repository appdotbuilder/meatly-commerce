import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, ordersTable } from '../db/schema';
import { type UpdateOrderStatusInput } from '../schema';
import { updateOrderStatus } from '../handlers/update_order_status';
import { eq } from 'drizzle-orm';

describe('updateOrderStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testOrderId: number;

  beforeEach(async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '123-456-7890',
        address: '123 Test St'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;

    // Create a test order
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: testUserId,
        total_amount: '99.99',
        status: 'pending',
        delivery_address: '456 Delivery St',
        delivery_phone: '987-654-3210',
        notes: 'Test order notes'
      })
      .returning()
      .execute();
    
    testOrderId = orderResult[0].id;
  });

  it('should update order status successfully', async () => {
    const input: UpdateOrderStatusInput = {
      id: testOrderId,
      status: 'confirmed'
    };

    const result = await updateOrderStatus(input);

    // Verify returned order has updated status
    expect(result.id).toBe(testOrderId);
    expect(result.status).toBe('confirmed');
    expect(result.user_id).toBe(testUserId);
    expect(result.total_amount).toBe(99.99);
    expect(typeof result.total_amount).toBe('number');
    expect(result.delivery_address).toBe('456 Delivery St');
    expect(result.delivery_phone).toBe('987-654-3210');
    expect(result.notes).toBe('Test order notes');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update status to different valid statuses', async () => {
    const statuses = ['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'] as const;

    for (const status of statuses) {
      const input: UpdateOrderStatusInput = {
        id: testOrderId,
        status
      };

      const result = await updateOrderStatus(input);
      expect(result.status).toBe(status);
    }
  });

  it('should save updated status to database', async () => {
    const input: UpdateOrderStatusInput = {
      id: testOrderId,
      status: 'delivered'
    };

    await updateOrderStatus(input);

    // Verify the change was persisted in database
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, testOrderId))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].status).toBe('delivered');
    expect(orders[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp', async () => {
    // Get original timestamp
    const originalOrder = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, testOrderId))
      .execute();

    const originalTimestamp = originalOrder[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateOrderStatusInput = {
      id: testOrderId,
      status: 'preparing'
    };

    const result = await updateOrderStatus(input);

    // Verify updated_at was changed
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should preserve other order fields when updating status', async () => {
    const input: UpdateOrderStatusInput = {
      id: testOrderId,
      status: 'out_for_delivery'
    };

    const result = await updateOrderStatus(input);

    // Verify all original fields are preserved
    expect(result.user_id).toBe(testUserId);
    expect(result.total_amount).toBe(99.99);
    expect(result.delivery_address).toBe('456 Delivery St');
    expect(result.delivery_phone).toBe('987-654-3210');
    expect(result.notes).toBe('Test order notes');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent order', async () => {
    const input: UpdateOrderStatusInput = {
      id: 99999, // Non-existent ID
      status: 'confirmed'
    };

    await expect(updateOrderStatus(input)).rejects.toThrow(/Order with id 99999 not found/i);
  });

  it('should handle orders with null notes', async () => {
    // Create order with null notes
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: testUserId,
        total_amount: '49.99',
        status: 'pending',
        delivery_address: '789 Another St',
        delivery_phone: '555-123-4567',
        notes: null
      })
      .returning()
      .execute();

    const input: UpdateOrderStatusInput = {
      id: orderResult[0].id,
      status: 'confirmed'
    };

    const result = await updateOrderStatus(input);

    expect(result.status).toBe('confirmed');
    expect(result.notes).toBeNull();
    expect(result.total_amount).toBe(49.99);
    expect(typeof result.total_amount).toBe('number');
  });

  it('should handle large total amounts correctly', async () => {
    // Create order with large amount
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: testUserId,
        total_amount: '999999.99',
        status: 'pending',
        delivery_address: '100 Big Order Ave',
        delivery_phone: '111-222-3333'
      })
      .returning()
      .execute();

    const input: UpdateOrderStatusInput = {
      id: orderResult[0].id,
      status: 'confirmed'
    };

    const result = await updateOrderStatus(input);

    expect(result.total_amount).toBe(999999.99);
    expect(typeof result.total_amount).toBe('number');
    expect(result.status).toBe('confirmed');
  });
});