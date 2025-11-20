/**
 * Profile Service Tests (White Box)
 *
 * Tests profile API operations and data handling
 */

import { profileService, UpdateProfileData } from '@/services/profile.service';
import api from '@/services/api';

// Mock the api module
jest.mock('@/services/api');

describe('Profile Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    const mockProfileId = 'profile-123';
    const mockUpdateData: UpdateProfileData = {
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567890',
    };

    const mockUpdatedProfile = {
      id: mockProfileId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
      birthday: '01/15',
      firebaseUid: 'firebase-uid',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    };

    it('updates profile successfully', async () => {
      const mockResponse = { data: mockUpdatedProfile };
      (api.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await profileService.updateProfile(mockProfileId, mockUpdateData);

      expect(api.put).toHaveBeenCalledWith(`/profiles/${mockProfileId}`, mockUpdateData);
      expect(result).toEqual(mockUpdatedProfile);
    });

    it('updates profile with partial data', async () => {
      const partialData: UpdateProfileData = { firstName: 'Jane' };
      const mockResponse = {
        data: {
          ...mockUpdatedProfile,
          firstName: 'Jane',
          lastName: 'Doe',
        }
      };
      (api.put as jest.Mock).mockResolvedValue(mockResponse);

      const result = await profileService.updateProfile(mockProfileId, partialData);

      expect(api.put).toHaveBeenCalledWith(`/profiles/${mockProfileId}`, partialData);
      expect(result.firstName).toBe('Jane');
    });

    it('handles API errors during profile update', async () => {
      const error = new Error('Profile update failed');
      (api.put as jest.Mock).mockRejectedValue(error);

      await expect(profileService.updateProfile(mockProfileId, mockUpdateData))
        .rejects.toThrow('Profile update failed');
    });

    it('handles network errors', async () => {
      const networkError = new Error('Network Error');
      (api.put as jest.Mock).mockRejectedValue(networkError);

      await expect(profileService.updateProfile(mockProfileId, mockUpdateData))
        .rejects.toThrow('Network Error');
    });

    it('handles validation errors', async () => {
      const validationError = {
        response: {
          status: 400,
          data: { message: 'Invalid phone number format' }
        }
      };
      (api.put as jest.Mock).mockRejectedValue(validationError);

      await expect(profileService.updateProfile(mockProfileId, {
        phoneNumber: 'invalid-phone'
      })).rejects.toEqual(validationError);
    });
  });

  describe('getProfile', () => {
    const mockProfileId = 'profile-456';
    const mockProfile = {
      id: mockProfileId,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phoneNumber: '+1987654321',
      birthday: '05/20',
      firebaseUid: 'firebase-uid-456',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('retrieves profile successfully', async () => {
      const mockResponse = { data: mockProfile };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await profileService.getProfile(mockProfileId);

      expect(api.get).toHaveBeenCalledWith(`/profiles/${mockProfileId}`);
      expect(result).toEqual(mockProfile);
    });

    it('handles API errors during profile retrieval', async () => {
      const error = new Error('Profile not found');
      (api.get as jest.Mock).mockRejectedValue(error);

      await expect(profileService.getProfile('nonexistent-id'))
        .rejects.toThrow('Profile not found');
    });

    it('handles network errors during profile retrieval', async () => {
      const networkError = new Error('Network Error');
      (api.get as jest.Mock).mockRejectedValue(networkError);

      await expect(profileService.getProfile(mockProfileId))
        .rejects.toThrow('Network Error');
    });

    it('handles 404 errors for non-existent profiles', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { message: 'Profile not found' }
        }
      };
      (api.get as jest.Mock).mockRejectedValue(notFoundError);

      await expect(profileService.getProfile('nonexistent-id'))
        .rejects.toEqual(notFoundError);
    });

    it('handles unauthorized access', async () => {
      const unauthorizedError = {
        response: {
          status: 403,
          data: { message: 'Unauthorized' }
        }
      };
      (api.get as jest.Mock).mockRejectedValue(unauthorizedError);

      await expect(profileService.getProfile(mockProfileId))
        .rejects.toEqual(unauthorizedError);
    });
  });
});
