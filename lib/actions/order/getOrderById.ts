'use server';

import { connectToDatabase } from '@/lib/db';
import Order, { IOrder } from '@/lib/db/models/order.model';

export async function getOrderById(orderId: string): Promise<IOrder> {
  await connectToDatabase();
  const order = await Order.findById(orderId);
  return JSON.parse(JSON.stringify(order));
}
