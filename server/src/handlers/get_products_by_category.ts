import { db } from '../db';
import { productsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetProductsByCategoryInput, type Product } from '../schema';

export const getProductsByCategory = async (input: GetProductsByCategoryInput): Promise<Product[]> => {
  try {
    // Query products by category
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.category, input.category))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(product => ({
      ...product,
      price: parseFloat(product.price) // Convert string back to number
    }));
  } catch (error) {
    console.error('Get products by category failed:', error);
    throw error;
  }
};