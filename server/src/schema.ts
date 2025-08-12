import { z } from 'zod';

// Enums
export const productCategorySchema = z.enum(['chicken', 'fish', 'meat']);
export type ProductCategory = z.infer<typeof productCategorySchema>;

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const deliveryStatusSchema = z.enum(['pending', 'assigned', 'picked_up', 'in_transit', 'delivered']);
export type DeliveryStatus = z.infer<typeof deliveryStatusSchema>;

// User schemas
export const userSchema = z.object({
  id: z.number(),
  email: z.string(),
  full_name: z.string(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  full_name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Product schemas
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  category: productCategorySchema,
  price: z.number(),
  unit: z.string(), // e.g., 'kg', 'piece', 'lb'
  stock_quantity: z.number().int(),
  image_url: z.string().nullable(),
  is_available: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

export const createProductInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  category: productCategorySchema,
  price: z.number().positive(),
  unit: z.string().min(1),
  stock_quantity: z.number().int().nonnegative(),
  image_url: z.string().url().nullable().optional(),
  is_available: z.boolean().optional()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: productCategorySchema.optional(),
  price: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  image_url: z.string().url().nullable().optional(),
  is_available: z.boolean().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

export const getProductsByCategoryInputSchema = z.object({
  category: productCategorySchema
});

export type GetProductsByCategoryInput = z.infer<typeof getProductsByCategoryInputSchema>;

// Cart schemas
export const cartItemSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type CartItem = z.infer<typeof cartItemSchema>;

export const cartItemWithProductSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  product: productSchema
});

export type CartItemWithProduct = z.infer<typeof cartItemWithProductSchema>;

export const addToCartInputSchema = z.object({
  user_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive()
});

export type AddToCartInput = z.infer<typeof addToCartInputSchema>;

export const updateCartItemInputSchema = z.object({
  id: z.number(),
  quantity: z.number().int().positive()
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemInputSchema>;

export const removeFromCartInputSchema = z.object({
  id: z.number()
});

export type RemoveFromCartInput = z.infer<typeof removeFromCartInputSchema>;

export const getUserCartInputSchema = z.object({
  user_id: z.number()
});

export type GetUserCartInput = z.infer<typeof getUserCartInputSchema>;

// Order schemas
export const orderSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  total_amount: z.number(),
  status: orderStatusSchema,
  delivery_address: z.string(),
  delivery_phone: z.string(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Order = z.infer<typeof orderSchema>;

export const orderItemSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int(),
  unit_price: z.number(),
  total_price: z.number()
});

export type OrderItem = z.infer<typeof orderItemSchema>;

export const orderWithItemsSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  total_amount: z.number(),
  status: orderStatusSchema,
  delivery_address: z.string(),
  delivery_phone: z.string(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  items: z.array(z.object({
    id: z.number(),
    order_id: z.number(),
    product_id: z.number(),
    quantity: z.number().int(),
    unit_price: z.number(),
    total_price: z.number(),
    product: productSchema
  }))
});

export type OrderWithItems = z.infer<typeof orderWithItemsSchema>;

export const createOrderInputSchema = z.object({
  user_id: z.number(),
  delivery_address: z.string().min(1),
  delivery_phone: z.string().min(1),
  notes: z.string().nullable().optional()
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export const updateOrderStatusInputSchema = z.object({
  id: z.number(),
  status: orderStatusSchema
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusInputSchema>;

export const getUserOrdersInputSchema = z.object({
  user_id: z.number()
});

export type GetUserOrdersInput = z.infer<typeof getUserOrdersInputSchema>;

export const getOrderInputSchema = z.object({
  id: z.number()
});

export type GetOrderInput = z.infer<typeof getOrderInputSchema>;

// Delivery schemas
export const deliverySchema = z.object({
  id: z.number(),
  order_id: z.number(),
  status: deliveryStatusSchema,
  estimated_delivery_time: z.coerce.date().nullable(),
  actual_delivery_time: z.coerce.date().nullable(),
  delivery_person_name: z.string().nullable(),
  delivery_person_phone: z.string().nullable(),
  tracking_notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Delivery = z.infer<typeof deliverySchema>;

export const createDeliveryInputSchema = z.object({
  order_id: z.number(),
  estimated_delivery_time: z.coerce.date().optional(),
  delivery_person_name: z.string().optional(),
  delivery_person_phone: z.string().optional()
});

export type CreateDeliveryInput = z.infer<typeof createDeliveryInputSchema>;

export const updateDeliveryInputSchema = z.object({
  id: z.number(),
  status: deliveryStatusSchema.optional(),
  estimated_delivery_time: z.coerce.date().nullable().optional(),
  actual_delivery_time: z.coerce.date().nullable().optional(),
  delivery_person_name: z.string().nullable().optional(),
  delivery_person_phone: z.string().nullable().optional(),
  tracking_notes: z.string().nullable().optional()
});

export type UpdateDeliveryInput = z.infer<typeof updateDeliveryInputSchema>;

export const getDeliveryByOrderInputSchema = z.object({
  order_id: z.number()
});

export type GetDeliveryByOrderInput = z.infer<typeof getDeliveryByOrderInputSchema>;