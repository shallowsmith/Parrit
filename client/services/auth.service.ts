/**
 * Authentication API Service
 *
 * Provides methods for interacting with backend authentication endpoints:
 * - Check login status
 * - Create user profile
 * - Get user profile
 */

import api from './api';
import type { Profile } from '@/types/auth.types';

export const authService = {
  /**
   * Check if user has completed profile registration
   * POST /api/v1/profiles/login
   *
   * @returns 200 if user has profile, 404 if first-time user
   */
  checkLoginStatus: async () => {
    return await api.post<{ message: string; profile: Profile }>('/profiles/login');
  },

  /**
   * Create user profile in backend
   * POST /api/v1/profiles
   *
   * @param profileData - User profile information
   */
  createProfile: async (profileData: {
    firstName: string;
    lastName: string;
    birthday: string;
    email: string;
    phoneNumber: string;
  }) => {
    return await api.post<Profile>('/profiles', profileData);
  },

  /**
   * Get user profile by ID
   * GET /api/v1/profiles/:userId
   *
   * @param userId - MongoDB profile ID
   */
  getProfile: async (userId: string) => {
    return await api.get<Profile>(`/profiles/${userId}`);
  },
};
