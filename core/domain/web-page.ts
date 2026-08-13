/**
 * @file This file defines the WebPage domain model.
 * Dependencies: entity.ts
 */

import { Entity } from './entity';

export interface WebPage extends Entity {
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
}
