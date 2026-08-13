'use server';

import { connectToDatabase } from '@/lib/db';
import Product from '@/lib/db/models/product.model';
import { PAGE_SIZE } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { formatError } from '@/lib/utils';
import { ProductUpdateSchema } from '@/lib/validator';
import { z } from 'zod';

export async function updateProduct(data: z.infer<typeof ProductUpdateSchema>) {
  try {
    const product = ProductUpdateSchema.parse(data);
    await connectToDatabase();
    await Product.findByIdAndUpdate(product._id, product);
    revalidatePath('/admin/products');
    return {
      success: true,
      message: 'Product updated successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
