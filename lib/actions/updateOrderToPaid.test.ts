import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import dotenv from 'dotenv';

import {
  makeUpdateOrderToPaid,
  UpdateOrderToPaidPorts,
  OrderInfo,
  OrderItemInfo,
} from './updateOrderToPaid';
// import {
//   Order as OrderInfo,
//   // OrderItem as OrderItemInfo
// } from '@/core/domain/order';
import { right, left } from '@/types/fp';

dotenv.config({ path: '.env.local' });

// Mock Data
const MOCK_ORDER_ID = '65d1d7b3a0b7e2c9f8a4b2c1'; // Example valid ObjectId string
const MOCK_PRODUCT_ID_1 = '65d1d7b3a0b7e2c9f8a4b2c2';
const MOCK_PRODUCT_ID_2 = '65d1d7b3a0b7e2c9f8a4b2c3';

const MOCK_ORDER_ITEMS: OrderItemInfo[] = [
  { productId: MOCK_PRODUCT_ID_1, quantity: 2 },
  { productId: MOCK_PRODUCT_ID_2, quantity: 1 },
];

const MOCK_UNPAID_ORDER: OrderInfo = {
  _id: MOCK_ORDER_ID,
  user: { email: 'test@example.com', name: 'Test User' },
  isPaid: false,
  items: MOCK_ORDER_ITEMS,
  paidAt: undefined,
};

const MOCK_PAID_ORDER: OrderInfo = {
  ...MOCK_UNPAID_ORDER,
  isPaid: true,
  paidAt: new Date(), // Will be set by markOrderAsPaid
};

const MOCK_ORDER_WITHOUT_EMAIL: OrderInfo = {
  ...MOCK_UNPAID_ORDER,
  user: { email: '', name: 'No Email User' },
};

// Mock Dependencies object
let mockDependencies: UpdateOrderToPaidPorts;

beforeEach(() => {
  // Reset all mocks before each test
  mockDependencies = {
    getOrderById: vi.fn(),
    markOrderAsPaid: vi.fn(),
    updateProductStock: vi.fn(),
    sendPurchaseReceipt: vi.fn(),
    revalidateOrderPath: vi.fn(),
    isLocalDevEnvironment: vi.fn(() => false), // Default to non-local dev for stock updates
    formatErrorMessage: vi.fn((e: unknown) =>
      e instanceof Error ? e.message : String(e),
    ),
  };

  // Ensure MOCK_PAID_ORDER has a consistent paidAt date for comparisons
  MOCK_PAID_ORDER.paidAt = new Date('2023-01-01T12:00:00.000Z'); // Example fixed date
  vi.setSystemTime(MOCK_PAID_ORDER.paidAt); // Fix system time for new Date() calls
});

afterEach(() => {
  vi.useRealTimers(); // Restore real timers
});

