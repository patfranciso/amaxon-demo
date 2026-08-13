/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import { cwd } from 'process';

import data from '@/lib/data';
import { connectToDatabase } from '@/lib/db/';
import Product from '@/lib/db/models/product.model';
import { loadEnvConfig } from '@next/env';
import User from '@/lib/db/models/user.model';
import Review from '@/lib/db/models/review.model';
import Order from '@/lib/db/models/order.model';
import { IOrderInput, OrderItem, ShippingAddress } from '@/types';
import {
  calculateFutureDate,
  calculatePastDate,
  generateId,
  round2,
} from '@/lib/utils';
import { AVAILABLE_DELIVERY_DATES } from '@/lib/constants';
import WebPage from '@/lib/db/models/web-page.model';

loadEnvConfig(cwd());

export default async function fixtures() {
  try {
    const { products, users, reviews, webPages } = data;
    await connectToDatabase(process.env.MONGODB_URI);

    await User.deleteMany();
    // --- Seed Users ---
    // Separate hardcoded test users from dynamically generated ones
    const hardcodedUsers = users.filter((u) => u._id); // Assuming _id is present for hardcoded ones
    const dynamicUsers = users
      .filter((u) => !u._id)
      .map((u) => ({
        ...u,
        _id: new mongoose.Types.ObjectId().toHexString(), // Generate new ObjectId for dynamic users
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    const allUsersToInsert = [...hardcodedUsers, ...dynamicUsers];
    const createdUsers = await User.insertMany(allUsersToInsert);
    // Map created users by ID for easy lookup
    const userMap = new Map(createdUsers.map((u) => [u._id.toString(), u]));

    await Product.deleteMany();
    // --- Seed Products ---
    const hardcodedProducts = products.filter((p) => p._id);
    const dynamicProducts = products
      .filter((p) => !p._id)
      .map((p) => ({
        ...p,
        _id: new mongoose.Types.ObjectId().toHexString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    const allProductsToInsert = [...hardcodedProducts, ...dynamicProducts];
    const createdProducts = await Product.insertMany(allProductsToInsert);
    const productMap = new Map(
      createdProducts.map((p) => [p._id.toString(), p]),
    );

    await Review.deleteMany();
    const rws = [];
    for (let i = 0; i < createdProducts.length; i++) {
      let x = 0;
      const { ratingDistribution } = createdProducts[i];
      for (let j = 0; j < ratingDistribution.length; j++) {
        for (let k = 0; k < ratingDistribution[j].count; k++) {
          x++;
          rws.push({
            ...reviews.filter((x) => x.rating === j + 1)[
              x % reviews.filter((x) => x.rating === j + 1).length
            ],
            isVerifiedPurchase: true,
            product: createdProducts[i]._id,
            user: createdUsers[x % createdUsers.length]._id,
            updatedAt: Date.now(),
            createdAt: Date.now(),
          });
        }
      }
    }
    const createdReviews = await Review.insertMany(rws);

    await Order.deleteMany();
    const orders = [];
    for (let i = 0; i < 200; i++) {
      orders.push(
        await generateOrder(
          i,
          createdUsers.map((x) => x._id),
          createdProducts.map((x) => x._id),
        ),
      );
    }
    const createdOrders = await Order.insertMany(orders);

    await WebPage.deleteMany();
    await WebPage.insertMany(webPages);
    console.log({
      createdUser: createdUsers,
      createdProducts,
      createdReviews,
      createdOrders,
      message: 'Seeded database successfully',
    });
    process.exit(0);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to seed database');
  }
}

const generateOrder = async (
  i: number,
  users: any,
  products: any,
): Promise<IOrderInput> => {
  const product1 = await Product.findById(products[i % products.length]);

  const product2 = await Product.findById(
    products[
      i % products.length >= products.length - 1
        ? (i % products.length) - 1
        : (i % products.length) + 1
    ],
  );
  const product3 = await Product.findById(
    products[
      i % products.length >= products.length - 2
        ? (i % products.length) - 2
        : (i % products.length) + 2
    ],
  );

  if (!product1 || !product2 || !product3) throw new Error('Product not found');

  const items = [
    {
      clientId: generateId(),
      product: product1._id,
      name: product1.name,
      slug: product1.slug,
      quantity: 1,
      image: product1.images[0],
      category: product1.category,
      price: product1.price,
      countInStock: product1.countInStock,
    },
    {
      clientId: generateId(),
      product: product2._id,
      name: product2.name,
      slug: product2.slug,
      quantity: 2,
      image: product2.images[0],
      category: product1.category,
      price: product2.price,
      countInStock: product1.countInStock,
    },
    {
      clientId: generateId(),
      product: product3._id,
      name: product3.name,
      slug: product3.slug,
      quantity: 3,
      image: product3.images[0],
      category: product1.category,
      price: product3.price,
      countInStock: product1.countInStock,
    },
  ];

  const order = {
    user: users[i % users.length],
    items: items.map((item) => ({
      ...item,
      product: item.product,
    })),
    shippingAddress: data.users[i % users.length].address,
    paymentMethod: data.users[i % users.length].paymentMethod,
    isPaid: true,
    isDelivered: true,
    paidAt: calculatePastDate(i),
    deliveredAt: calculatePastDate(i),
    createdAt: calculatePastDate(i),
    expectedDeliveryDate: calculateFutureDate(i % 2),
    ...calcDeliveryDateAndPriceForSeed({
      items: items,
      shippingAddress: data.users[i % users.length].address,
      deliveryDateIndex: i % 2,
    }),
  };
  return order;
};

export const calcDeliveryDateAndPriceForSeed = ({
  items,
  deliveryDateIndex,
}: {
  deliveryDateIndex?: number;
  items: OrderItem[];
  shippingAddress?: ShippingAddress;
}) => {
  const itemsPrice = round2(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0),
  );

  const deliveryDate =
    AVAILABLE_DELIVERY_DATES[
      deliveryDateIndex === undefined
        ? AVAILABLE_DELIVERY_DATES.length - 1
        : deliveryDateIndex
    ];

  const shippingPrice = deliveryDate.shippingPrice;

  const taxPrice = round2(itemsPrice * 0.15);
  const totalPrice = round2(
    itemsPrice +
      (shippingPrice ? round2(shippingPrice) : 0) +
      (taxPrice ? round2(taxPrice) : 0),
  );
  return {
    AVAILABLE_DELIVERY_DATES,
    deliveryDateIndex:
      deliveryDateIndex === undefined
        ? AVAILABLE_DELIVERY_DATES.length - 1
        : deliveryDateIndex,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  };
};
