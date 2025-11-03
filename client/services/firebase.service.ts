/**
 * Firebase Authentication Service
 *
 * Provides methods for Firebase authentication operations:
 * - Sign up with email/password
 * - Sign in with email/password
 * - Sign out
 * - Token refresh (to get updated custom claims)
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '@/config/firebase';

export const firebaseService = {
  /**
   * Create new Firebase user with email and password
   */
  signUp: async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    return { user: userCredential.user, token };
  },

  /**
   * Sign in existing Firebase user with email and password
   */
  signIn: async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    return { user: userCredential.user, token };
  },

  /**
   * Sign out current user
   */
  signOut: () => signOut(auth),

  /**
   * Refresh JWT token
   * @param forceRefresh - Set to true to force token refresh (gets updated custom claims)
   */
  refreshToken: async (forceRefresh = false) => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken(forceRefresh);
    }
    return null;
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: () => auth.currentUser,
};
