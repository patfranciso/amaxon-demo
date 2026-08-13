/**
 * @file This file defines a summary interface for the Product domain model.
 * This is used to prevent deep circular hydration when a Product is referenced
 * within another entity (e.g., Review or OrderItem) where a full Product object
 * is not necessary and could lead to infinite recursion.
 * Dependencies: entity.ts
 */

import { Entity } from './entity';

export interface ProductSummary extends Entity {
  name: string;
  slug: string;
  category: string;
  images: string[];
  brand: string;
  price: number;
  listPrice: number;
  countInStock: number;
  // Add any other essential fields needed for a concise product representation
}
