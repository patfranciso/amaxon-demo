'use server';

import { connectToDatabase } from '@/lib/db';
import Product, { IProduct } from '@/lib/db/models/product.model';

export async function getProductBySlug(slug: string) {
  await connectToDatabase();
  const product = await Product.findOne({ slug, isPublished: true });
  if (!product) throw new Error('Product not found');
  return JSON.parse(JSON.stringify(product)) as IProduct;
}
