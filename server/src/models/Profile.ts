import { ObjectId } from 'mongodb';
import { z } from 'zod';

/**
 * Core Profile interface representing the database schema.
 * Maps directly to MongoDB documents in the profiles collection.
 */
export interface Profile {
  _id?: ObjectId;
  id?: string;
  firebaseUid: string;        // Firebase user ID (extracted from JWT)
  firstName: string;
  lastName: string;
  birthday: string;           // mm/dd format
  email: string;
  phoneNumber: string;
  profileImage?: string | null;
  nickname?: string | null;
  status?: string | null;
  googleRefreshToken?: string | null; // OAuth refresh token for Google Sheets export
  createdAt?: Date;
  updatedAt?: Date;
}

// Zod schema for creating a profile
export const createProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  birthday: z.string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/, 'Invalid birthday format. Use MM/DD'),
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Invalid email format'),
  phoneNumber: z.string().trim().min(1, 'Phone number is required'),
  profileImage: z.string().nullable().optional(),
  nickname: z.string().nullable().optional(),
  status: z.string().nullable().optional()
});

// Zod schema for updating a profile
export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name cannot be empty').optional(),
  lastName: z.string().trim().min(1, 'Last name cannot be empty').optional(),
  birthday: z.string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/, 'Invalid birthday format. Use MM/DD')
    .optional(),
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Invalid email format')
    .optional(),
  phoneNumber: z.string().trim().min(1, 'Phone number cannot be empty').optional(),
  profileImage: z.string().nullable().optional(),
  nickname: z.string().nullable().optional(),
  status: z.string().nullable().optional()
});

export type CreateProfileRequest = z.infer<typeof createProfileSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;

/**
 * Response format for profile data sent to clients.
 * Transforms internal database representation to external API format.
 * Converts MongoDB ObjectId to string for JSON compatibility.
 */
export interface ProfileResponse {
  id: string;
  firebaseUid: string;
  firstName: string;
  lastName: string;
  birthday: string;
  email: string;
  phoneNumber: string;
  profileImage?: string | null;
  nickname?: string | null;
  status?: string | null;
  googleRefreshToken?: string | null;
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
  try {
    return createProfileSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.issues
        .filter((err: any) => err.message.includes('required'))
        .map((err: any) => err.path.join('.'));
      const message = error.issues[0]?.message || 'Validation failed';
      throw new ProfileValidationError(
        message,
        error.issues[0]?.path[0]?.toString(),
        missingFields.length > 0 ? missingFields : undefined
      );
    }
    throw error;
  }
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
    firebaseUid: profile.firebaseUid,
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