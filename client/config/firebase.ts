/**
 * Firebase Client Configuration
 *
 * Initializes Firebase app and auth instance for client-side authentication.
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { FIREBASE_CONFIG } from './constants';

console.log('[Firebase] Initializing with config:', {
  projectId: FIREBASE_CONFIG.projectId,
  authDomain: FIREBASE_CONFIG.authDomain,
});

// Initialize Firebase app
const app = initializeApp(FIREBASE_CONFIG);
console.log('[Firebase] App initialized successfully');

// Initialize and export Firebase Authentication
export const auth = getAuth(app);
console.log('[Firebase] Auth instance created');
