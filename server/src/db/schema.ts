import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const productCategoryEnum = pgEnum('product_category', ['chicken', 'fish', 'meat']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']);
export const deliveryStatusEnum = pgEnum('delivery_status', ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  full_name: text('full_name').notNull(),
  phone: text('phone'), // Nullable by default
  address: text('address'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Products table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  category: productCategoryEnum('category').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  unit: text('unit').notNull(), // e.g., 'kg', 'piece', 'lb'
  stock_quantity: integer('stock_quantity').notNull(),
  image_url: text('image_url'), // Nullable by default
  is_available: boolean('is_available').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Cart items table
export const cartItemsTable = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  product_id: integer('product_id').notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Orders table
export const ordersTable = pgTable('orders', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum('status').notNull().default('pending'),
  delivery_address: text('delivery_address').notNull(),
  delivery_phone: text('delivery_phone').notNull(),
  notes: text('notes'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Order items table
export const orderItemsTable = pgTable('order_items', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id').notNull().references(() => ordersTable.id, { onDelete: 'cascade' }),
  product_id: integer('product_id').notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  unit_price: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  total_price: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
});

// Deliveries table
export const deliveriesTable = pgTable('deliveries', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id').notNull().references(() => ordersTable.id, { onDelete: 'cascade' }),
  status: deliveryStatusEnum('status').notNull().default('pending'),
  estimated_delivery_time: timestamp('estimated_delivery_time'), // Nullable by default
  actual_delivery_time: timestamp('actual_delivery_time'), // Nullable by default
  delivery_person_name: text('delivery_person_name'), // Nullable by default
  delivery_person_phone: text('delivery_person_phone'), // Nullable by default
  tracking_notes: text('tracking_notes'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  cartItems: many(cartItemsTable),
  orders: many(ordersTable),
}));

export const productsRelations = relations(productsTable, ({ many }) => ({
  cartItems: many(cartItemsTable),
  orderItems: many(orderItemsTable),
}));

export const cartItemsRelations = relations(cartItemsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [cartItemsTable.user_id],
    references: [usersTable.id],
  }),
  product: one(productsTable, {
    fields: [cartItemsTable.product_id],
    references: [productsTable.id],
  }),
}));

export const ordersRelations = relations(ordersTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [ordersTable.user_id],
    references: [usersTable.id],
  }),
  items: many(orderItemsTable),
  delivery: one(deliveriesTable),
}));

export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [orderItemsTable.order_id],
    references: [ordersTable.id],
  }),
  product: one(productsTable, {
    fields: [orderItemsTable.product_id],
    references: [productsTable.id],
  }),
}));

export const deliveriesRelations = relations(deliveriesTable, ({ one }) => ({
  order: one(ordersTable, {
    fields: [deliveriesTable.order_id],
    references: [ordersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;

export type CartItem = typeof cartItemsTable.$inferSelect;
export type NewCartItem = typeof cartItemsTable.$inferInsert;

export type Order = typeof ordersTable.$inferSelect;
export type NewOrder = typeof ordersTable.$inferInsert;

export type OrderItem = typeof orderItemsTable.$inferSelect;
export type NewOrderItem = typeof orderItemsTable.$inferInsert;

export type Delivery = typeof deliveriesTable.$inferSelect;
export type NewDelivery = typeof deliveriesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  products: productsTable,
  cartItems: cartItemsTable,
  orders: ordersTable,
  orderItems: orderItemsTable,
  deliveries: deliveriesTable,
};