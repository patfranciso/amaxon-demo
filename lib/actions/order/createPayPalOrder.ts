'use server';

import { connectToDatabase } from '@/lib/db';
import Order from '@/lib/db/models/order.model';
import { paypal } from '@/lib/paypal';
import { formatError } from '@/lib/utils';

export async function createPayPalOrder(orderId: string) {
  await connectToDatabase();
  try {
    const order = await Order.findById(orderId);
    if (order) {
      const paypalOrder = await paypal.createOrder(order.totalPrice);
      order.paymentResult = {
        id: paypalOrder.id,
        email_address: '',
        status: '',
        pricePaid: '0',
      };
      await order.save();
      return {
        success: true,
        message: 'PayPal order created successfully',
        data: paypalOrder.id,
      };
    } else {
      throw new Error('Order not found');
    }
  } catch (err) {
    return { success: false, message: formatError(err) };
  }
}
