/**
 * @file This file defines the Order domain model.
 * It hydrates references to User and Product (using ProductSummary for items).
 * Dependencies: entity.ts, user.ts, product-summary.ts
 */

import { Entity } from './entity';
import { User } from './user';
import { ProductSummary } from './product-summary';

export interface OrderItem {
  product: ProductSummary; // Hydrated Product summary object
  clientId: string; // A unique identifier for the product within the client's system (e.g., cart ID)
  name: string;
  slug: string;
  image: string;
  category: string;
  price: number;
  countInStock: number; // Snapshot of stock at time of order
  quantity: number;
  size?: string;
  color?: string;
}

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  province: string;
  phone: string;
}

export interface PaymentResult {
  id?: string;
  status?: string;
  email_address?: string;
}

export interface Order extends Entity {
  user: Partial<User>;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  expectedDeliveryDate: Date;
  paymentMethod: string;
  paymentResult?: PaymentResult;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: Date;
  isDelivered: boolean;
  deliveredAt?: Date;
}
