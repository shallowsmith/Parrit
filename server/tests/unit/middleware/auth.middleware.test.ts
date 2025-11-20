/**
 * Authentication Middleware Unit Tests
 *
 * Tests the JWT authentication and authorization middleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { authenticateToken, requireSameUser } from '../../../src/middleware/auth.middleware';
import { mockTokens, firebaseErrors } from '../../helpers/firebase-mocks';

// Mock Firebase Admin SDK
vi.mock('../../../src/config/firebase-admin', () => ({
  verifyIdToken: vi.fn(),
}));

import { verifyIdToken } from '../../../src/config/firebase-admin';

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn(() => ({ json: jsonMock }));

    mockRequest = {
      headers: {},
      params: {},
    };

    mockResponse = {
      status: statusMock as any,
      json: jsonMock,
    };

    mockNext = vi.fn();

    vi.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token and attach user to request', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer valid-jwt-token',
      };
      (verifyIdToken as any).mockResolvedValue(mockTokens.validWithUserId);

      // Act
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(verifyIdToken).toHaveBeenCalledWith('valid-jwt-token');
      expect(mockRequest.user).toEqual(mockTokens.validWithUserId);
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should reject request without Authorization header', async () => {
      // Arrange - No authorization header

      // Act
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with malformed Authorization header', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      // Act
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Invalid token format. Use: Bearer <token>',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with empty token', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      // Act
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };
      (verifyIdToken as any).mockRejectedValue({
        code: firebaseErrors.EXPIRED_TOKEN,
        message: 'Token expired',
      });

      // Act
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Token expired' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };
      (verifyIdToken as any).mockRejectedValue({
        code: firebaseErrors.INVALID_TOKEN,
        message: 'Invalid token',
      });

      // Act
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle unknown Firebase errors', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer some-token',
      };
      (verifyIdToken as any).mockRejectedValue(new Error('Unknown error'));

      // Act
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Authentication failed' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireSameUser', () => {
    beforeEach(() => {
      // Mock successful authentication
      mockRequest.user = mockTokens.validWithUserId;
    });

    it('should allow access when JWT userId matches URL parameter', () => {
      // Arrange
      mockRequest.params = { userId: 'user-id-123' };
      const middleware = requireSameUser('userId');

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should reject access when JWT userId does not match URL parameter', () => {
      // Arrange
      mockRequest.params = { userId: 'different-user-id' };
      const middleware = requireSameUser('userId');

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized access' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject access when user is not authenticated', () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.params = { userId: 'user-id-123' };
      const middleware = requireSameUser('userId');

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject access when userId custom claim is missing', () => {
      // Arrange
      mockRequest.user = mockTokens.validWithoutUserId; // No userId claim
      mockRequest.params = { userId: 'user-id-123' };
      const middleware = requireSameUser('userId');

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'User not fully registered',
        message: 'Please complete profile creation to access this resource',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject access when URL parameter is missing', () => {
      // Arrange
      mockRequest.params = {}; // No userId parameter
      const middleware = requireSameUser('userId');

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Invalid request',
        message: 'Missing required parameter: userId',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should work with different parameter names (e.g., "id")', () => {
      // Arrange
      mockRequest.params = { id: 'user-id-123' };
      const middleware = requireSameUser('id');

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      // Arrange
      mockRequest.params = { userId: 'user-id-123' };
      mockRequest.user = null as any; // Force an error
      const middleware = requireSameUser('userId');

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Integration: authenticateToken + requireSameUser', () => {
    it('should allow full authentication and authorization flow', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };
      mockRequest.params = { userId: 'user-id-123' };

      (verifyIdToken as any).mockResolvedValue(mockTokens.validWithUserId);

      // Act - First authenticate
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Reset mockNext for second middleware
      mockNext = vi.fn();

      // Then authorize
      const authorizationMiddleware = requireSameUser('userId');
      authorizationMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockRequest.user).toEqual(mockTokens.validWithUserId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject when authentication succeeds but authorization fails', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };
      mockRequest.params = { userId: 'different-user-id' };

      (verifyIdToken as any).mockResolvedValue(mockTokens.validWithUserId);

      // Act - First authenticate
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Reset mocks for second middleware
      vi.clearAllMocks();
      mockNext = vi.fn();
      statusMock = vi.fn(() => ({ json: jsonMock }));
      mockResponse.status = statusMock as any;

      // Then authorize
      const authorizationMiddleware = requireSameUser('userId');
      authorizationMiddleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized access' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
