'use server';

import { mongoosePorts, makeUpdateOrderToPaid } from '../updateOrderToPaid'; // Adjusted path

export async function updateOrderToPaid(orderId: string) {
  const action = makeUpdateOrderToPaid(mongoosePorts);
  const result = await action(orderId);

  // Convert Either<string, string> to { success: boolean, message: string }
  if (result.kind === 'left') {
    return { success: false, message: result.value };
  }
  return { success: true, message: result.value };
}
