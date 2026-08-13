'use server';

import { connectToDatabase } from '../db';
import { OrderInputSchema } from '../validator';
import Order from '../db/models/order.model';
import { formatError } from '../utils';
import { Cart, OrderItem, ShippingAddress } from '@/types';
import { calcDeliveryDateAndPrice } from './calcDeliveryDateAndPrice'; // Adjusted path
import { round2 } from '../utils'; // Import round2 for consistency

export const createOrderFromCart = async (
  clientSideCart: Cart,
  userId: string,
) => {
  const cart = {
    ...clientSideCart,
    ...calcDeliveryDateAndPrice({
      items: clientSideCart.items,
      shippingAddress: clientSideCart.shippingAddress,
      deliveryDateIndex: clientSideCart.deliveryDateIndex,
    }),
  };

  const order = OrderInputSchema.parse({
    user: userId,
    items: cart.items,
    shippingAddress: cart.shippingAddress,
    paymentMethod: cart.paymentMethod,
    itemsPrice: cart.itemsPrice,
    shippingPrice: cart.shippingPrice,
    taxPrice: cart.taxPrice,
    totalPrice: cart.totalPrice,
    expectedDeliveryDate: cart.expectedDeliveryDate,
  });
  return await Order.create(order);
};
