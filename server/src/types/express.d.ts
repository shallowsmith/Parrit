/**
 * Express Type Extensions
 *
 * Extends Express Request interface to include JWT payload information
 * This allows TypeScript to recognize req.user throughout the application
 */

import { Request } from 'express';

/**
 * JWT Payload structure from Firebase ID tokens
 * Includes both standard Firebase claims and custom claims
 */
export interface JWTPayload {
  uid: string;              // Firebase user ID
  email?: string;           // User's email address
  email_verified?: boolean; // Whether email is verified
  userId?: string;          // Custom claim: MongoDB profile ID (set after profile creation)
  name?: string;            // User's display name
  picture?: string;         // User's profile picture URL
  iss?: string;             // Issuer
  aud?: string;             // Audience
  auth_time?: number;       // Time of authentication
  iat?: number;             // Issued at time
  exp?: number;             // Expiration time
  sub?: string;             // Subject (Firebase UID)
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
