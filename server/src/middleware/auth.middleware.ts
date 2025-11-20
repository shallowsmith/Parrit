/**
 * Authentication and Authorization Middleware
 *
 * Provides JWT-based authentication and authorization using Firebase Admin SDK
 * - authenticateToken: Verifies JWT tokens from Authorization header
 * - requireSameUser: Ensures the authenticated user matches the resource owner
 */

import type { Request, Response, NextFunction } from 'express';
import { verifyIdToken } from '../config/firebase-admin';
import type { JWTPayload } from '../types/express.js';

/**
 * Middleware to authenticate requests using Firebase JWT tokens
 *
 * Extracts the bearer token from the Authorization header, verifies it with
 * Firebase Admin SDK, and attaches the decoded token to req.user
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns 401 if token is missing, invalid, or expired
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    // Check for Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Invalid token format. Use: Bearer <token>' });
      return;
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.substring(7);

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    // Verify token with Firebase Admin SDK
    const decodedToken = await verifyIdToken(token);

    // Attach decoded token to request object
    req.user = decodedToken as JWTPayload;

    // Continue to next middleware/route handler
    next();
  } catch (error: any) {
    // Handle Firebase Auth errors
    if (error.code === 'auth/id-token-expired') {
      res.status(401).json({ error: 'Token expired' });
      return;
    }

    if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Handle other errors
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware factory to ensure the authenticated user matches the resource owner
 *
 * Compares the userId from JWT custom claims with the userId/id in the URL path.
 * This enforces that users can only access their own resources.
 *
 * @param paramName - The name of the URL parameter to check ('userId' or 'id')
 * @returns Express middleware function
 *
 * @example
 * // For routes like /api/v1/users/:userId/budgets
 * router.get('/', authenticateToken, requireSameUser('userId'), handler);
 *
 * @example
 * // For routes like /api/v1/profiles/:id
 * router.get('/:id', authenticateToken, requireSameUser('id'), handler);
 */
export function requireSameUser(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Get userId from JWT custom claims
      const jwtUserId = req.user.userId;

      // Check if userId custom claim exists
      if (!jwtUserId) {
        res.status(401).json({
          error: 'User not fully registered',
          message: 'Please complete profile creation to access this resource'
        });
        return;
      }

      // Get userId from URL path parameter
      const pathUserId = req.params[paramName];

      if (!pathUserId) {
        res.status(400).json({
          error: 'Invalid request',
          message: `Missing required parameter: ${paramName}`
        });
        return;
      }

      // Compare JWT userId with path userId
      if (jwtUserId !== pathUserId) {
        res.status(401).json({ error: 'Unauthorized access' });
        return;
      }

      // Authorization successful, continue to route handler
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({ error: 'Authorization failed' });
    }
  };
}
