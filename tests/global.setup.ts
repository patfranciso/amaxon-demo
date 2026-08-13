import { seedTestDb } from '@/e2e/seedTestDb';
import { test as setup } from '@playwright/test';

setup('Create test database', async ({}) => {
  console.log('Creating test database...');
  // Initialize the database
  // await seedTestDb();
});
