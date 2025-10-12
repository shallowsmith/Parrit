import { Collection, Db, ObjectId } from 'mongodb';
import type { InsertOneResult, UpdateResult, DeleteResult } from 'mongodb';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../models/Category';
import DatabaseConnection from '../config/database';

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - type
 *         - userId
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the category (MongoDB ObjectId)
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           description: Category name
 *           example: "Groceries"
 *         type:
 *           type: string
 *           description: Category type (expense or income)
 *           example: "expense"
 *         userId:
 *           type: string
 *           description: User ID who owns this category (MongoDB ObjectId)
 *           example: "68df4cd8f4c53b419fc5f196"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the category was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the category was last updated
 */

/**
 * Repository class for Category data access operations.
 *
 * Implements the Repository pattern to:
 * - Abstract database operations from business logic
 * - Provide a clean interface for data persistence
 * - Handle MongoDB-specific operations
 * - Manage database indexes and optimization
 */
export class CategoryRepository {
    private collection: Collection<Category> | null = null;

    constructor() {

    }

    /**
   * Ensures the collection is initialized before use.
   * Implements lazy initialization pattern to avoid connection timing issues.
   *
   * @returns {Collection<Category>} The categories collection
   * @throws {Error} If database is not connected
   */
  private ensureCollection(): Collection<Category> {
    if (!this.collection) {
      const db: Db = DatabaseConnection.getInstance().getDatabase();
      this.collection = db.collection<Category>('categories');
    }
    return this.collection;
  }

  /**
     * Creates a new category in the database.
     * Adds timestamps for audit trail.
     *
     * @param {CreateCategoryRequest} categoryData - Validated category data
     * @returns {Promise<Category>} The created category with generated ID
     * @throws {Error} If category creation fails
     */
    async createCategory(categoryData: CreateCategoryRequest): Promise<Category> {
      const collection = this.ensureCollection();
      // Add timestamps for audit trail
      const now = new Date();
      const category: Omit<Category, '_id'> = {
        ...categoryData,
        id: '',
        createdAt: now,
        updatedAt: now,
      };
  
      const result: InsertOneResult<Category> = await collection.insertOne(category as Category);
  
      if (!result.insertedId) {
        throw new Error('Failed to create cateogy');
      }
  
      const createdCategory = await collection.findOne({ _id: result.insertedId });
  
      if (!createdCategory) {
        throw new Error('Failed to retrieve created profile');
      }
  
      return createdCategory;
    }

    /**
       * Finds a category by its MongoDB ObjectId.
       *
       * @param {string} id - The category ID (as string)
       * @returns {Promise<Category | null>} The category or null if not found
       */
      async findCategoryById(id: string): Promise<Category | null> {
        // Validate ObjectId format to prevent MongoDB errors
        if (!ObjectId.isValid(id)) {
          return null;
        }

        const collection = this.ensureCollection();
        const category = await collection.findOne({ _id: new ObjectId(id) });
        return category;
      }

      /**
       * Finds a category by name and userId.
       * Used to check for duplicate category names per user.
       *
       * @param {string} name - The category name
       * @param {string} userId - The user ID
       * @returns {Promise<Category | null>} The category or null if not found
       */
      async findByNameAndUserId(name: string, userId: string): Promise<Category | null> {
        const collection = this.ensureCollection();
        const category = await collection.findOne({ name, userId });
        return category;
      }
  
      /**
         * Retrieves all categories from the database.
         *
         * @returns {Promise<Category[]>} Array of all categories
         */
        async findAllCategories(): Promise<Category[]> {
          const collection = this.ensureCollection();
          const categories = await collection.find({}).toArray();
          return categories;
        }

        /**
           * Updates an existing category with partial data.
           * Automatically updates the updatedAt timestamp.
           *
           * @param {string} id - The category ID to update
           * @param {UpdateCategoryRequest} updateData - Partial category data to update
           * @returns {Promise<Category | null>} Updated category or null if not found
           */
          async updateCategory(id: string, updateData: Partial<UpdateCategoryRequest>): Promise<Category | null> {
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
        
            return await this.findCategoryById(id);
          }

          /**
         * Deletes a category from the database.
         *
         * @param {string} id - The category ID to delete
         * @returns {Promise<boolean>} True if deleted, false if not found
         */
        async deleteCategory(id: string): Promise<boolean> {
            if (!ObjectId.isValid(id)) {
            return false;
            }

            const collection = this.ensureCollection();
            const result: DeleteResult = await collection.deleteOne({ _id: new ObjectId(id) });
            return result.deletedCount === 1;
        }

        /**
         * Creates database indexes for optimized queries.
         * Should be called during application startup.
         *
         * Indexes:
         * - name: Unique index for name uniqueness constraint
         */
        async createIndexes(): Promise<void> {
            const collection = this.ensureCollection();

            // Unique index on name for uniqueness constraint and fast lookups
            await collection.createIndex({ name: 1 }, { unique: true });
        }
  
}



