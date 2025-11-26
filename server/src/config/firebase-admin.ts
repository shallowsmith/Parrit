/**
 * Firebase Admin SDK Configuration
 *
 * Initializes Firebase Admin for server-side operations:
 * - JWT token verification
 * - Custom claims management (setting userId after profile creation)
 *
 * Configuration is loaded from environment variable FIREBASE_SERVICE_ACCOUNT
 * which should contain the entire service account JSON as a string.
 */

import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Initialize Firebase Admin SDK with service account from environment variable
 */
function initializeFirebaseAdmin() {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      return admin.app();
    }

    // Get service account from environment variable
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
    }

    // Parse the service account JSON
    const serviceAccount = JSON.parse(serviceAccountJson);

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'parrit-fc705.firebasestorage.app'
    });

    console.log('Firebase Admin SDK initialized successfully');
    return admin.app();
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

// Initialize on module load
initializeFirebaseAdmin();

/**
 * Verifies a Firebase ID token and returns the decoded token
 *
 * @param idToken - The Firebase ID token to verify
 * @returns Decoded token containing user information and custom claims
 * @throws Error if token is invalid or expired
 */
export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw error;
  }
}

/**
 * Sets custom claims on a Firebase user
 * Used after profile creation to add the MongoDB userId to the JWT
 *
 * @param firebaseUid - The Firebase user ID
 * @param userId - The MongoDB user/profile ID to add as a custom claim
 * @throws Error if setting custom claims fails
 */
export async function setCustomUserClaims(firebaseUid: string, userId: string): Promise<void> {
  try {
    await admin.auth().setCustomUserClaims(firebaseUid, { userId });
    console.log(`Custom claims set for user ${firebaseUid}: userId=${userId}`);
  } catch (error) {
    console.error('Error setting custom user claims:', error);
    throw error;
  }
}

// Export admin instance for direct access if needed
export default admin;
