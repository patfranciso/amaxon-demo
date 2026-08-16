import { cwd } from 'process';
import mongoose from 'mongoose';
import { loadEnvConfig } from '@next/env';
import { ObjectId } from 'mongodb';

import data from '@/lib/data';
import { connectToDatabase } from '@/lib/db';
import Product, { IProduct } from '@/lib/db/models/product.model';
import User from '@/lib/db/models/user.model';
import Review from '@/lib/db/models/review.model';
import Order from '@/lib/db/models/order.model';
import WebPage from '@/lib/db/models/web-page.model';
import { generateId, round2 } from '@/lib/utils';
import { AVAILABLE_DELIVERY_DATES } from '@/lib/constants';
import { IOrderInput, OrderItem } from '../types';

loadEnvConfig(cwd()); // Load environment variables from .env.local

// Helper to calculate a date in the past
function calculatePastDate(days: number, baseDate: Date = new Date()): Date {
  const pastDate = new Date(baseDate);
  pastDate.setDate(pastDate.getDate() - days);
  return pastDate;
}

// Helper to calculate a date in the future
function calculateFutureDate(days: number, baseDate: Date = new Date()): Date {
  const futureDate = new Date(baseDate);
  futureDate.setDate(futureDate.getDate() + days);
  return futureDate;
}

export async function seedTestDb() {
  console.log('Seeding database...');
  try {
    const { products, users, reviews, webPages } = data;
    await connectToDatabase(process.env.MONGODB_URI);

    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    await Review.deleteMany();
    await Order.deleteMany();
    await WebPage.deleteMany();

    // --- Seed WebPages ---
    await WebPage.insertMany(webPages);

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

    const createdProducts = await Product.insertMany(products);

    // Generate and insert reviews
    const reviewPromises = [];
    let userIndex = 0;
    for (const product of createdProducts) {
      if (product.ratingDistribution) {
        for (const { rating, count } of product.ratingDistribution) {
          for (let k = 0; k < count; k++) {
            const sampleReview = reviews.filter((r) => r.rating === rating)[
              k % reviews.filter((r) => r.rating === rating).length
            ];
            reviewPromises.push(
              Review.create({
                ...sampleReview,
                isVerifiedPurchase: true, // Assuming all seeded reviews are verified purchases
                product: product._id,
                user: createdUsers[userIndex % createdUsers.length]._id,
                updatedAt: new Date(),
                createdAt: new Date(),
              }),
            );
            userIndex++;
          }
        }
      }
    }
    await Promise.all(reviewPromises);

    // Generate and insert orders
    const orderPromises = [];
    for (let i = 0; i < 20; i++) {
      // Limit orders for faster seeding in tests
      orderPromises.push(
        generateTestOrder(
          i,
          createdUsers.map((u) => new ObjectId(u._id)),
          // @ts-ignore
          createdProducts,
        ),
      );
    }
    const generatedOrders = await Promise.all(orderPromises);
    await Order.insertMany(generatedOrders);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  } finally {
    // Optionally disconnect if running as a standalone script.
    // For Playwright, often better to leave open if `connectToDatabase` manages pooling.
  }
}

async function generateTestOrder(
  i: number,
  userIds: mongoose.Types.ObjectId[],
  products: mongoose.Document<unknown, object, IProduct>[] &
    Omit<IProduct & { _id: mongoose.Types.ObjectId }, never>[],
): Promise<IOrderInput> {
  const user = data.users[i % data.users.length]; // Get original user data for shipping address etc.
  const userObjectId = userIds[i % userIds.length];

  const productCount = Math.min(3, products.length);
  const selectedProducts = [];
  for (let pIdx = 0; pIdx < productCount; pIdx++) {
    const product = products[(i + pIdx) % products.length];
    if (product && product.images && product.images.length > 0) {
      selectedProducts.push(product);
    }
  }
  if (selectedProducts.length === 0 && products.length > 0) {
    // Fallback if no valid products picked, use the first one
    selectedProducts.push(products[0]);
  } else if (products.length === 0) {
    throw new Error('No products available to create an order.');
  }

  const orderItems: OrderItem[] = selectedProducts.map((p, idx) => ({
    clientId: generateId(),
    product: p._id.toString(),
    name: p.name,
    slug: p.slug,
    quantity: idx + 1, // Different quantities
    image: p.images[0],
    category: p.category,
    price: p.price,
    countInStock: p.countInStock,
    size: p.sizes.length > 0 ? p.sizes[0] : undefined,
    color: p.colors.length > 0 ? p.colors[0] : undefined,
  }));

  const itemsPrice = round2(
    orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
  );
  const deliveryDateOption =
    AVAILABLE_DELIVERY_DATES[i % AVAILABLE_DELIVERY_DATES.length];

  let shippingPrice = deliveryDateOption.shippingPrice;
  if (
    deliveryDateOption.freeShippingMinPrice > 0 &&
    itemsPrice >= deliveryDateOption.freeShippingMinPrice
  ) {
    shippingPrice = 0;
  }
  const taxPrice = round2(itemsPrice * 0.15); // Example tax rate
  const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);

  const createdAt = calculatePastDate(Math.floor(Math.random() * 60) + 1); // Orders spread over the last 60 days
  const isPaid = i % 2 === 0; // Roughly half are paid
  const paidAt = isPaid
    ? calculateFutureDate(
        0,
        calculatePastDate(Math.floor(Math.random() * 30), createdAt),
      )
    : undefined; // Paid sometime after creation
  const isDelivered = isPaid && i % 3 === 0; // Some delivered if paid
  const deliveredAt = isDelivered
    ? calculateFutureDate(Math.floor(Math.random() * 7) + 1, paidAt)
    : undefined; // Delivered after paid

  return {
    user: userObjectId.toString(),
    items: orderItems,
    shippingAddress: {
      fullName: user.name!,
      street: user.address?.street || '123 Test St',
      city: user.address?.city || 'Testville',
      province: user.address?.province || 'TS',
      postalCode: user.address?.postalCode || 'T1T 1T1',
      country: user.address?.country || 'Canada',
      phone: user.address?.phone || '111-222-3333',
    },
    paymentMethod: user.paymentMethod || 'Cash On Delivery',
    itemsPrice: itemsPrice,
    shippingPrice: shippingPrice,
    taxPrice: taxPrice,
    totalPrice: totalPrice,
    expectedDeliveryDate: calculateFutureDate(
      deliveryDateOption.daysToDeliver,
      createdAt,
    ), // Expected delivery relative to order creation
    isPaid: isPaid,
    paidAt: paidAt,
    isDelivered: isDelivered,
    deliveredAt: deliveredAt,
    // @ts-ignore
    createdAt: createdAt,
  };
}

// If run directly, seed the database
if (require.main === module) {
  seedTestDb()
    .then(() => {
      console.log('Seeding process completed.');
      if (!process.env.PLAYWRIGHT_TEST_BASE_URL) {
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
