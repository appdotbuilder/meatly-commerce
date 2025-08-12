import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type GetProductsByCategoryInput, type CreateProductInput } from '../schema';
import { getProductsByCategory } from '../handlers/get_products_by_category';

// Test products for different categories
const chickenProduct: CreateProductInput = {
  name: 'Fresh Chicken Breast',
  description: 'Premium chicken breast',
  category: 'chicken',
  price: 12.99,
  unit: 'kg',
  stock_quantity: 50,
  image_url: 'https://example.com/chicken.jpg',
  is_available: true
};

const fishProduct: CreateProductInput = {
  name: 'Atlantic Salmon',
  description: 'Fresh Atlantic salmon fillet',
  category: 'fish',
  price: 18.99,
  unit: 'kg',
  stock_quantity: 25,
  image_url: 'https://example.com/salmon.jpg',
  is_available: true
};

const meatProduct: CreateProductInput = {
  name: 'Beef Ribeye',
  description: 'Premium beef ribeye steak',
  category: 'meat',
  price: 25.99,
  unit: 'kg',
  stock_quantity: 30,
  image_url: null,
  is_available: false
};

const secondChickenProduct: CreateProductInput = {
  name: 'Chicken Thighs',
  description: 'Bone-in chicken thighs',
  category: 'chicken',
  price: 8.99,
  unit: 'kg',
  stock_quantity: 40,
  image_url: null,
  is_available: true
};

describe('getProductsByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return products filtered by chicken category', async () => {
    // Create test products
    await db.insert(productsTable).values([
      {
        name: chickenProduct.name,
        description: chickenProduct.description,
        category: chickenProduct.category,
        price: chickenProduct.price.toString(),
        unit: chickenProduct.unit,
        stock_quantity: chickenProduct.stock_quantity,
        image_url: chickenProduct.image_url,
        is_available: chickenProduct.is_available!
      },
      {
        name: fishProduct.name,
        description: fishProduct.description,
        category: fishProduct.category,
        price: fishProduct.price.toString(),
        unit: fishProduct.unit,
        stock_quantity: fishProduct.stock_quantity,
        image_url: fishProduct.image_url,
        is_available: fishProduct.is_available!
      },
      {
        name: secondChickenProduct.name,
        description: secondChickenProduct.description,
        category: secondChickenProduct.category,
        price: secondChickenProduct.price.toString(),
        unit: secondChickenProduct.unit,
        stock_quantity: secondChickenProduct.stock_quantity,
        image_url: secondChickenProduct.image_url,
        is_available: secondChickenProduct.is_available!
      }
    ]).execute();

    const input: GetProductsByCategoryInput = { category: 'chicken' };
    const results = await getProductsByCategory(input);

    expect(results).toHaveLength(2);
    
    // Verify all returned products are chicken category
    results.forEach(product => {
      expect(product.category).toEqual('chicken');
      expect(typeof product.price).toEqual('number');
      expect(product.id).toBeDefined();
      expect(product.created_at).toBeInstanceOf(Date);
    });

    // Verify specific products are included
    const productNames = results.map(p => p.name);
    expect(productNames).toContain('Fresh Chicken Breast');
    expect(productNames).toContain('Chicken Thighs');
  });

  it('should return products filtered by fish category', async () => {
    // Create test products
    await db.insert(productsTable).values([
      {
        name: chickenProduct.name,
        description: chickenProduct.description,
        category: chickenProduct.category,
        price: chickenProduct.price.toString(),
        unit: chickenProduct.unit,
        stock_quantity: chickenProduct.stock_quantity,
        image_url: chickenProduct.image_url,
        is_available: chickenProduct.is_available!
      },
      {
        name: fishProduct.name,
        description: fishProduct.description,
        category: fishProduct.category,
        price: fishProduct.price.toString(),
        unit: fishProduct.unit,
        stock_quantity: fishProduct.stock_quantity,
        image_url: fishProduct.image_url,
        is_available: fishProduct.is_available!
      }
    ]).execute();

    const input: GetProductsByCategoryInput = { category: 'fish' };
    const results = await getProductsByCategory(input);

    expect(results).toHaveLength(1);
    expect(results[0].category).toEqual('fish');
    expect(results[0].name).toEqual('Atlantic Salmon');
    expect(results[0].price).toEqual(18.99);
    expect(typeof results[0].price).toEqual('number');
  });

  it('should return products filtered by meat category', async () => {
    // Create test products
    await db.insert(productsTable).values([
      {
        name: meatProduct.name,
        description: meatProduct.description,
        category: meatProduct.category,
        price: meatProduct.price.toString(),
        unit: meatProduct.unit,
        stock_quantity: meatProduct.stock_quantity,
        image_url: meatProduct.image_url,
        is_available: meatProduct.is_available!
      },
      {
        name: fishProduct.name,
        description: fishProduct.description,
        category: fishProduct.category,
        price: fishProduct.price.toString(),
        unit: fishProduct.unit,
        stock_quantity: fishProduct.stock_quantity,
        image_url: fishProduct.image_url,
        is_available: fishProduct.is_available!
      }
    ]).execute();

    const input: GetProductsByCategoryInput = { category: 'meat' };
    const results = await getProductsByCategory(input);

    expect(results).toHaveLength(1);
    expect(results[0].category).toEqual('meat');
    expect(results[0].name).toEqual('Beef Ribeye');
    expect(results[0].price).toEqual(25.99);
    expect(results[0].is_available).toEqual(false);
    expect(results[0].image_url).toBeNull();
  });

  it('should return empty array when no products match category', async () => {
    // Create only fish products
    await db.insert(productsTable).values([
      {
        name: fishProduct.name,
        description: fishProduct.description,
        category: fishProduct.category,
        price: fishProduct.price.toString(),
        unit: fishProduct.unit,
        stock_quantity: fishProduct.stock_quantity,
        image_url: fishProduct.image_url,
        is_available: fishProduct.is_available!
      }
    ]).execute();

    const input: GetProductsByCategoryInput = { category: 'chicken' };
    const results = await getProductsByCategory(input);

    expect(results).toHaveLength(0);
  });

  it('should return empty array when no products exist', async () => {
    const input: GetProductsByCategoryInput = { category: 'chicken' };
    const results = await getProductsByCategory(input);

    expect(results).toHaveLength(0);
  });

  it('should handle all product fields correctly', async () => {
    // Create a product with all possible field combinations
    await db.insert(productsTable).values([
      {
        name: chickenProduct.name,
        description: chickenProduct.description,
        category: chickenProduct.category,
        price: chickenProduct.price.toString(),
        unit: chickenProduct.unit,
        stock_quantity: chickenProduct.stock_quantity,
        image_url: chickenProduct.image_url,
        is_available: chickenProduct.is_available!
      }
    ]).execute();

    const input: GetProductsByCategoryInput = { category: 'chicken' };
    const results = await getProductsByCategory(input);

    expect(results).toHaveLength(1);
    const product = results[0];

    // Verify all fields are properly typed and converted
    expect(product.id).toBeTypeOf('number');
    expect(product.name).toEqual('Fresh Chicken Breast');
    expect(product.description).toEqual('Premium chicken breast');
    expect(product.category).toEqual('chicken');
    expect(product.price).toEqual(12.99);
    expect(typeof product.price).toEqual('number');
    expect(product.unit).toEqual('kg');
    expect(product.stock_quantity).toEqual(50);
    expect(product.image_url).toEqual('https://example.com/chicken.jpg');
    expect(product.is_available).toEqual(true);
    expect(product.created_at).toBeInstanceOf(Date);
    expect(product.updated_at).toBeInstanceOf(Date);
  });
});