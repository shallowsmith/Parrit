/**
 * Profile Service
 *
 * Service for profile-related API calls.
 * Handles updating user profile information.
 */

import api from './api';
import type { Profile } from '@/types/auth.types';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  birthday?: string;
  nickname?: string;
  status?: string;
}

export const profileService = {
  /**
   * Update user profile
   * @param profileId - The profile ID to update
   * @param data - Partial profile data to update
   * @returns Updated profile
   */
  async updateProfile(profileId: string, data: UpdateProfileData): Promise<Profile> {
    console.log('[ProfileService] Updating profile with ID:', profileId);
    console.log('[ProfileService] URL:', `/profiles/${profileId}`);
    console.log('[ProfileService] Data:', data);
    
    const response = await api.put(`/profiles/${profileId}`, data);
    
    console.log('[ProfileService] Response:', response.data);
    return response.data;
  },

  /**
   * Get user profile by ID
   * @param profileId - The profile ID
   * @returns Profile data
   */
  async getProfile(profileId: string): Promise<Profile> {
    const response = await api.get(`/profiles/${profileId}`);
    return response.data;
  },
};

