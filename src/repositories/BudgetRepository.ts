import { Collection, Db, ObjectId } from 'mongodb';
import type { InsertOneResult, UpdateResult, DeleteResult } from 'mongodb';
import type { Budget, CreateBudgetRequest, UpdateBudgetRequest } from '../models/Budget';
import DatabaseConnection from '../config/database';

/**
 * @swagger
 * components:
 *   schemas:
 *     Budget:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *         - month
 *         - year
 *         - amount
 *         - remaining
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the budget (MongoDB ObjectId)
 *           example: "507f1f77bcf86cd799439011"
 *         userId:
 *           type: string
 *           description: User ID who owns this budget (MongoDB ObjectId)
 *           example: "68df4cd8f4c53b419fc5f196"
 *         month:
 *           type: string
 *           description: Month for the budget
 *           example: "January"
 *         year:
 *           type: number
 *           description: Year for the budget
 *           example: 2025
 *         amount:
 *           type: number
 *           format: double
 *           description: Total budget amount
 *           example: 1000.00
 *         remaining:
 *           type: number
 *           format: double
 *           description: Remaining budget amount
 *           example: 750.00
 *         categoryId:
 *           type: string
 *           description: Optional category ID for category-specific budgets (MongoDB ObjectId)
 *           example: "507f1f77bcf86cd799439012"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the budget was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the budget was last updated
 */

/**
 * Repository class for Budget data access operations.
 *
 * Implements the Repository pattern to:
 * - Abstract database operations from business logic
 * - Provide a clean interface for data persistence
 * - Handle MongoDB-specific operations
 * - Manage database indexes and optimization
 */
export class BudgetRepository {
    private collection: Collection<Budget> | null = null;

    constructor() {

    }

    /**
   * Ensures the collection is initialized before use.
   * Implements lazy initialization pattern to avoid connection timing issues.
   *
   * @returns {Collection<Budget>} The budgets collection
   * @throws {Error} If database is not connected
   */
  private ensureCollection(): Collection<Budget> {
    if (!this.collection) {
      const db: Db = DatabaseConnection.getInstance().getDatabase();
      this.collection = db.collection<Budget>('budgets');
    }
    return this.collection;
  }

  /**
     * Creates a new budget in the database.
     * Adds timestamps for audit trail.
     *
     * @param {CreateBudgetRequest} budgetData - Validated budget data
     * @returns {Promise<Budget>} The created budget with generated ID
     * @throws {Error} If budget creation fails
     */
    async createBudget(budgetData: CreateBudgetRequest): Promise<Budget> {
      const collection = this.ensureCollection();
      // Add timestamps for audit trail
      const now = new Date();
      const budget: Omit<Budget, '_id'> = {
        ...budgetData,
        id: '',
        createdAt: now,
        updatedAt: now,
      };

      const result: InsertOneResult<Budget> = await collection.insertOne(budget as Budget);

      if (!result.insertedId) {
        throw new Error('Failed to create budget');
      }

      const createdBudget = await collection.findOne({ _id: result.insertedId });

      if (!createdBudget) {
        throw new Error('Failed to retrieve created budget');
      }

      return createdBudget;
    }

    /**
       * Finds a budget by its MongoDB ObjectId.
       *
       * @param {string} id - The budget ID (as string)
       * @returns {Promise<Budget | null>} The budget or null if not found
       */
      async findBudgetById(id: string): Promise<Budget | null> {
        // Validate ObjectId format to prevent MongoDB errors
        if (!ObjectId.isValid(id)) {
          return null;
        }

        const collection = this.ensureCollection();
        const budget = await collection.findOne({ _id: new ObjectId(id) });
        return budget;
      }

      /**
       * Finds all budgets for a specific user.
       *
       * @param {string} userId - The user ID
       * @returns {Promise<Budget[]>} Array of budgets for the user
       */
      async findByUserId(userId: string): Promise<Budget[]> {
        const collection = this.ensureCollection();
        const budgets = await collection.find({ userId }).toArray();
        return budgets;
      }

      /**
       * Finds a budget by user, month, and year.
       * Used to check for duplicate budgets.
       *
       * @param {string} userId - The user ID
       * @param {string} month - The month
       * @param {number} year - The year
       * @param {string} categoryId - Optional category ID
       * @returns {Promise<Budget | null>} The budget or null if not found
       */
      async findByUserMonthYear(userId: string, month: string, year: number, categoryId?: string): Promise<Budget | null> {
        const collection = this.ensureCollection();
        const query: any = { userId, month, year };

        if (categoryId) {
          query.categoryId = categoryId;
        } else {
          query.categoryId = { $exists: false };
        }

        const budget = await collection.findOne(query);
        return budget;
      }

      /**
         * Retrieves all budgets from the database.
         *
         * @returns {Promise<Budget[]>} Array of all budgets
         */
        async findAllBudgets(): Promise<Budget[]> {
          const collection = this.ensureCollection();
          const budgets = await collection.find({}).toArray();
          return budgets;
        }

        /**
           * Updates an existing budget with partial data.
           * Automatically updates the updatedAt timestamp.
           *
           * @param {string} id - The budget ID to update
           * @param {UpdateBudgetRequest} updateData - Partial budget data to update
           * @returns {Promise<Budget | null>} Updated budget or null if not found
           */
          async updateBudget(id: string, updateData: Partial<UpdateBudgetRequest>): Promise<Budget | null> {
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

            return await this.findBudgetById(id);
          }

          /**
         * Deletes a budget from the database.
         *
         * @param {string} id - The budget ID to delete
         * @returns {Promise<boolean>} True if deleted, false if not found
         */
        async deleteBudget(id: string): Promise<boolean> {
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
         * - userId: For fast user-specific queries
         * - userId + month + year + categoryId: For uniqueness and fast lookups
         */
        async createIndexes(): Promise<void> {
            const collection = this.ensureCollection();

            // Index on userId for fast user-specific queries
            await collection.createIndex({ userId: 1 });

            // Compound index for uniqueness (one budget per user/month/year/category combination)
            await collection.createIndex(
              { userId: 1, month: 1, year: 1, categoryId: 1 },
              { unique: true, sparse: true }
            );
        }

}
