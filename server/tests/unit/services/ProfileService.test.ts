/**
 * ProfileService Unit Tests
 *
 * Tests the business logic layer for profiles with mocked dependencies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfileService } from '../../../src/services/ProfileService';
import { ProfileValidationError } from '../../../src/models/Profile';
import type { Profile } from '../../../src/models/Profile';

// Mock the ProfileRepository
vi.mock('../../../src/repositories/ProfileRepository', () => ({
  ProfileRepository: vi.fn().mockImplementation(() => ({
    createProfile: vi.fn(),
    findProfileByEmail: vi.fn(),
    findProfileById: vi.fn(),
    findProfileByFirebaseUid: vi.fn(),
    updateProfile: vi.fn(),
    findAllProfiles: vi.fn(), // Actual method name in repository
    initializeIndexes: vi.fn(),
  })),
}));

// Mock Firebase Admin SDK
vi.mock('../../../src/config/firebase-admin', () => ({
  setCustomUserClaims: vi.fn().mockResolvedValue(undefined),
}));

import { ProfileRepository } from '../../../src/repositories/ProfileRepository';
import { setCustomUserClaims } from '../../../src/config/firebase-admin';

describe('ProfileService', () => {
  let profileService: ProfileService;
  let mockProfileRepository: any;

  beforeEach(() => {
    // Create fresh service instance
    profileService = new ProfileService();

    // Get the mock repository instance
    mockProfileRepository = (profileService as any).profileRepository;

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('createProfile', () => {
    const validProfileData = {
      firstName: 'John',
      lastName: 'Doe',
      birthday: '01/15',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
    };

    const mockCreatedProfile: Profile = {
      _id: { toString: () => 'profile-id-123' } as any,
      id: 'profile-id-123',
      firebaseUid: 'firebase-uid-123',
      firstName: 'John',
      lastName: 'Doe',
      birthday: '01/15',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a profile successfully with valid data', async () => {
      // Arrange
      mockProfileRepository.findProfileByEmail.mockResolvedValue(null);
      mockProfileRepository.createProfile.mockResolvedValue(mockCreatedProfile);

      // Act
      const result = await profileService.createProfile(validProfileData, 'firebase-uid-123');

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('profile-id-123');
      expect(result.firstName).toBe('John');
      expect(result.email).toBe('john@example.com');
      expect(mockProfileRepository.findProfileByEmail).toHaveBeenCalledWith('john@example.com');
      expect(mockProfileRepository.createProfile).toHaveBeenCalledWith({
        ...validProfileData,
        firebaseUid: 'firebase-uid-123',
      });
    });

    it('should set Firebase custom claims after profile creation', async () => {
      // Arrange
      mockProfileRepository.findProfileByEmail.mockResolvedValue(null);
      mockProfileRepository.createProfile.mockResolvedValue(mockCreatedProfile);

      // Act
      await profileService.createProfile(validProfileData, 'firebase-uid-123');

      // Assert
      expect(setCustomUserClaims).toHaveBeenCalledWith('firebase-uid-123', 'profile-id-123');
    });

    it('should throw ProfileValidationError if email already exists', async () => {
      // Arrange
      mockProfileRepository.findProfileByEmail.mockResolvedValue(mockCreatedProfile);

      // Act & Assert
      await expect(
        profileService.createProfile(validProfileData, 'firebase-uid-123')
      ).rejects.toThrow(ProfileValidationError);

      expect(mockProfileRepository.createProfile).not.toHaveBeenCalled();
    });

    it('should throw ProfileValidationError if firebaseUid is missing', async () => {
      // Act & Assert
      await expect(
        profileService.createProfile(validProfileData, '')
      ).rejects.toThrow(ProfileValidationError);

      expect(mockProfileRepository.findProfileByEmail).not.toHaveBeenCalled();
    });

    it('should throw ProfileValidationError for invalid email format', async () => {
      // Arrange
      const invalidData = { ...validProfileData, email: 'invalid-email' };

      // Act & Assert
      await expect(
        profileService.createProfile(invalidData, 'firebase-uid-123')
      ).rejects.toThrow(ProfileValidationError);
    });

    it('should throw ProfileValidationError for missing required fields', async () => {
      // Arrange
      const incompleteData = { firstName: 'John' }; // Missing required fields

      // Act & Assert
      await expect(
        profileService.createProfile(incompleteData, 'firebase-uid-123')
      ).rejects.toThrow(ProfileValidationError);
    });

    it('should continue profile creation even if setting custom claims fails', async () => {
      // Arrange
      mockProfileRepository.findProfileByEmail.mockResolvedValue(null);
      mockProfileRepository.createProfile.mockResolvedValue(mockCreatedProfile);
      (setCustomUserClaims as any).mockRejectedValue(new Error('Firebase error'));

      // Act
      const result = await profileService.createProfile(validProfileData, 'firebase-uid-123');

      // Assert - Profile should still be created
      expect(result).toBeDefined();
      expect(result.id).toBe('profile-id-123');
    });

    it('should normalize email to lowercase', async () => {
      // Arrange
      const dataWithUppercaseEmail = { ...validProfileData, email: 'JOHN@EXAMPLE.COM' };
      mockProfileRepository.findProfileByEmail.mockResolvedValue(null);
      mockProfileRepository.createProfile.mockResolvedValue(mockCreatedProfile);

      // Act
      await profileService.createProfile(dataWithUppercaseEmail, 'firebase-uid-123');

      // Assert
      expect(mockProfileRepository.findProfileByEmail).toHaveBeenCalledWith('john@example.com');
    });
  });

  describe('getProfileById', () => {
    const mockProfile: Profile = {
      _id: { toString: () => 'profile-id-123' } as any,
      id: 'profile-id-123',
      firebaseUid: 'firebase-uid-123',
      firstName: 'John',
      lastName: 'Doe',
      birthday: '01/15',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return profile if found', async () => {
      // Arrange
      mockProfileRepository.findProfileById.mockResolvedValue(mockProfile);

      // Act
      const result = await profileService.getProfileById('profile-id-123');

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe('profile-id-123');
      expect(mockProfileRepository.findProfileById).toHaveBeenCalledWith('profile-id-123');
    });

    it('should return null if profile not found', async () => {
      // Arrange
      mockProfileRepository.findProfileById.mockResolvedValue(null);

      // Act
      const result = await profileService.getProfileById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw ProfileValidationError for invalid ID format', async () => {
      // Act & Assert
      await expect(profileService.getProfileById('')).rejects.toThrow(ProfileValidationError);
      expect(mockProfileRepository.findProfileById).not.toHaveBeenCalled();
    });
  });

  describe('getAllProfiles', () => {
    it('should return all profiles', async () => {
      // Arrange
      const mockProfiles: Profile[] = [
        {
          _id: { toString: () => 'profile-1' } as any,
          id: 'profile-1',
          firebaseUid: 'firebase-uid-1',
          firstName: 'John',
          lastName: 'Doe',
          birthday: '01/15',
          email: 'john@example.com',
          phoneNumber: '+1234567890',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: { toString: () => 'profile-2' } as any,
          id: 'profile-2',
          firebaseUid: 'firebase-uid-2',
          firstName: 'Jane',
          lastName: 'Smith',
          birthday: '02/20',
          email: 'jane@example.com',
          phoneNumber: '+0987654321',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockProfileRepository.findAllProfiles.mockResolvedValue(mockProfiles);

      // Act
      const result = await profileService.getAllProfiles();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('profile-1');
      expect(result[1].id).toBe('profile-2');
    });

    it('should return empty array if no profiles exist', async () => {
      // Arrange
      mockProfileRepository.findAllProfiles.mockResolvedValue([]);

      // Act
      const result = await profileService.getAllProfiles();

      // Assert
      expect(result).toEqual([]);
    });
  });
});