describe('updateOrderToPaid action', () => {
  describe('Happy Path', () => {
    it('should successfully mark an order as paid, update stock, send receipt, and revalidate path', async () => {
      // Arrange: Set up mocks for a successful flow
      mockDependencies.getOrderById = vi.fn(async () =>
        right(MOCK_UNPAID_ORDER),
      );
      mockDependencies.markOrderAsPaid = vi.fn(async () =>
        right(MOCK_PAID_ORDER),
      );
      mockDependencies.updateProductStock = vi.fn(async () => right(true));
      mockDependencies.sendPurchaseReceipt = vi.fn(async () => right(true));
      mockDependencies.revalidateOrderPath = vi.fn(async () => () => {}); // No return value for void functions

      // Act: Call the function under test
      const updateOrderAction = makeUpdateOrderToPaid(mockDependencies);
      const result = await updateOrderAction(MOCK_ORDER_ID);

      // Assert: Check the result and that dependencies were called correctly
      expect(result.kind).toBe('right');
      expect(result.value).toBe('Order paid successfully');

      expect(mockDependencies.getOrderById).toHaveBeenCalledTimes(1);
      expect(mockDependencies.getOrderById).toHaveBeenCalledWith(MOCK_ORDER_ID);

      expect(mockDependencies.markOrderAsPaid).toHaveBeenCalledTimes(1);
      expect(mockDependencies.markOrderAsPaid).toHaveBeenCalledWith(
        MOCK_ORDER_ID,
      );

      expect(mockDependencies.updateProductStock).toHaveBeenCalledTimes(1);
      expect(mockDependencies.updateProductStock).toHaveBeenCalledWith(
        MOCK_ORDER_ID,
        MOCK_ORDER_ITEMS,
      ); // Ensure items are passed

      expect(mockDependencies.sendPurchaseReceipt).toHaveBeenCalledTimes(1);
      expect(mockDependencies.sendPurchaseReceipt).toHaveBeenCalledWith(
        MOCK_PAID_ORDER,
      ); // Ensure updated order is passed

      expect(mockDependencies.revalidateOrderPath).toHaveBeenCalledTimes(1);
      expect(mockDependencies.revalidateOrderPath).toHaveBeenCalledWith(
        MOCK_ORDER_ID,
      );

      expect(mockDependencies.isLocalDevEnvironment).toHaveBeenCalledTimes(1); // Check environment
      expect(mockDependencies.formatErrorMessage).not.toHaveBeenCalled(); // No errors
    });

    it('should skip stock update if in local development environment', async () => {
      // Arrange
      mockDependencies.getOrderById = vi.fn(async () =>
        right(MOCK_UNPAID_ORDER),
      );
      mockDependencies.markOrderAsPaid = vi.fn(async () =>
        right(MOCK_PAID_ORDER),
      );
      mockDependencies.sendPurchaseReceipt = vi.fn(async () => right(true));
      mockDependencies.revalidateOrderPath = vi.fn(async () => () => {});
      mockDependencies.isLocalDevEnvironment = vi.fn(() => true); // Simulate local dev

      // Act
      const updateOrderAction = makeUpdateOrderToPaid(mockDependencies);
      const result = await updateOrderAction(MOCK_ORDER_ID);

      // Assert
      expect(result.kind).toBe('right');
      expect(result.value).toBe('Order paid successfully');

      expect(mockDependencies.updateProductStock).not.toHaveBeenCalled(); // Stock update skipped
      expect(mockDependencies.isLocalDevEnvironment).toHaveBeenCalledTimes(1);
    });

    it('should still succeed if sending purchase receipt fails (non-critical error)', async () => {
      // Arrange
      mockDependencies.getOrderById = vi.fn(async () =>
        right(MOCK_UNPAID_ORDER),
      );
      mockDependencies.markOrderAsPaid = vi.fn(async () =>
        right(MOCK_PAID_ORDER),
      );
      mockDependencies.updateProductStock = vi.fn(async () => right(true));
      mockDependencies.sendPurchaseReceipt = vi.fn(async () =>
        left(new Error('Email service is down')),
      );
      mockDependencies.revalidateOrderPath = vi.fn(async () => () => {});

      // Spy on console.warn to check if the warning is logged
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      // Act
      const updateOrderAction = makeUpdateOrderToPaid(mockDependencies);
      const result = await updateOrderAction(MOCK_ORDER_ID);

      // Assert
      expect(result.kind).toBe('right');
      expect(result.value).toBe('Order paid successfully'); // Operation still succeeds
      expect(mockDependencies.sendPurchaseReceipt).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        // expect.stringMatching('Failed to send purchase receipt for order'),
        // expect.stringContaining('Email service is down'),
        expect.stringMatching(
          /Failed to send purchase receipt for order \w+: Email service is down/,
        ),
      );
      expect(mockDependencies.revalidateOrderPath).toHaveBeenCalledTimes(1); // Revalidation still happens
      consoleWarnSpy.mockRestore(); // Clean up the spy
    });

    it('should not send purchase receipt if user email is missing', async () => {
      // Arrange
      mockDependencies.getOrderById = vi.fn(async () =>
        right(MOCK_ORDER_WITHOUT_EMAIL),
      );
      // Simulate `markOrderAsPaid` returning the order without an email
      mockDependencies.markOrderAsPaid = vi.fn(async () =>
        right({
          ...MOCK_PAID_ORDER,
          user: { name: 'No Email User', email: '' },
        }),
      );
      mockDependencies.updateProductStock = vi.fn(async () => right(true));
      mockDependencies.revalidateOrderPath = vi.fn(async () => () => {});

      // Act
      const updateOrderAction = makeUpdateOrderToPaid(mockDependencies);
      const result = await updateOrderAction(MOCK_ORDER_ID);

      // Assert
      expect(result.kind).toBe('right');
      expect(result.value).toBe('Order paid successfully');
      expect(mockDependencies.sendPurchaseReceipt).not.toHaveBeenCalled(); // Receipt not sent
    });
  });

  describe('Fail Paths', () => {
    it('should return left if order is not found', async () => {
      // Arrange
      mockDependencies.getOrderById = vi.fn(async () =>
        left(new Error('Order not found')),
      );

      // Act
      const updateOrderAction = makeUpdateOrderToPaid(mockDependencies);
      const result = await updateOrderAction(MOCK_ORDER_ID);

      // Assert
      expect(result.kind).toBe('left');
      expect(result.value).toBe('Order not found'); // Message from formatErrorMessage
      expect(mockDependencies.markOrderAsPaid).not.toHaveBeenCalled(); // Subsequent steps skipped
      expect(mockDependencies.updateProductStock).not.toHaveBeenCalled();
      expect(mockDependencies.sendPurchaseReceipt).not.toHaveBeenCalled();
      expect(mockDependencies.revalidateOrderPath).not.toHaveBeenCalled();
    });

    it('should return left if order is already paid', async () => {
      // Arrange
      mockDependencies.getOrderById = vi.fn(async () => right(MOCK_PAID_ORDER)); // Order is already paid

      // Act
      const updateOrderAction = makeUpdateOrderToPaid(mockDependencies);
      const result = await updateOrderAction(MOCK_ORDER_ID);

      // Assert
      expect(result.kind).toBe('left');
      expect(result.value).toBe('Order is already paid');
      expect(mockDependencies.markOrderAsPaid).not.toHaveBeenCalled(); // No attempt to mark as paid again
      expect(mockDependencies.updateProductStock).not.toHaveBeenCalled();
    });

    it('should return left if marking order as paid fails', async () => {
      // Arrange
      mockDependencies.getOrderById = vi.fn(async () =>
        right(MOCK_UNPAID_ORDER),
      );
      mockDependencies.markOrderAsPaid = vi.fn(async () =>
        left(new Error('Database error during payment update')),
      );

      // Act
      const updateOrderAction = makeUpdateOrderToPaid(mockDependencies);
      const result = await updateOrderAction(MOCK_ORDER_ID);

      // Assert
      expect(result.kind).toBe('left');
      expect(result.value).toBe('Database error during payment update');
      expect(mockDependencies.markOrderAsPaid).toHaveBeenCalledTimes(1);
      expect(mockDependencies.updateProductStock).not.toHaveBeenCalled(); // Subsequent steps skipped
      expect(mockDependencies.sendPurchaseReceipt).not.toHaveBeenCalled();
      expect(mockDependencies.revalidateOrderPath).not.toHaveBeenCalled();
    });

    it('should return left if updating product stock fails (non-local dev)', async () => {
      // Arrange
      mockDependencies.getOrderById = vi.fn(async () =>
        right(MOCK_UNPAID_ORDER),
      );
      mockDependencies.markOrderAsPaid = vi.fn(async () =>
        right(MOCK_PAID_ORDER),
      );
      mockDependencies.updateProductStock = vi.fn(async () =>
        left(new Error('Insufficient stock for product X')),
      );
      mockDependencies.isLocalDevEnvironment = vi.fn(() => false); // Ensure stock update is attempted

      // Act
      const updateOrderAction = makeUpdateOrderToPaid(mockDependencies);
      const result = await updateOrderAction(MOCK_ORDER_ID);

      // Assert
      expect(result.kind).toBe('left');
      expect(result.value).toBe('Insufficient stock for product X');
      expect(mockDependencies.updateProductStock).toHaveBeenCalledTimes(1);
      expect(mockDependencies.sendPurchaseReceipt).not.toHaveBeenCalled(); // Subsequent steps skipped
      expect(mockDependencies.revalidateOrderPath).not.toHaveBeenCalled();
    });

    it('should return left if an unexpected generic error occurs', async () => {
      // Arrange: Simulate a synchronous error during order retrieval
      mockDependencies.getOrderById = vi.fn(async () => {
        throw new Error('Unexpected connection failure');
        // return left(Error('Unexpected connection failure')) as Either<
        //   Error,
        //   Order
        // >;
      });

      // Act
      const updateOrderAction = makeUpdateOrderToPaid(mockDependencies);
      const result = await updateOrderAction(MOCK_ORDER_ID);

      // Assert
      expect(result.kind).toBe('left');
      // expect(result.value).toBe(
      //   "Cannot read properties of undefined (reading 'isPaid')",
      // );
      expect(result.value).toBe('Unexpected connection failure');
      expect(mockDependencies.formatErrorMessage).toHaveBeenCalledTimes(1);
    });
  });
});
