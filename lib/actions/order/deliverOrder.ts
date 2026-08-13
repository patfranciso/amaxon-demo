'use server';

import { formatError, round2 } from '@/lib/utils';
import { connectToDatabase } from '@/lib/db';
import Order from '@/lib/db/models/order.model';
import { sendAskReviewOrderItems } from '@/emails';
import { revalidatePath } from 'next/cache';

export async function deliverOrder(orderId: string) {
  try {
    await connectToDatabase();
    const order = await Order.findById(orderId).populate<{
      user: { email: string; name: string };
    }>('user', 'name email');
    if (!order) throw new Error('Order not found');
    if (!order.isPaid) throw new Error('Order is not paid');
    order.isDelivered = true;
    order.deliveredAt = new Date();
    await order.save();
    if (order.user.email) await sendAskReviewOrderItems({ order });
    revalidatePath(`/account/orders/${orderId}`);
    return { success: true, message: 'Order delivered successfully' };
  } catch (err) {
    return { success: false, message: formatError(err) };
  }
}
