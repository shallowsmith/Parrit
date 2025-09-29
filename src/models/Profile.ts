import { ObjectId } from 'mongodb';

/**
 * Core Profile interface representing the database schema.
 * Maps directly to MongoDB documents in the profiles collection.
 */
export interface Profile {
  _id?: ObjectId;
  id?: string;
  firstName: string;
  lastName: string;
  birthday: string;           // mm/dd format
  email: string;
  phoneNumber: string;
  profileImage?: string | null;
  nickname?: string | null;
  status?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Request payload for creating a new profile.
 * Contains all required and optional fields needed for profile creation.
 * Used for type safety and validation at the API boundary.
 */
export interface CreateProfileRequest {
  firstName: string;
  lastName: string;
  birthday: string;
  email: string;
  phoneNumber: string;
  profileImage?: string | null;
  nickname?: string | null;
  status?: string | null;
}

/**
 * Request payload for updating an existing profile.
 * All fields are optional since partial updates are supported.
 * Only provided fields will be updated in the database.
 */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  birthday?: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string | null;
  nickname?: string | null;
  status?: string | null;
}

/**
 * Response format for profile data sent to clients.
 * Transforms internal database representation to external API format.
 * Converts MongoDB ObjectId to string for JSON compatibility.
 */
export interface ProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  birthday: string;
  email: string;
  phoneNumber: string;
  profileImage?: string | null;
  nickname?: string | null;
  status?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Custom error class for profile validation failures.
 * Provides structured error information for better error handling.
 * Used throughout the service layer for validation errors.
 */
export class ProfileValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public missingFields?: string[]
  ) {
    super(message);
    this.name = 'ProfileValidationError';
  }
}

/**
 * Validates and sanitizes profile creation request data.
 * Ensures all required fields are present and properly formatted.
 *
 * @param data - Raw request data from the client
 * @returns Validated and sanitized profile data
 * @throws {ProfileValidationError} If validation fails
 */
export function validateCreateProfileRequest(data: any): CreateProfileRequest {
  // Check for missing required fields
  const requiredFields = ['firstName', 'lastName', 'birthday', 'email', 'phoneNumber'];
  const missingFields = requiredFields.filter(field => !data[field]);

  if (missingFields.length > 0) {
    throw new ProfileValidationError(
      'Missing required fields',
      undefined,
      missingFields
    );
  }

  // Validate email format using basic regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    throw new ProfileValidationError('Invalid email format', 'email');
  }

  // Validate birthday format (MM/DD)
  // Ensures month is 01-12 and day is 01-31
  const birthdayRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/;
  if (!birthdayRegex.test(data.birthday)) {
    throw new ProfileValidationError('Invalid birthday format. Use MM/DD', 'birthday');
  }

  // Return sanitized data with trimmed strings and normalized email
  return {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    birthday: data.birthday.trim(),
    email: data.email.toLowerCase().trim(), // Normalize email to lowercase
    phoneNumber: data.phoneNumber.trim(),
    profileImage: data.profileImage || null,
    nickname: data.nickname || null,
    status: data.status || null,
  };
}

/**
 * Transforms a database Profile object to an API ProfileResponse.
 * Converts MongoDB ObjectId to string for JSON serialization.
 *
 * @param profile - Database profile object
 * @returns Profile data formatted for API response
 */
export function toProfileResponse(profile: Profile): ProfileResponse {
  return {
    id: profile._id?.toString() || profile.id || '',
    firstName: profile.firstName,
    lastName: profile.lastName,
    birthday: profile.birthday,
    email: profile.email,
    phoneNumber: profile.phoneNumber,
    profileImage: profile.profileImage,
    nickname: profile.nickname,
    status: profile.status,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}