import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput, type Product } from '../schema';

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    // Insert product record
    const result = await db.insert(productsTable)
      .values({
        name: input.name,
        description: input.description ?? null,
        category: input.category,
        price: input.price.toString(), // Convert number to string for numeric column
        unit: input.unit,
        stock_quantity: input.stock_quantity,
        image_url: input.image_url ?? null,
        is_available: input.is_available ?? true // Use Zod default if not provided
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      price: parseFloat(product.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
};