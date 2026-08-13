/**
 * @file This file defines the User domain model.
 * Dependencies: entity.ts
 */

import { Entity } from './entity';

export interface User extends Entity {
  email: string;
  name: string;
  role: 'Admin' | 'User'; // Assuming a fixed set of roles
  password?: string; // Password might not always be retrieved in the domain model
  image?: string;
  emailVerified: boolean;
}
