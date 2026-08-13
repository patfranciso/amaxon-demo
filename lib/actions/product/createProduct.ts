'use server';

import { connectToDatabase } from '@/lib/db';
import Product from '@/lib/db/models/product.model';
import { PAGE_SIZE } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { formatError } from '@/lib/utils';
import { ProductInputSchema } from '@/lib/validator';
import { IProductInput } from '@/types';

export async function createProduct(data: IProductInput) {
  try {
    const product = ProductInputSchema.parse(data);
    await connectToDatabase();
    await Product.create(product);
    revalidatePath('/admin/products');
    return {
      success: true,
      message: 'Product created successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
