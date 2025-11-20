/**
 * Firebase Admin SDK Mock Utilities
 *
 * Provides reusable mock functions for Firebase Admin SDK
 * Use these in tests to mock Firebase authentication
 */

import { vi } from 'vitest';

/**
 * Mock decoded token for testing
 */
export interface MockDecodedToken {
  uid: string;
  userId?: string;
  email?: string;
  [key: string]: any;
}

/**
 * Creates a mock verifyIdToken function that resolves with provided token data
 */
export function createMockVerifyIdToken(decodedToken: MockDecodedToken) {
  return vi.fn().mockResolvedValue(decodedToken);
}

/**
 * Creates a mock verifyIdToken function that rejects with an error
 */
export function createMockVerifyIdTokenError(errorCode: string = 'auth/invalid-id-token') {
  return vi.fn().mockRejectedValue({
    code: errorCode,
    message: `Firebase error: ${errorCode}`,
  });
}

/**
 * Creates a mock setCustomUserClaims function
 */
export function createMockSetCustomUserClaims() {
  return vi.fn().mockResolvedValue(undefined);
}

/**
 * Default mock tokens for common test scenarios
 */
export const mockTokens = {
  /**
   * Valid token with userId custom claim (fully registered user)
   */
  validWithUserId: {
    uid: 'firebase-uid-123',
    userId: 'user-id-123',
    email: 'test@example.com',
  },

  /**
   * Valid token without userId custom claim (first-time user)
   */
  validWithoutUserId: {
    uid: 'firebase-uid-456',
    email: 'newuser@example.com',
  },

  /**
   * Different user token for testing authorization failures
   */
  differentUser: {
    uid: 'firebase-uid-789',
    userId: 'user-id-789',
    email: 'other@example.com',
  },
};

/**
 * Firebase error codes for testing different scenarios
 */
export const firebaseErrors = {
  INVALID_TOKEN: 'auth/invalid-id-token',
  EXPIRED_TOKEN: 'auth/id-token-expired',
  ARGUMENT_ERROR: 'auth/argument-error',
  USER_NOT_FOUND: 'auth/user-not-found',
};

/**
 * Helper to mock Firebase Admin module in tests
 *
 * @example
 * ```typescript
 * import { mockFirebaseAdmin } from '@tests/helpers/firebase-mocks';
 *
 * vi.mock('../../src/config/firebase-admin', () => mockFirebaseAdmin({
 *   uid: 'test-uid',
 *   userId: 'test-user-id'
 * }));
 * ```
 */
export function mockFirebaseAdmin(decodedToken?: MockDecodedToken) {
  const token = decodedToken || mockTokens.validWithUserId;

  return {
    verifyIdToken: createMockVerifyIdToken(token),
    setCustomUserClaims: createMockSetCustomUserClaims(),
  };
}

/**
 * Helper to reset all Firebase mocks
 * Call this in afterEach() to clean up between tests
 */
export function resetFirebaseMocks() {
  vi.restoreAllMocks();
}
