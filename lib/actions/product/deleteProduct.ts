'use server';

import { connectToDatabase } from '@/lib/db';
import Product from '@/lib/db/models/product.model';
import { revalidatePath } from 'next/cache';
import { formatError } from '@/lib/utils';

export async function deleteProduct(id: string) {
  try {
    await connectToDatabase();
    const res = await Product.findByIdAndDelete(id);
    if (!res) throw new Error('Product not found');
    revalidatePath('/admin/products');
    return {
      success: true,
      message: 'Product deleted successfully',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
