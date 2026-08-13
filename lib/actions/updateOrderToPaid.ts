// 'use server';

import mongoose from 'mongoose';
import { revalidatePath as realRevalidatePath } from 'next/cache';

import { formatError as realFormatError } from '../utils';
import { connectToDatabase } from '../db';
import OrderModel, { IOrder } from '../db/models/order.model'; // Renamed from Order to OrderModel to avoid type collision
import { sendPurchaseReceipt as realSendPurchaseReceipt } from '@/emails';
import ProductModel from '../db/models/product.model'; // Renamed from Product to ProductModel
import { Either, left, right } from '@/types/fp';
import { User } from '@/core/domain/user';
import { OrderItem } from '@/core/domain/order';

// --- 2. Core Entity Interfaces (simplified for clarity) ---
// These define the shape of data our business logic expects/returns, independent of DB models.
export interface UserInfo extends Partial<User> {
  email: string;
  name: string;
}

export interface OrderItemInfo extends Partial<OrderItem> {
  productId: string; // Product ID
  quantity: number;
}

export interface OrderInfo /* extends Partial<Order> */ {
  _id: string;
  user: UserInfo;
  isPaid: boolean;
  paidAt?: Date;
  items: OrderItemInfo[];
  // Add other essential fields if needed by business logic
}

// --- 3. Ports export Interface ---
// This contract defines all external capabilities our business logic needs.
export interface UpdateOrderToPaidPorts {
  getOrderById: (orderId: string) => Promise<Either<Error, OrderInfo>>;
  markOrderAsPaid: (orderId: string) => Promise<Either<Error, OrderInfo>>; // Returns the updated order with user info
  updateProductStock: (
    orderId: string,
    orderItems: OrderItemInfo[],
  ) => Promise<Either<Error, boolean>>;
  sendPurchaseReceipt: (order: OrderInfo) => Promise<Either<Error, boolean>>;
  revalidateOrderPath: (orderId: string) => void;
  isLocalDevEnvironment: () => boolean;
  formatErrorMessage: (error: unknown) => string;
}

// --- 4. Main Business Logic Function (`makeUpdateOrderToPaid`) ---
// This function contains the core logic, decoupled from specific implementations.
// It takes 'ports' as an argument, making it testable by injecting mocks.
export function makeUpdateOrderToPaid(ports: UpdateOrderToPaidPorts) {
  return async function updateOrderToPaid(
    orderId: string,
  ): Promise<Either<string, string>> {
    const {
      getOrderById,
      markOrderAsPaid,
      updateProductStock,
      sendPurchaseReceipt,
      revalidateOrderPath,
      isLocalDevEnvironment,
      formatErrorMessage,
    } = ports;

    try {
      // Step 1: Retrieve the order
      const orderResult = await getOrderById(orderId);
      if (orderResult.kind === 'left') {
        return left(formatErrorMessage(orderResult.value));
      }
      const order = orderResult.value;

      // Step 2: Check if order is already paid
      if (order.isPaid) {
        return left('Order is already paid');
      }

      // Step 3: Mark order as paid
      const paidOrderResult = await markOrderAsPaid(orderId);
      if (paidOrderResult.kind === 'left') {
        return left(formatErrorMessage(paidOrderResult.value));
      }
      const paidOrder = paidOrderResult.value;

      // Step 4: Update product stock (only if not local development)
      if (!isLocalDevEnvironment()) {
        const stockUpdateResult = await updateProductStock(
          orderId,
          paidOrder.items,
        );
        if (stockUpdateResult.kind === 'left') {
          // If stock update fails, this is a critical error.
          // Depending on business rules, one might:
          // a) Attempt to revert the order payment status (complex, often needs separate "undo" logic).
          // b) Report the error and potentially notify an administrator, leaving the order paid but stock incorrect.
          // For this example, we'll treat it as a critical failure and return an error.
          return left(formatErrorMessage(stockUpdateResult.value));
        }
      }

      // Step 5: Send purchase receipt (if customer email is available)
      if (paidOrder.user?.email) {
        const receiptResult = await sendPurchaseReceipt(paidOrder);
        if (receiptResult.kind === 'left') {
          // Sending a receipt might be considered less critical than payment or stock updates.
          // We can log the error and allow the overall operation to succeed.
          // If it were critical, we'd return `left` here.
          console.warn(
            `Failed to send purchase receipt for order ${orderId}: ${formatErrorMessage(receiptResult.value)}`,
          );
        }
      }

      // Step 6: Revalidate UI path
      revalidateOrderPath(orderId);

      return right('Order paid successfully');
    } catch (err) {
      // Catch any unexpected synchronous errors
      return left(formatErrorMessage(err));
    }
  };
}

