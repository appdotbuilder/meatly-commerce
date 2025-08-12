import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, ordersTable, deliveriesTable } from '../db/schema';
import { type CreateDeliveryInput } from '../schema';
import { createDelivery } from '../handlers/create_delivery';
import { eq } from 'drizzle-orm';

describe('createDelivery', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create prerequisite data
  const createPrerequisiteData = async () => {
    // Create a user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '123-456-7890',
        address: '123 Test St'
      })
      .returning()
      .execute();

    // Create a product
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

    // Create an order
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: userResult[0].id,
        total_amount: '19.99',
        status: 'confirmed',
        delivery_address: '123 Delivery St',
        delivery_phone: '987-654-3210'
      })
      .returning()
      .execute();

    return {
      user: userResult[0],
      product: productResult[0],
      order: orderResult[0]
    };
  };

  it('should create a delivery with minimal input', async () => {
    const { order } = await createPrerequisiteData();
    
    const input: CreateDeliveryInput = {
      order_id: order.id
    };

    const result = await createDelivery(input);

    // Basic field validation
    expect(result.order_id).toEqual(order.id);
    expect(result.status).toEqual('pending');
    expect(result.estimated_delivery_time).toBeNull();
    expect(result.actual_delivery_time).toBeNull();
    expect(result.delivery_person_name).toBeNull();
    expect(result.delivery_person_phone).toBeNull();
    expect(result.tracking_notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a delivery with all optional fields', async () => {
    const { order } = await createPrerequisiteData();
    
    const estimatedDeliveryTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    const input: CreateDeliveryInput = {
      order_id: order.id,
      estimated_delivery_time: estimatedDeliveryTime,
      delivery_person_name: 'John Doe',
      delivery_person_phone: '555-1234'
    };

    const result = await createDelivery(input);

    // Validate all fields including optional ones
    expect(result.order_id).toEqual(order.id);
    expect(result.status).toEqual('pending');
    expect(result.estimated_delivery_time).toEqual(estimatedDeliveryTime);
    expect(result.delivery_person_name).toEqual('John Doe');
    expect(result.delivery_person_phone).toEqual('555-1234');
    expect(result.actual_delivery_time).toBeNull();
    expect(result.tracking_notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save delivery to database', async () => {
    const { order } = await createPrerequisiteData();
    
    const input: CreateDeliveryInput = {
      order_id: order.id,
      delivery_person_name: 'Jane Smith'
    };

    const result = await createDelivery(input);

    // Query database to verify delivery was saved
    const deliveries = await db.select()
      .from(deliveriesTable)
      .where(eq(deliveriesTable.id, result.id))
      .execute();

    expect(deliveries).toHaveLength(1);
    expect(deliveries[0].order_id).toEqual(order.id);
    expect(deliveries[0].status).toEqual('pending');
    expect(deliveries[0].delivery_person_name).toEqual('Jane Smith');
    expect(deliveries[0].created_at).toBeInstanceOf(Date);
    expect(deliveries[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when order does not exist', async () => {
    const input: CreateDeliveryInput = {
      order_id: 999999 // Non-existent order ID
    };

    await expect(createDelivery(input)).rejects.toThrow(/Order with id 999999 does not exist/i);
  });

  it('should handle estimated delivery time correctly', async () => {
    const { order } = await createPrerequisiteData();
    
    const futureTime = new Date('2024-12-31T15:30:00Z');
    const input: CreateDeliveryInput = {
      order_id: order.id,
      estimated_delivery_time: futureTime
    };

    const result = await createDelivery(input);

    expect(result.estimated_delivery_time).toEqual(futureTime);
    
    // Verify in database
    const savedDelivery = await db.select()
      .from(deliveriesTable)
      .where(eq(deliveriesTable.id, result.id))
      .execute();

    expect(savedDelivery[0].estimated_delivery_time).toEqual(futureTime);
  });

  it('should create multiple deliveries for different orders', async () => {
    const { order: order1 } = await createPrerequisiteData();
    
    // Create second order
    const order2Result = await db.insert(ordersTable)
      .values({
        user_id: order1.user_id,
        total_amount: '29.99',
        status: 'confirmed',
        delivery_address: '456 Another St',
        delivery_phone: '111-222-3333'
      })
      .returning()
      .execute();

    const input1: CreateDeliveryInput = {
      order_id: order1.id,
      delivery_person_name: 'Driver A'
    };

    const input2: CreateDeliveryInput = {
      order_id: order2Result[0].id,
      delivery_person_name: 'Driver B'
    };

    const delivery1 = await createDelivery(input1);
    const delivery2 = await createDelivery(input2);

    expect(delivery1.order_id).toEqual(order1.id);
    expect(delivery1.delivery_person_name).toEqual('Driver A');
    expect(delivery2.order_id).toEqual(order2Result[0].id);
    expect(delivery2.delivery_person_name).toEqual('Driver B');
    expect(delivery1.id).not.toEqual(delivery2.id);
  });
});