/**
 * Test Data Factories
 *
 * Provides factory functions to generate test data for various entities
 * Ensures consistent test data across the test suite
 */

import { randomUUID } from 'crypto';

/**
 * Generates a valid profile object for testing
 */
export function createTestProfile(overrides?: Partial<any>) {
  return {
    firebaseUid: `firebase-uid-${randomUUID()}`,
    firstName: 'John',
    lastName: 'Doe',
    birthday: '01/15',
    email: `test-${randomUUID().substring(0, 8)}@example.com`,
    phoneNumber: '+1234567890',
    profileImage: 'https://example.com/profile.jpg',
    nickname: 'Johnny',
    status: 'Active',
    ...overrides,
  };
}

/**
 * Generates a valid budget object for testing
 */
export function createTestBudget(userId: string, overrides?: Partial<any>) {
  return {
    id: randomUUID(),
    userId,
    month: 'January',
    year: 2025,
    amount: 5000,
    remaining: 5000,
    ...overrides,
  };
}

/**
 * Generates a valid category object for testing
 */
export function createTestCategory(userId: string, overrides?: Partial<any>) {
  return {
    id: randomUUID(),
    userId,
    name: 'Groceries',
    type: 'expense',
    ...overrides,
  };
}

/**
 * Generates a valid transaction object for testing
 */
export function createTestTransaction(userId: string, overrides?: Partial<any>) {
  return {
    id: randomUUID(),
    userId,
    vendorName: 'Whole Foods',
    description: 'Weekly groceries',
    dateTime: new Date('2025-01-25T14:30:00Z'),
    amount: 125.50,
    paymentType: 'credit',
    categoryName: 'Groceries',
    ...overrides,
  };
}

/**
 * Generates a valid receipt object for testing
 */
export function createTestReceipt(userId: string, overrides?: Partial<any>) {
  return {
    id: randomUUID(),
    userId,
    vendorName: 'Target',
    description: 'Home supplies',
    dateTime: new Date('2025-01-26T10:00:00Z'),
    amount: 75.25,
    paymentType: 'debit',
    categoryName: 'Home',
    receiptImageUrl: 'https://example.com/receipt.jpg',
    ...overrides,
  };
}

/**
 * Generates multiple test profiles
 */
export function createTestProfiles(count: number): any[] {
  return Array.from({ length: count }, (_, i) =>
    createTestProfile({
      firstName: `User${i + 1}`,
      email: `user${i + 1}@example.com`,
    })
  );
}

/**
 * Generates multiple test transactions for spending history testing
 */
export function createTestTransactions(
  userId: string,
  count: number,
  dateRange?: { start: Date; end: Date }
): any[] {
  return Array.from({ length: count }, (_, i) => {
    let dateTime = new Date();

    if (dateRange) {
      const timeSpan = dateRange.end.getTime() - dateRange.start.getTime();
      const randomTime = dateRange.start.getTime() + Math.random() * timeSpan;
      dateTime = new Date(randomTime);
    }

    return createTestTransaction(userId, {
      vendorName: `Vendor ${i + 1}`,
      amount: Math.random() * 200 + 10, // Random amount between 10 and 210
      dateTime,
    });
  });
}

/**
 * Common test JWT tokens
 */
export const testTokens = {
  validToken: 'valid-jwt-token-123',
  expiredToken: 'expired-jwt-token-456',
  invalidToken: 'invalid-jwt-token-789',
  malformedToken: 'malformed-token',
};

/**
 * Common test user IDs
 */
export const testUserIds = {
  user1: 'test-user-id-1',
  user2: 'test-user-id-2',
  admin: 'test-admin-id',
};

/**
 * Common Firebase UIDs
 */
export const testFirebaseUids = {
  user1: 'firebase-uid-1',
  user2: 'firebase-uid-2',
  admin: 'firebase-admin-uid',
};
