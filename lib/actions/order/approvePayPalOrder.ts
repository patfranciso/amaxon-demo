'use server';

import { connectToDatabase } from '@/lib/db';
import Order from '@/lib/db/models/order.model';
import { paypal } from '@/lib/paypal';
import { sendPurchaseReceipt } from '@/emails';
import { formatError } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export async function approvePayPalOrder(
  orderId: string,
  data: { orderID: string },
) {
  await connectToDatabase();
  try {
    const order = await Order.findById(orderId).populate('user', 'email');
    if (!order) throw new Error('Order not found');

    const captureData = await paypal.capturePayment(data.orderID);
    if (
      !captureData ||
      captureData.id !== order.paymentResult?.id ||
      captureData.status !== 'COMPLETED'
    )
      throw new Error('Error in paypal payment');
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = {
      id: captureData.id,
      status: captureData.status,
      email_address: captureData.payer.email_address,
      pricePaid:
        captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
    };
    await order.save();
    await sendPurchaseReceipt({ order });
    revalidatePath(`/account/orders/${orderId}`);
    return {
      success: true,
      message: 'Your order has been successfully paid by PayPal',
    };
  } catch (err) {
    return { success: false, message: formatError(err) };
  }
}
