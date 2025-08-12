import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, ordersTable, deliveriesTable } from '../db/schema';
import { type UpdateDeliveryInput } from '../schema';
import { updateDelivery } from '../handlers/update_delivery';
import { eq } from 'drizzle-orm';

// Test data setup helpers
const createTestUser = async () => {
  const result = await db.insert(usersTable)
    .values({
      email: 'test@example.com',
      full_name: 'Test User',
      phone: '1234567890',
      address: '123 Test St'
    })
    .returning()
    .execute();
  return result[0];
};

const createTestOrder = async (userId: number) => {
  const result = await db.insert(ordersTable)
    .values({
      user_id: userId,
      total_amount: '25.99',
      delivery_address: '123 Delivery St',
      delivery_phone: '0987654321'
    })
    .returning()
    .execute();
  return result[0];
};

const createTestDelivery = async (orderId: number) => {
  const result = await db.insert(deliveriesTable)
    .values({
      order_id: orderId,
      status: 'pending',
      delivery_person_name: 'John Doe',
      delivery_person_phone: '5555555555',
      tracking_notes: 'Initial delivery created'
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateDelivery', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update delivery status', async () => {
    const user = await createTestUser();
    const order = await createTestOrder(user.id);
    const delivery = await createTestDelivery(order.id);

    const updateInput: UpdateDeliveryInput = {
      id: delivery.id,
      status: 'in_transit'
    };

    const result = await updateDelivery(updateInput);

    expect(result.id).toEqual(delivery.id);
    expect(result.order_id).toEqual(order.id);
    expect(result.status).toEqual('in_transit');
    expect(result.delivery_person_name).toEqual('John Doe');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > delivery.updated_at).toBe(true);
  });

  it('should update estimated delivery time', async () => {
    const user = await createTestUser();
    const order = await createTestOrder(user.id);
    const delivery = await createTestDelivery(order.id);

    const estimatedTime = new Date();
    estimatedTime.setHours(estimatedTime.getHours() + 2);

    const updateInput: UpdateDeliveryInput = {
      id: delivery.id,
      estimated_delivery_time: estimatedTime
    };

    const result = await updateDelivery(updateInput);

    expect(result.estimated_delivery_time).toBeInstanceOf(Date);
    expect(result.estimated_delivery_time!.getTime()).toEqual(estimatedTime.getTime());
  });

  it('should update actual delivery time when delivered', async () => {
    const user = await createTestUser();
    const order = await createTestOrder(user.id);
    const delivery = await createTestDelivery(order.id);

    const actualTime = new Date();

    const updateInput: UpdateDeliveryInput = {
      id: delivery.id,
      status: 'delivered',
      actual_delivery_time: actualTime
    };

    const result = await updateDelivery(updateInput);

    expect(result.status).toEqual('delivered');
    expect(result.actual_delivery_time).toBeInstanceOf(Date);
    expect(result.actual_delivery_time!.getTime()).toEqual(actualTime.getTime());
  });

  it('should update delivery person information', async () => {
    const user = await createTestUser();
    const order = await createTestOrder(user.id);
    const delivery = await createTestDelivery(order.id);

    const updateInput: UpdateDeliveryInput = {
      id: delivery.id,
      delivery_person_name: 'Jane Smith',
      delivery_person_phone: '9876543210'
    };

    const result = await updateDelivery(updateInput);

    expect(result.delivery_person_name).toEqual('Jane Smith');
    expect(result.delivery_person_phone).toEqual('9876543210');
  });

  it('should update tracking notes', async () => {
    const user = await createTestUser();
    const order = await createTestOrder(user.id);
    const delivery = await createTestDelivery(order.id);

    const updateInput: UpdateDeliveryInput = {
      id: delivery.id,
      tracking_notes: 'Package out for delivery, expected within 30 minutes'
    };

    const result = await updateDelivery(updateInput);

    expect(result.tracking_notes).toEqual('Package out for delivery, expected within 30 minutes');
  });

  it('should set nullable fields to null when explicitly provided', async () => {
    const user = await createTestUser();
    const order = await createTestOrder(user.id);
    const delivery = await createTestDelivery(order.id);

    const updateInput: UpdateDeliveryInput = {
      id: delivery.id,
      delivery_person_name: null,
      delivery_person_phone: null,
      tracking_notes: null,
      estimated_delivery_time: null
    };

    const result = await updateDelivery(updateInput);

    expect(result.delivery_person_name).toBeNull();
    expect(result.delivery_person_phone).toBeNull();
    expect(result.tracking_notes).toBeNull();
    expect(result.estimated_delivery_time).toBeNull();
  });

  it('should update multiple fields at once', async () => {
    const user = await createTestUser();
    const order = await createTestOrder(user.id);
    const delivery = await createTestDelivery(order.id);

    const estimatedTime = new Date();
    estimatedTime.setHours(estimatedTime.getHours() + 1);

    const updateInput: UpdateDeliveryInput = {
      id: delivery.id,
      status: 'assigned',
      delivery_person_name: 'Bob Wilson',
      delivery_person_phone: '1112223333',
      estimated_delivery_time: estimatedTime,
      tracking_notes: 'Driver assigned and en route to pickup'
    };

    const result = await updateDelivery(updateInput);

    expect(result.status).toEqual('assigned');
    expect(result.delivery_person_name).toEqual('Bob Wilson');
    expect(result.delivery_person_phone).toEqual('1112223333');
    expect(result.estimated_delivery_time!.getTime()).toEqual(estimatedTime.getTime());
    expect(result.tracking_notes).toEqual('Driver assigned and en route to pickup');
  });

  it('should save updated delivery to database', async () => {
    const user = await createTestUser();
    const order = await createTestOrder(user.id);
    const delivery = await createTestDelivery(order.id);

    const updateInput: UpdateDeliveryInput = {
      id: delivery.id,
      status: 'picked_up',
      tracking_notes: 'Package picked up from restaurant'
    };

    const result = await updateDelivery(updateInput);

    // Verify changes were saved to database
    const savedDelivery = await db.select()
      .from(deliveriesTable)
      .where(eq(deliveriesTable.id, delivery.id))
      .execute();

    expect(savedDelivery).toHaveLength(1);
    expect(savedDelivery[0].status).toEqual('picked_up');
    expect(savedDelivery[0].tracking_notes).toEqual('Package picked up from restaurant');
    expect(savedDelivery[0].updated_at > delivery.updated_at).toBe(true);
  });

  it('should throw error when delivery does not exist', async () => {
    const updateInput: UpdateDeliveryInput = {
      id: 999999,
      status: 'delivered'
    };

    await expect(updateDelivery(updateInput)).rejects.toThrow(/Delivery with id 999999 not found/i);
  });

  it('should preserve unchanged fields', async () => {
    const user = await createTestUser();
    const order = await createTestOrder(user.id);
    const delivery = await createTestDelivery(order.id);

    // Only update status, leave other fields unchanged
    const updateInput: UpdateDeliveryInput = {
      id: delivery.id,
      status: 'in_transit'
    };

    const result = await updateDelivery(updateInput);

    // Check that original values are preserved
    expect(result.status).toEqual('in_transit'); // Changed
    expect(result.delivery_person_name).toEqual('John Doe'); // Unchanged
    expect(result.delivery_person_phone).toEqual('5555555555'); // Unchanged
    expect(result.tracking_notes).toEqual('Initial delivery created'); // Unchanged
    expect(result.order_id).toEqual(order.id); // Unchanged
  });
});