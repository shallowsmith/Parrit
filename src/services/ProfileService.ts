import { ProfileRepository } from '../repositories/ProfileRepository.js';
import {
  ProfileValidationError,
  validateCreateProfileRequest,
  toProfileResponse
} from '../models/Profile.js';
import type {
  Profile,
  CreateProfileRequest,
  UpdateProfileRequest,
  ProfileResponse
} from '../models/Profile.js';

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

    // Validate each field individually (partial update)
    const validatedData: UpdateProfileRequest = {};

    // Validate firstName if provided
    if (updateData.firstName !== undefined) {
      if (typeof updateData.firstName !== 'string' || !updateData.firstName.trim()) {
        throw new ProfileValidationError('Invalid first name', 'firstName');
      }
      validatedData.firstName = updateData.firstName.trim();
    }

    if (updateData.lastName !== undefined) {
      if (typeof updateData.lastName !== 'string' || !updateData.lastName.trim()) {
        throw new ProfileValidationError('Invalid last name', 'lastName');
      }
      validatedData.lastName = updateData.lastName.trim();
    }

    // Validate and check email uniqueness if provided
    if (updateData.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        throw new ProfileValidationError('Invalid email format', 'email');
      }

      // Business rule: Email must be unique (excluding current profile)
      const emailExists = await this.profileRepository.checkEmailExists(updateData.email, id);
      if (emailExists) {
        throw new ProfileValidationError('Email already exists', 'email');
      }

      validatedData.email = updateData.email.toLowerCase().trim();
    }

    if (updateData.birthday !== undefined) {
      const birthdayRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/;
      if (!birthdayRegex.test(updateData.birthday)) {
        throw new ProfileValidationError('Invalid birthday format. Use MM/DD', 'birthday');
      }
      validatedData.birthday = updateData.birthday.trim();
    }

    if (updateData.phoneNumber !== undefined) {
      if (typeof updateData.phoneNumber !== 'string' || !updateData.phoneNumber.trim()) {
        throw new ProfileValidationError('Invalid phone number', 'phoneNumber');
      }
      validatedData.phoneNumber = updateData.phoneNumber.trim();
    }

    if (updateData.profileImage !== undefined) {
      validatedData.profileImage = updateData.profileImage;
    }

    if (updateData.nickname !== undefined) {
      validatedData.nickname = updateData.nickname;
    }

    if (updateData.status !== undefined) {
      validatedData.status = updateData.status;
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