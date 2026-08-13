/**
 * @file This file defines the Product domain model.
 * It hydrates references to Review.
 * Dependencies: entity.ts, review.ts
 */

import { Entity } from './entity';
import { Review } from './review';

export interface RatingDistributionItem {
  rating: number;
  count: number;
}

export interface Product extends Entity {
  name: string;
  slug: string;
  category: string;
  images: string[];
  brand: string;
  description?: string;
  price: number;
  listPrice: number;
  countInStock: number;
  tags: string[];
  colors: string[];
  sizes: string[];
  avgRating: number;
  numReviews: number;
  ratingDistribution: RatingDistributionItem[];
  numSales: number;
  isPublished: boolean;
  reviews: Review[]; // Hydrated array of Review objects
}