// --- 5. Mongoose-specific Implementation of Ports ---
// This is the concrete "adapter" that plugs the Mongoose/Next.js infrastructure
// into the abstract Ports interface.

// Helper for Mongoose transaction specific to stock updates
const mongooseUpdateProductStockTransaction = async (
  orderId: string, // Not directly used in the loop, but useful for logging context
  orderItems: OrderItemInfo[],
): Promise<Either<Error, boolean>> => {
  await connectToDatabase();
  const session = await mongoose.connection.startSession();

  try {
    session.startTransaction();
    const opts = { session };

    for (const item of orderItems) {
      const product = await ProductModel.findById(item.productId).session(
        session,
      );
      if (!product) {
        throw new Error(
          `Product with ID ${item.productId} not found during stock update`,
        );
      }

      // Basic check for sufficient stock before attempting to decrement
      if (product.countInStock < item.quantity) {
        throw new Error(
          `Insufficient stock for product '${product._id}'. Available: ${product.countInStock}, Ordered: ${item.quantity}`,
        );
      }

      // Use $inc for atomic decrement of countInStock
      await ProductModel.updateOne(
        { _id: product._id },
        { $inc: { countInStock: -item.quantity } },
        opts,
      );
    }
    await session.commitTransaction();
    session.endSession();
    return right(true);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return left(error as Error);
  }
};

export const mongoosePorts: UpdateOrderToPaidPorts = {
  getOrderById: async (orderId: string) => {
    await connectToDatabase();
    const order = await OrderModel.findById(orderId).populate<{
      user: { email: string; name: string };
    }>('user', 'name email');
    if (!order) return left(new Error('Order not found'));

    return right({
      _id: order._id.toString(),
      user: { email: order.user?.email || '', name: order.user?.name || '' },
      isPaid: order.isPaid,
      paidAt: order.paidAt,
      items: order.items.map((item) => ({
        productId: item.product.toString(),
        quantity: item.quantity,
      })),
    });
  },

  markOrderAsPaid: async (orderId: string) => {
    await connectToDatabase();
    // First, find the order
    const order = await OrderModel.findById(orderId);
    if (!order) return left(new Error('Order not found'));
    if (order.isPaid) return left(new Error('Order is already paid')); // Defensive check

    // Update the order
    order.isPaid = true;
    order.paidAt = new Date();
    await order.save();

    // Re-fetch with populate to ensure the 'user' object is available for the returned Order interface
    const updatedOrder = await OrderModel.findById(orderId).populate<{
      user: { email: string; name: string };
    }>('user', 'name email');
    if (!updatedOrder) return left(new Error('Order not found after update')); // Should not happen

    return right({
      _id: updatedOrder._id.toString(),
      user: {
        email: updatedOrder.user?.email || '',
        name: updatedOrder.user?.name || '',
      },
      isPaid: updatedOrder.isPaid,
      paidAt: updatedOrder.paidAt,
      items: updatedOrder.items.map((item) => ({
        productId: item.product.toString(),
        quantity: item.quantity,
      })),
    });
  },

  updateProductStock: async (orderId: string, orderItems: OrderItemInfo[]) => {
    // Delegates to the Mongoose transactional helper
    return mongooseUpdateProductStockTransaction(orderId, orderItems);
  },

  sendPurchaseReceipt: async (order: OrderInfo) => {
    try {
      // The realSendPurchaseReceipt expects a Mongoose document.
      // A proper Data Transfer Object (DTO) mapper would convert 'Order' to the expected format.
      // For this example, we cast to 'any' for simplicity, acknowledging it's a potential type weakness.
      await realSendPurchaseReceipt({ order: order as unknown as IOrder });
      return right(true);
    } catch (err) {
      return left(err as Error);
    }
  },

  revalidateOrderPath: (orderId: string) => {
    realRevalidatePath(`/account/orders/${orderId}`);
  },

  isLocalDevEnvironment: () =>
    process.env.MONGODB_URI?.startsWith('mongodb://localhost') || false,

  formatErrorMessage: (err: unknown) => realFormatError(err),
};

// --- 6. Original Next.js Server Action Entry Point ---
// This function remains the public API of the server action,
// but now uses the testable core logic with concrete ports.
export async function updateOrderToPaid(orderId: string) {
  const action = makeUpdateOrderToPaid(mongoosePorts); // Inject concrete dependencies
  const result = await action(orderId); // Execute the core logic

  // Convert Either<string, string> to { success: boolean, message: string }
  if (result.kind === 'left') {
    return { success: false, message: result.value };
  }
  return { success: true, message: result.value };
}
