/**
 * @file This file defines the Review domain model.
 * It hydrates references to User and Product (using ProductSummary).
 * Dependencies: entity.ts, user.ts, product-summary.ts
 */

import { Entity } from './entity';
import { User } from './user';
import { ProductSummary } from './product-summary';

export interface Review extends Entity {
  user: User; // Hydrated User object
  isVerifiedPurchase: boolean;
  product: ProductSummary; // Hydrated Product summary to avoid deep recursion
  rating: number; // 1 to 5
  title: string;
  comment: string;
}
