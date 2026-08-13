'use server';

import { PAGE_SIZE } from '@/lib/constants';
import { connectToDatabase } from '@/lib/db';
import { auth } from '@/auth';
import Order from '@/lib/db/models/order.model';
import { IOrderList } from '@/types';

export async function getMyOrders({
  limit,
  page,
}: {
  limit?: number;
  page: number;
}) {
  limit = limit || PAGE_SIZE;
  await connectToDatabase();
  const session = await auth();
  if (!session) {
    throw new Error('User is not authenticated');
  }
  const skipAmount = (Number(page) - 1) * limit;
  const orders = await Order.find({
    user: session?.user?.id,
  })
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit);
  const ordersCount = await Order.countDocuments({ user: session?.user?.id });

  return {
    data: JSON.parse(JSON.stringify(orders)),
    totalPages: Math.ceil(ordersCount / limit),
  };
}
