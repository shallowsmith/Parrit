import { ProfileRepository } from '../repositories/ProfileRepository';
import {
  ProfileValidationError,
  validateCreateProfileRequest,
  toProfileResponse,
  updateProfileSchema
} from '../models/Profile';
import type {
  Profile,
  CreateProfileRequest,
  UpdateProfileRequest,
  ProfileResponse
} from '../models/Profile';
import { z } from 'zod';

/**
 * Service class for Profile business logic.
 *
 * Implements the Service Layer pattern to:
 * - Encapsulate business rules and validation
 * - Orchestrate repository operations
 * - Transform data between layers
 * - Handle business-specific errors
 *
 * This layer sits between routes (presentation) and repositories (data access),
 * ensuring separation of concerns and maintainability.
 */
export class ProfileService {
  private profileRepository: ProfileRepository;

  constructor() {
    // Initialize repository for data access
    // In a larger app, this would be injected for better testability
    this.profileRepository = new ProfileRepository();
  }

  /**
   * Creates a new profile with validation and business rules.
   *
   * Business logic includes:
   * - Input validation and sanitization
   * - Email uniqueness check
   * - Data transformation for response
   *
   * @param {any} profileData - Raw profile data from request
   * @returns {Promise<ProfileResponse>} Created profile response
   * @throws {ProfileValidationError} If validation fails or email exists
   */
  async createProfile(profileData: any): Promise<ProfileResponse> {
    // Step 1: Validate and sanitize input data
    const validatedData = validateCreateProfileRequest(profileData);

    // Step 2: Business rule - Email must be unique
    const existingProfile = await this.profileRepository.findProfileByEmail(validatedData.email);
    if (existingProfile) {
      throw new ProfileValidationError('Email already exists', 'email');
    }

    // Step 3: Persist to database
    const createdProfile = await this.profileRepository.createProfile(validatedData);

    // Step 4: Transform to response format
    return toProfileResponse(createdProfile);
  }

  /**
   * Retrieves a profile by ID.
   *
   * @param {string} id - The profile ID
   * @returns {Promise<ProfileResponse | null>} Profile or null if not found
   * @throws {ProfileValidationError} If ID is invalid
   */
  async getProfileById(id: string): Promise<ProfileResponse | null> {
    // Validate ID format
    if (!id || typeof id !== 'string') {
      throw new ProfileValidationError('Invalid profile ID');
    }

    const profile = await this.profileRepository.findProfileById(id);

    if (!profile) {
      return null;
    }

    return toProfileResponse(profile);
  }

  /**
   * Retrieves all profiles.
   *
   * @returns {Promise<ProfileResponse[]>} Array of all profiles
   */
  async getAllProfiles(): Promise<ProfileResponse[]> {
    const profiles = await this.profileRepository.findAllProfiles();
    return profiles.map(profile => toProfileResponse(profile));
  }

  /**
   * Updates an existing profile with validation.
   *
   * Supports partial updates - only provided fields are updated.
   * Email changes are validated for uniqueness.
   *
   * @param {string} id - The profile ID to update
   * @param {any} updateData - Partial profile data to update
   * @returns {Promise<ProfileResponse | null>} Updated profile or null
   * @throws {ProfileValidationError} If validation fails
   */
  async updateProfile(id: string, updateData: any): Promise<ProfileResponse | null> {
    // Validate ID
    if (!id || typeof id !== 'string') {
      throw new ProfileValidationError('Invalid profile ID');
    }

    // Check if profile exists
    const existingProfile = await this.profileRepository.findProfileById(id);
    if (!existingProfile) {
      return null;
    }

    // Validate update data using Zod schema
    let validatedData: UpdateProfileRequest;
    try {
      validatedData = updateProfileSchema.parse(updateData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.issues[0]?.message || 'Validation failed';
        throw new ProfileValidationError(
          message,
          error.issues[0]?.path[0]?.toString()
        );
      }
      throw error;
    }

    // Business rule: Email must be unique (excluding current profile)
    if (validatedData.email !== undefined) {
      const emailExists = await this.profileRepository.checkEmailExists(validatedData.email, id);
      if (emailExists) {
        throw new ProfileValidationError('Email already exists', 'email');
      }
    }

    // Update profile in database
    const updatedProfile = await this.profileRepository.updateProfile(id, validatedData);

    if (!updatedProfile) {
      return null;
    }

    return toProfileResponse(updatedProfile);
  }

  /**
   * Deletes a profile by ID.
   *
   * @param {string} id - The profile ID to delete
   * @returns {Promise<boolean>} True if deleted, false if not found
   * @throws {ProfileValidationError} If ID is invalid
   */
  async deleteProfile(id: string): Promise<boolean> {
    if (!id || typeof id !== 'string') {
      throw new ProfileValidationError('Invalid profile ID');
    }

    return await this.profileRepository.deleteProfile(id);
  }

  /**
   * Initializes database indexes.
   * Should be called during application startup.
   */
  async initializeIndexes(): Promise<void> {
    await this.profileRepository.createIndexes();
  }
}