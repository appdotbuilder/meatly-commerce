import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateProductInput = {
  name: 'Fresh Chicken Breast',
  description: 'Premium quality chicken breast',
  category: 'chicken',
  price: 12.99,
  unit: 'kg',
  stock_quantity: 50,
  image_url: 'https://example.com/chicken.jpg',
  is_available: true
};

// Minimal test input (only required fields)
const minimalTestInput: CreateProductInput = {
  name: 'Basic Fish',
  category: 'fish',
  price: 15.50,
  unit: 'piece',
  stock_quantity: 25
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product with all fields', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Fresh Chicken Breast');
    expect(result.description).toEqual('Premium quality chicken breast');
    expect(result.category).toEqual('chicken');
    expect(result.price).toEqual(12.99);
    expect(typeof result.price).toBe('number');
    expect(result.unit).toEqual('kg');
    expect(result.stock_quantity).toEqual(50);
    expect(result.image_url).toEqual('https://example.com/chicken.jpg');
    expect(result.is_available).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a product with minimal fields and apply defaults', async () => {
    const result = await createProduct(minimalTestInput);

    // Basic field validation
    expect(result.name).toEqual('Basic Fish');
    expect(result.description).toBeNull(); // Should be null when not provided
    expect(result.category).toEqual('fish');
    expect(result.price).toEqual(15.50);
    expect(typeof result.price).toBe('number');
    expect(result.unit).toEqual('piece');
    expect(result.stock_quantity).toEqual(25);
    expect(result.image_url).toBeNull(); // Should be null when not provided
    expect(result.is_available).toEqual(true); // Should apply default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save product to database correctly', async () => {
    const result = await createProduct(testInput);

    // Query using proper drizzle syntax
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    const savedProduct = products[0];
    expect(savedProduct.name).toEqual('Fresh Chicken Breast');
    expect(savedProduct.description).toEqual('Premium quality chicken breast');
    expect(savedProduct.category).toEqual('chicken');
    expect(parseFloat(savedProduct.price)).toEqual(12.99);
    expect(savedProduct.unit).toEqual('kg');
    expect(savedProduct.stock_quantity).toEqual(50);
    expect(savedProduct.image_url).toEqual('https://example.com/chicken.jpg');
    expect(savedProduct.is_available).toEqual(true);
    expect(savedProduct.created_at).toBeInstanceOf(Date);
    expect(savedProduct.updated_at).toBeInstanceOf(Date);
  });

  it('should handle different product categories', async () => {
    const chickenInput: CreateProductInput = {
      name: 'Chicken Wings',
      category: 'chicken',
      price: 8.99,
      unit: 'kg',
      stock_quantity: 30
    };

    const fishInput: CreateProductInput = {
      name: 'Salmon Fillet',
      category: 'fish',
      price: 25.99,
      unit: 'kg',
      stock_quantity: 20
    };

    const meatInput: CreateProductInput = {
      name: 'Beef Steak',
      category: 'meat',
      price: 35.00,
      unit: 'kg',
      stock_quantity: 15
    };

    const chickenResult = await createProduct(chickenInput);
    const fishResult = await createProduct(fishInput);
    const meatResult = await createProduct(meatInput);

    expect(chickenResult.category).toEqual('chicken');
    expect(fishResult.category).toEqual('fish');
    expect(meatResult.category).toEqual('meat');

    // Verify all products are saved
    const allProducts = await db.select().from(productsTable).execute();
    expect(allProducts).toHaveLength(3);
  });

  it('should handle numeric precision correctly', async () => {
    const precisionInput: CreateProductInput = {
      name: 'Precision Test Product',
      category: 'meat',
      price: 19.99,
      unit: 'kg',
      stock_quantity: 100
    };

    const result = await createProduct(precisionInput);

    expect(result.price).toEqual(19.99);
    expect(typeof result.price).toBe('number');

    // Verify precision in database
    const savedProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(parseFloat(savedProducts[0].price)).toEqual(19.99);
  });

  it('should create multiple products successfully', async () => {
    const input1: CreateProductInput = {
      name: 'Product 1',
      category: 'chicken',
      price: 10.00,
      unit: 'kg',
      stock_quantity: 100
    };

    const input2: CreateProductInput = {
      name: 'Product 2',
      category: 'fish',
      price: 20.00,
      unit: 'piece',
      stock_quantity: 50
    };

    const result1 = await createProduct(input1);
    const result2 = await createProduct(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Product 1');
    expect(result2.name).toEqual('Product 2');

    // Verify both are saved
    const allProducts = await db.select().from(productsTable).execute();
    expect(allProducts).toHaveLength(2);
  });
});