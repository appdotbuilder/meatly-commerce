import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

// Create a test product first
const createTestProduct = async () => {
  const result = await db.insert(productsTable)
    .values({
      name: 'Original Product',
      description: 'Original description',
      category: 'chicken',
      price: '10.99',
      unit: 'kg',
      stock_quantity: 50,
      image_url: 'https://example.com/original.jpg',
      is_available: true
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all product fields', async () => {
    const testProduct = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      name: 'Updated Product',
      description: 'Updated description',
      category: 'fish',
      price: 15.99,
      unit: 'piece',
      stock_quantity: 75,
      image_url: 'https://example.com/updated.jpg',
      is_available: false
    };

    const result = await updateProduct(updateInput);

    // Verify all fields are updated
    expect(result.id).toEqual(testProduct.id);
    expect(result.name).toEqual('Updated Product');
    expect(result.description).toEqual('Updated description');
    expect(result.category).toEqual('fish');
    expect(result.price).toEqual(15.99);
    expect(typeof result.price).toEqual('number');
    expect(result.unit).toEqual('piece');
    expect(result.stock_quantity).toEqual(75);
    expect(result.image_url).toEqual('https://example.com/updated.jpg');
    expect(result.is_available).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const testProduct = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      name: 'Partially Updated Product',
      price: 12.50
    };

    const result = await updateProduct(updateInput);

    // Verify only specified fields are updated
    expect(result.name).toEqual('Partially Updated Product');
    expect(result.price).toEqual(12.50);
    // Other fields should remain unchanged
    expect(result.description).toEqual('Original description');
    expect(result.category).toEqual('chicken');
    expect(result.unit).toEqual('kg');
    expect(result.stock_quantity).toEqual(50);
    expect(result.image_url).toEqual('https://example.com/original.jpg');
    expect(result.is_available).toEqual(true);
  });

  it('should handle nullable fields being set to null', async () => {
    const testProduct = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      description: null,
      image_url: null
    };

    const result = await updateProduct(updateInput);

    expect(result.description).toBeNull();
    expect(result.image_url).toBeNull();
    // Other fields should remain unchanged
    expect(result.name).toEqual('Original Product');
    expect(result.category).toEqual('chicken');
  });

  it('should save updated product to database', async () => {
    const testProduct = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      name: 'Database Updated Product',
      price: 20.00,
      stock_quantity: 100
    };

    await updateProduct(updateInput);

    // Verify changes are persisted in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, testProduct.id))
      .execute();

    expect(products).toHaveLength(1);
    const savedProduct = products[0];
    expect(savedProduct.name).toEqual('Database Updated Product');
    expect(parseFloat(savedProduct.price)).toEqual(20.00);
    expect(savedProduct.stock_quantity).toEqual(100);
    expect(savedProduct.updated_at).toBeInstanceOf(Date);
    // Original timestamp should be different from updated timestamp
    expect(savedProduct.updated_at.getTime()).toBeGreaterThan(savedProduct.created_at.getTime());
  });

  it('should handle stock quantity of zero', async () => {
    const testProduct = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      stock_quantity: 0,
      is_available: false
    };

    const result = await updateProduct(updateInput);

    expect(result.stock_quantity).toEqual(0);
    expect(result.is_available).toEqual(false);
  });

  it('should throw error when product not found', async () => {
    const updateInput: UpdateProductInput = {
      id: 99999, // Non-existent ID
      name: 'This should fail'
    };

    await expect(updateProduct(updateInput)).rejects.toThrow(/Product with id 99999 not found/i);
  });

  it('should handle decimal prices correctly', async () => {
    const testProduct = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      price: 9.95
    };

    const result = await updateProduct(updateInput);

    expect(result.price).toEqual(9.95);
    expect(typeof result.price).toEqual('number');
    
    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, testProduct.id))
      .execute();
    
    expect(parseFloat(products[0].price)).toEqual(9.95);
  });

  it('should update product category correctly', async () => {
    const testProduct = await createTestProduct();
    
    const updateInput: UpdateProductInput = {
      id: testProduct.id,
      category: 'meat'
    };

    const result = await updateProduct(updateInput);

    expect(result.category).toEqual('meat');
    
    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, testProduct.id))
      .execute();
    
    expect(products[0].category).toEqual('meat');
  });
});