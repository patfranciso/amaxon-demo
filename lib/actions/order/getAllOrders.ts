'use server';

import { PAGE_SIZE } from '@/lib/constants';
import { connectToDatabase } from '@/lib/db';
import Order from '@/lib/db/models/order.model';
import { IOrderList } from '@/types';

export async function getAllOrders({
  limit,
  page,
}: {
  limit?: number;
  page: number;
}) {
  limit = limit || PAGE_SIZE;
  await connectToDatabase();
  const skipAmount = (Number(page) - 1) * limit;
  const orders = await Order.find()
    .populate('user', 'name')
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit);
  const ordersCount = await Order.countDocuments();
  return {
    data: JSON.parse(JSON.stringify(orders)) as IOrderList[],
    totalPages: Math.ceil(ordersCount / limit),
  };
}
