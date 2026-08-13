'use server';

import { connectToDatabase } from '@/lib/db';
import Order from '@/lib/db/models/order.model';
import { formatError } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export async function deleteOrder(id: string) {
  try {
    await connectToDatabase();
    const res = await Order.findByIdAndDelete(id);
    if (!res) throw new Error('Order not found');
    revalidatePath('/admin/orders');
    return {
      success: true,
      message: 'Order deleted successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
