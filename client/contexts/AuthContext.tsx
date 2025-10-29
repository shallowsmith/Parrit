/**
 * Authentication Context
 *
 * Manages authentication state across the entire application.
 * Provides login, register, logout functions and auth state.
 *
 * Features:
 * - Listens to Firebase auth state changes
 * - Syncs with backend profile status
 * - Handles token refresh for custom claims
 * - Persists auth state
 */

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { firebaseService } from '@/services/firebase.service';
import { authService } from '@/services/auth.service';
import type { AuthState, Profile } from '@/types/auth.types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean }>;
  register: (
    email: string,
    password: string,
    profileData: Omit<Profile, 'id' | 'firebaseUid' | 'createdAt' | 'updatedAt'>
  ) => Promise<{ success: boolean }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isAuthenticated: false,
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // Listen to Firebase auth state changes
  useEffect(() => {
    console.log('[AuthContext] Initializing auth state listener...');

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[AuthContext] Auth state changed. User:', user ? user.email : 'null');
      console.log('[AuthContext] isRegistering flag:', isRegistering);

      if (user && !isRegistering) {
        try {
          // Check if user has profile in backend
          console.log('[AuthContext] Checking login status with backend...');
          const response = await authService.checkLoginStatus();

          if (response.status === 200) {
            console.log('[AuthContext] User authenticated with profile:', response.data.profile.email);
            setState({
              user,
              profile: response.data.profile,
              loading: false,
              isAuthenticated: true,
            });
          }
        } catch (error: any) {
          console.log('[AuthContext] Backend check error:', error.message);

          if (error.response?.status === 404) {
            // User exists in Firebase but no profile yet
            console.log('[AuthContext] User exists but no profile (404)');
            setState({
              user,
              profile: null,
              loading: false,
              isAuthenticated: false,
            });
          } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
            // Network error - backend not reachable
            console.log('[AuthContext] Backend unreachable, treating as unauthenticated');
            setState({
              user: null,
              profile: null,
              loading: false,
              isAuthenticated: false,
            });
          } else {
            // Other errors, sign out
            console.error('[AuthContext] Unexpected error, signing out:', error);
            await firebaseService.signOut();
            setState({
              user: null,
              profile: null,
              loading: false,
              isAuthenticated: false,
            });
          }
        }
      } else if (user && isRegistering) {
        // Skip backend check during registration - the register() function will handle it
        console.log('[AuthContext] Skipping backend check during registration');
      } else if (!isRegistering) {
        // Only set unauthenticated if NOT currently registering
        console.log('[AuthContext] No user logged in, setting unauthenticated state');
        setState({
          user: null,
          profile: null,
          loading: false,
          isAuthenticated: false,
        });
      } else {
        // During registration with no user - just wait
        console.log('[AuthContext] User is null during registration, waiting...');
      }
    });

    return () => unsubscribe();
  }, [isRegistering]);

  const login = async (email: string, password: string) => {
    try {
      // Step 1: Firebase authentication
      await firebaseService.signIn(email, password);

      // Step 2: Check login status (handled by onAuthStateChanged listener)
      // The listener will automatically update state

      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    profileData: Omit<Profile, 'id' | 'firebaseUid' | 'createdAt' | 'updatedAt'>
  ) => {
    setIsRegistering(true);
    console.log('[AuthContext] Starting registration flow...');

    try {
      // Step 1: Create Firebase user
      console.log('[AuthContext] Step 1: Creating Firebase user...');
      const { user } = await firebaseService.signUp(email, password);
      console.log('[AuthContext] Firebase user created:', user.email);

      // Step 2: Create profile in backend
      console.log('[AuthContext] Step 2: Creating backend profile...');
      const profileResponse = await authService.createProfile(profileData);
      console.log('[AuthContext] Backend profile created:', profileResponse.data);

      // Step 3: Refresh token to get userId custom claim
      console.log('[AuthContext] Step 3: Refreshing token to get userId claim...');
      await firebaseService.refreshToken(true);

      // Step 4: Verify login (get profile with userId claim)
      console.log('[AuthContext] Step 4: Verifying login with backend...');
      const loginResponse = await authService.checkLoginStatus();

      if (loginResponse.status === 200) {
        console.log('[AuthContext] Registration successful! Setting authenticated state.');
        setState({
          user,
          profile: loginResponse.data.profile,
          loading: false,
          isAuthenticated: true,
        });
        return { success: true };
      }

      console.error('[AuthContext] Login check did not return 200');
      return { success: false };
    } catch (error) {
      console.error('[AuthContext] Registration error:', error);

      // If profile creation fails, delete Firebase user to maintain consistency
      if (auth.currentUser) {
        try {
          await auth.currentUser.delete();
          console.log('[AuthContext] Firebase user deleted after profile creation error');
        } catch (deleteError) {
          console.error('[AuthContext] Failed to delete Firebase user:', deleteError);
        }
      }
      throw error;
    } finally {
      setIsRegistering(false);
      console.log('[AuthContext] Registration flow completed');
    }
  };

  const logout = async () => {
    await firebaseService.signOut();
    await AsyncStorage.removeItem('auth_token');
    setState({
      user: null,
      profile: null,
      loading: false,
      isAuthenticated: false,
    });
  };

  const refreshToken = async () => {
    await firebaseService.refreshToken(true);
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
