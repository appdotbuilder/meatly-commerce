import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, cartItemsTable } from '../db/schema';
import { type GetUserCartInput } from '../schema';
import { getUserCart } from '../handlers/get_user_cart';

// Test input
const testInput: GetUserCartInput = {
  user_id: 1
};

describe('getUserCart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no cart items', async () => {
    // Create a user but no cart items
    await db.insert(usersTable).values({
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    const result = await getUserCart(testInput);

    expect(result).toEqual([]);
  });

  it('should return cart items with product details', async () => {
    // Create a user
    await db.insert(usersTable).values({
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    // Create a product
    await db.insert(productsTable).values({
      name: 'Fresh Chicken',
      description: 'Premium quality chicken',
      category: 'chicken',
      price: '15.99',
      unit: 'kg',
      stock_quantity: 50,
      image_url: 'https://example.com/chicken.jpg',
      is_available: true
    }).execute();

    // Add item to cart
    await db.insert(cartItemsTable).values({
      user_id: 1,
      product_id: 1,
      quantity: 2
    }).execute();

    const result = await getUserCart(testInput);

    expect(result).toHaveLength(1);
    
    const cartItem = result[0];
    expect(cartItem.id).toBeDefined();
    expect(cartItem.user_id).toEqual(1);
    expect(cartItem.product_id).toEqual(1);
    expect(cartItem.quantity).toEqual(2);
    expect(cartItem.created_at).toBeInstanceOf(Date);
    expect(cartItem.updated_at).toBeInstanceOf(Date);

    // Verify product details are included and properly converted
    expect(cartItem.product.id).toEqual(1);
    expect(cartItem.product.name).toEqual('Fresh Chicken');
    expect(cartItem.product.description).toEqual('Premium quality chicken');
    expect(cartItem.product.category).toEqual('chicken');
    expect(cartItem.product.price).toEqual(15.99);
    expect(typeof cartItem.product.price).toEqual('number');
    expect(cartItem.product.unit).toEqual('kg');
    expect(cartItem.product.stock_quantity).toEqual(50);
    expect(cartItem.product.image_url).toEqual('https://example.com/chicken.jpg');
    expect(cartItem.product.is_available).toEqual(true);
    expect(cartItem.product.created_at).toBeInstanceOf(Date);
    expect(cartItem.product.updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple cart items for a user', async () => {
    // Create a user
    await db.insert(usersTable).values({
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    // Create multiple products
    await db.insert(productsTable).values([
      {
        name: 'Fresh Chicken',
        description: 'Premium quality chicken',
        category: 'chicken',
        price: '15.99',
        unit: 'kg',
        stock_quantity: 50,
        is_available: true
      },
      {
        name: 'Fresh Salmon',
        description: 'Wild caught salmon',
        category: 'fish',
        price: '25.50',
        unit: 'kg',
        stock_quantity: 20,
        is_available: true
      }
    ]).execute();

    // Add multiple items to cart
    await db.insert(cartItemsTable).values([
      {
        user_id: 1,
        product_id: 1,
        quantity: 2
      },
      {
        user_id: 1,
        product_id: 2,
        quantity: 1
      }
    ]).execute();

    const result = await getUserCart(testInput);

    expect(result).toHaveLength(2);
    
    // Verify first item
    const firstItem = result.find(item => item.product_id === 1);
    expect(firstItem).toBeDefined();
    expect(firstItem!.quantity).toEqual(2);
    expect(firstItem!.product.name).toEqual('Fresh Chicken');
    expect(firstItem!.product.price).toEqual(15.99);

    // Verify second item
    const secondItem = result.find(item => item.product_id === 2);
    expect(secondItem).toBeDefined();
    expect(secondItem!.quantity).toEqual(1);
    expect(secondItem!.product.name).toEqual('Fresh Salmon');
    expect(secondItem!.product.price).toEqual(25.50);
  });

  it('should only return cart items for the specified user', async () => {
    // Create multiple users
    await db.insert(usersTable).values([
      {
        email: 'user1@example.com',
        full_name: 'User One'
      },
      {
        email: 'user2@example.com',
        full_name: 'User Two'
      }
    ]).execute();

    // Create a product
    await db.insert(productsTable).values({
      name: 'Fresh Chicken',
      category: 'chicken',
      price: '15.99',
      unit: 'kg',
      stock_quantity: 50,
      is_available: true
    }).execute();

    // Add items to different user carts
    await db.insert(cartItemsTable).values([
      {
        user_id: 1,
        product_id: 1,
        quantity: 2
      },
      {
        user_id: 2,
        product_id: 1,
        quantity: 3
      }
    ]).execute();

    // Get cart for user 1
    const result = await getUserCart({ user_id: 1 });

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(1);
    expect(result[0].quantity).toEqual(2);
  });

  it('should handle products with nullable fields', async () => {
    // Create a user
    await db.insert(usersTable).values({
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    // Create a product with null description and image_url
    await db.insert(productsTable).values({
      name: 'Simple Product',
      description: null,
      category: 'meat',
      price: '10.00',
      unit: 'piece',
      stock_quantity: 10,
      image_url: null,
      is_available: false
    }).execute();

    // Add item to cart
    await db.insert(cartItemsTable).values({
      user_id: 1,
      product_id: 1,
      quantity: 1
    }).execute();

    const result = await getUserCart(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].product.description).toBeNull();
    expect(result[0].product.image_url).toBeNull();
    expect(result[0].product.is_available).toEqual(false);
    expect(result[0].product.price).toEqual(10.00);
  });
});