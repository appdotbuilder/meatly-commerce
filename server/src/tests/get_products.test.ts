import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { getProducts } from '../handlers/get_products';

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const result = await getProducts();
    
    expect(result).toEqual([]);
  });

  it('should return all products from database', async () => {
    // Insert test products
    await db.insert(productsTable).values([
      {
        name: 'Chicken Breast',
        description: 'Fresh chicken breast',
        category: 'chicken',
        price: '15.99',
        unit: 'kg',
        stock_quantity: 50,
        image_url: 'https://example.com/chicken.jpg',
        is_available: true
      },
      {
        name: 'Salmon Fillet',
        description: 'Atlantic salmon fillet',
        category: 'fish',
        price: '25.50',
        unit: 'kg',
        stock_quantity: 25,
        image_url: null,
        is_available: false
      },
      {
        name: 'Ground Beef',
        description: null,
        category: 'meat',
        price: '12.00',
        unit: 'kg',
        stock_quantity: 75,
        image_url: 'https://example.com/beef.jpg',
        is_available: true
      }
    ]).execute();

    const result = await getProducts();

    expect(result).toHaveLength(3);
    
    // Verify first product
    const chickenProduct = result.find(p => p.name === 'Chicken Breast');
    expect(chickenProduct).toBeDefined();
    expect(chickenProduct!.name).toBe('Chicken Breast');
    expect(chickenProduct!.description).toBe('Fresh chicken breast');
    expect(chickenProduct!.category).toBe('chicken');
    expect(chickenProduct!.price).toBe(15.99);
    expect(typeof chickenProduct!.price).toBe('number');
    expect(chickenProduct!.unit).toBe('kg');
    expect(chickenProduct!.stock_quantity).toBe(50);
    expect(chickenProduct!.image_url).toBe('https://example.com/chicken.jpg');
    expect(chickenProduct!.is_available).toBe(true);
    expect(chickenProduct!.created_at).toBeInstanceOf(Date);
    expect(chickenProduct!.updated_at).toBeInstanceOf(Date);
    expect(chickenProduct!.id).toBeDefined();

    // Verify second product (with nulls)
    const salmonProduct = result.find(p => p.name === 'Salmon Fillet');
    expect(salmonProduct).toBeDefined();
    expect(salmonProduct!.price).toBe(25.50);
    expect(typeof salmonProduct!.price).toBe('number');
    expect(salmonProduct!.image_url).toBeNull();
    expect(salmonProduct!.is_available).toBe(false);

    // Verify third product
    const beefProduct = result.find(p => p.name === 'Ground Beef');
    expect(beefProduct).toBeDefined();
    expect(beefProduct!.description).toBeNull();
    expect(beefProduct!.price).toBe(12.00);
    expect(typeof beefProduct!.price).toBe('number');
  });

  it('should handle products with different categories', async () => {
    // Insert products from all categories
    await db.insert(productsTable).values([
      {
        name: 'Chicken Wings',
        category: 'chicken',
        price: '8.99',
        unit: 'kg',
        stock_quantity: 30,
        is_available: true
      },
      {
        name: 'Tuna Steaks',
        category: 'fish',
        price: '22.99',
        unit: 'kg',
        stock_quantity: 15,
        is_available: true
      },
      {
        name: 'Pork Chops',
        category: 'meat',
        price: '18.50',
        unit: 'kg',
        stock_quantity: 20,
        is_available: true
      }
    ]).execute();

    const result = await getProducts();

    expect(result).toHaveLength(3);
    
    const categories = result.map(p => p.category);
    expect(categories).toContain('chicken');
    expect(categories).toContain('fish');
    expect(categories).toContain('meat');
  });

  it('should return products ordered by insertion (natural database order)', async () => {
    // Insert products in specific order
    const insertedProducts = await db.insert(productsTable).values([
      {
        name: 'First Product',
        category: 'chicken',
        price: '10.00',
        unit: 'kg',
        stock_quantity: 100,
        is_available: true
      },
      {
        name: 'Second Product',
        category: 'fish',
        price: '20.00',
        unit: 'kg',
        stock_quantity: 50,
        is_available: true
      }
    ]).returning().execute();

    const result = await getProducts();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('First Product');
    expect(result[1].name).toBe('Second Product');
    expect(result[0].id).toBe(insertedProducts[0].id);
    expect(result[1].id).toBe(insertedProducts[1].id);
  });

  it('should handle large number of products efficiently', async () => {
    // Create 50 products
    const manyProducts = Array.from({ length: 50 }, (_, i) => ({
      name: `Product ${i + 1}`,
      category: ['chicken', 'fish', 'meat'][i % 3] as 'chicken' | 'fish' | 'meat',
      price: (10 + i).toString(),
      unit: 'kg',
      stock_quantity: 10 + i,
      is_available: i % 2 === 0
    }));

    await db.insert(productsTable).values(manyProducts).execute();

    const result = await getProducts();

    expect(result).toHaveLength(50);
    
    // Verify all prices are properly converted to numbers
    result.forEach(product => {
      expect(typeof product.price).toBe('number');
      expect(product.price).toBeGreaterThan(0);
    });

    // Verify some specific products
    const firstProduct = result.find(p => p.name === 'Product 1');
    expect(firstProduct?.price).toBe(10);
    
    const lastProduct = result.find(p => p.name === 'Product 50');
    expect(lastProduct?.price).toBe(59);
  });
});