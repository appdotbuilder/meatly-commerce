import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createUserInputSchema,
  updateUserInputSchema,
  createProductInputSchema,
  updateProductInputSchema,
  getProductsByCategoryInputSchema,
  addToCartInputSchema,
  updateCartItemInputSchema,
  removeFromCartInputSchema,
  getUserCartInputSchema,
  createOrderInputSchema,
  updateOrderStatusInputSchema,
  getUserOrdersInputSchema,
  getOrderInputSchema,
  createDeliveryInputSchema,
  updateDeliveryInputSchema,
  getDeliveryByOrderInputSchema,
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { updateUser } from './handlers/update_user';
import { getUser } from './handlers/get_user';
import { createProduct } from './handlers/create_product';
import { getProducts } from './handlers/get_products';
import { getProductsByCategory } from './handlers/get_products_by_category';
import { updateProduct } from './handlers/update_product';
import { addToCart } from './handlers/add_to_cart';
import { getUserCart } from './handlers/get_user_cart';
import { updateCartItem } from './handlers/update_cart_item';
import { removeFromCart } from './handlers/remove_from_cart';
import { clearCart } from './handlers/clear_cart';
import { createOrder } from './handlers/create_order';
import { getUserOrders } from './handlers/get_user_orders';
import { getOrder } from './handlers/get_order';
import { updateOrderStatus } from './handlers/update_order_status';
import { createDelivery } from './handlers/create_delivery';
import { updateDelivery } from './handlers/update_delivery';
import { getDeliveryByOrder } from './handlers/get_delivery_by_order';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  getUser: publicProcedure
    .input(getOrderInputSchema) // Reusing this schema as it just has an id field
    .query(({ input }) => getUser(input.id)),

  // Product catalog routes
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),

  getProducts: publicProcedure
    .query(() => getProducts()),

  getProductsByCategory: publicProcedure
    .input(getProductsByCategoryInputSchema)
    .query(({ input }) => getProductsByCategory(input)),

  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProduct(input)),

  // Shopping cart routes
  addToCart: publicProcedure
    .input(addToCartInputSchema)
    .mutation(({ input }) => addToCart(input)),

  getUserCart: publicProcedure
    .input(getUserCartInputSchema)
    .query(({ input }) => getUserCart(input)),

  updateCartItem: publicProcedure
    .input(updateCartItemInputSchema)
    .mutation(({ input }) => updateCartItem(input)),

  removeFromCart: publicProcedure
    .input(removeFromCartInputSchema)
    .mutation(({ input }) => removeFromCart(input)),

  clearCart: publicProcedure
    .input(getUserCartInputSchema)
    .mutation(({ input }) => clearCart(input)),

  // Order management routes
  createOrder: publicProcedure
    .input(createOrderInputSchema)
    .mutation(({ input }) => createOrder(input)),

  getUserOrders: publicProcedure
    .input(getUserOrdersInputSchema)
    .query(({ input }) => getUserOrders(input)),

  getOrder: publicProcedure
    .input(getOrderInputSchema)
    .query(({ input }) => getOrder(input)),

  updateOrderStatus: publicProcedure
    .input(updateOrderStatusInputSchema)
    .mutation(({ input }) => updateOrderStatus(input)),

  // Delivery tracking routes
  createDelivery: publicProcedure
    .input(createDeliveryInputSchema)
    .mutation(({ input }) => createDelivery(input)),

  updateDelivery: publicProcedure
    .input(updateDeliveryInputSchema)
    .mutation(({ input }) => updateDelivery(input)),

  getDeliveryByOrder: publicProcedure
    .input(getDeliveryByOrderInputSchema)
    .query(({ input }) => getDeliveryByOrder(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Meatly TRPC server listening at port: ${port}`);
}

start();