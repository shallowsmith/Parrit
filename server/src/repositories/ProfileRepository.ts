import { Collection, Db, ObjectId } from 'mongodb';
import type { InsertOneResult, UpdateResult, DeleteResult } from 'mongodb';
import type { Profile, CreateProfileRequest, UpdateProfileRequest } from '../models/Profile';
import DatabaseConnection from '../config/database';

/**
 * Repository class for Profile data access.
 *
 * Implements the Repository pattern to:
 * - Encapsulate all database operations for profiles
 * - Provide abstraction between business logic and database
 * - Handle MongoDB-specific operations and transformations
 * - Support easy testing through dependency injection
 *
 * Uses lazy initialization to avoid database connection issues
 * during module loading.
 */
export class ProfileRepository {
  // MongoDB collection reference, initialized on first use
  private collection: Collection<Profile> | null = null;

  constructor() {
    // Delay database access until first use
    // This prevents "Database not connected" errors during module loading
  }

  /**
   * Ensures the collection is initialized before use.
   * Implements lazy initialization pattern to avoid connection timing issues.
   *
   * @returns {Collection<Profile>} The profiles collection
   * @throws {Error} If database is not connected
   */
  private ensureCollection(): Collection<Profile> {
    if (!this.collection) {
      const db: Db = DatabaseConnection.getInstance().getDatabase();
      this.collection = db.collection<Profile>('profiles');
    }
    return this.collection;
  }

  /**
   * Creates a new profile in the database.
   * Adds timestamps for audit trail.
   *
   * @param {CreateProfileRequest} profileData - Validated profile data
   * @returns {Promise<Profile>} The created profile with generated ID
   * @throws {Error} If profile creation fails
   */
  async createProfile(profileData: CreateProfileRequest & { firebaseUid: string }): Promise<Profile> {
    const collection = this.ensureCollection();
    // Add timestamps for audit trail
    const now = new Date();
    const profile: Omit<Profile, '_id'> = {
      ...profileData,
      createdAt: now,
      updatedAt: now,
    };

    const result: InsertOneResult<Profile> = await collection.insertOne(profile as Profile);

    if (!result.insertedId) {
      throw new Error('Failed to create profile');
    }

    const createdProfile = await collection.findOne({ _id: result.insertedId });

    if (!createdProfile) {
      throw new Error('Failed to retrieve created profile');
    }

    return createdProfile;
  }

  /**
   * Finds a profile by its MongoDB ObjectId.
   *
   * @param {string} id - The profile ID (as string)
   * @returns {Promise<Profile | null>} The profile or null if not found
   */
  async findProfileById(id: string): Promise<Profile | null> {
    // Validate ObjectId format to prevent MongoDB errors
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = this.ensureCollection();
    const profile = await collection.findOne({ _id: new ObjectId(id) });
    return profile;
  }

  /**
   * Finds a profile by email address.
   * Email is normalized to lowercase for case-insensitive matching.
   *
   * @param {string} email - The email address to search
   * @returns {Promise<Profile | null>} The profile or null if not found
   */
  async findProfileByEmail(email: string): Promise<Profile | null> {
    const collection = this.ensureCollection();
    const profile = await collection.findOne({ email: email.toLowerCase() });
    return profile;
  }

  /**
   * Retrieves all profiles from the database.
   *
   * @returns {Promise<Profile[]>} Array of all profiles
   */
  async findAllProfiles(): Promise<Profile[]> {
    const collection = this.ensureCollection();
    const profiles = await collection.find({}).toArray();
    return profiles;
  }

  /**
   * Updates an existing profile with partial data.
   * Automatically updates the updatedAt timestamp.
   *
   * @param {string} id - The profile ID to update
   * @param {UpdateProfileRequest} updateData - Partial profile data to update
   * @returns {Promise<Profile | null>} Updated profile or null if not found
   */
  async updateProfile(id: string, updateData: UpdateProfileRequest): Promise<Profile | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = this.ensureCollection();

    // Add updated timestamp for audit trail
    const updatePayload = {
      ...updateData,
      updatedAt: new Date(),
    };

    const result: UpdateResult = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatePayload }
    );

    if (result.matchedCount === 0) {
      return null;
    }

    return await this.findProfileById(id);
  }

  /**
   * Deletes a profile from the database.
   *
   * @param {string} id - The profile ID to delete
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async deleteProfile(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }

    const collection = this.ensureCollection();
    const result: DeleteResult = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }

  /**
   * Checks if an email address already exists in the database.
   * Useful for validation during create/update operations.
   *
   * @param {string} email - The email to check
   * @param {string} excludeId - Optional ID to exclude (for updates)
   * @returns {Promise<boolean>} True if email exists, false otherwise
   */
  async checkEmailExists(email: string, excludeId?: string): Promise<boolean> {
    const collection = this.ensureCollection();
    const query: any = { email: email.toLowerCase() };

    // Exclude a specific profile ID (used when updating email)
    if (excludeId && ObjectId.isValid(excludeId)) {
      query._id = { $ne: new ObjectId(excludeId) };
    }

    const profile = await collection.findOne(query);
    return profile !== null;
  }

  /**
   * Creates database indexes for optimized queries.
   * Should be called during application startup.
   *
   * Indexes:
   * - email: Unique index for email uniqueness constraint
   * - createdAt: For sorting profiles by creation date
   */
  async createIndexes(): Promise<void> {
    const collection = this.ensureCollection();

    // Unique index on email for uniqueness constraint and fast lookups
    await collection.createIndex({ email: 1 }, { unique: true });

    // Index on createdAt for sorting by newest profiles
    await collection.createIndex({ createdAt: -1 });
  }
}