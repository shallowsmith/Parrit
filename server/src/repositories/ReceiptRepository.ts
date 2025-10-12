import { Collection, Db, ObjectId } from 'mongodb';
import type { InsertOneResult, UpdateResult, DeleteResult } from 'mongodb';
import type { Receipt, CreateReceiptRequest, UpdateReceiptRequest } from '../models/Receipt';
import DatabaseConnection from '../config/database';

/**
 * @swagger
 * components:
 *   schemas:
 *     Receipt:
 *       type: object
 *       required:
 *         - id
 *         - merchantName
 *         - amount
 *         - date
 *         - categoryId
 *         - userId
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the receipt (MongoDB ObjectId)
 *           example: "507f1f77bcf86cd799439011"
 *         merchantName:
 *           type: string
 *           description: Name of the merchant/vendor
 *           example: "Whole Foods Market"
 *         amount:
 *           type: number
 *           format: double
 *           description: Transaction amount
 *           example: 45.67
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date of the transaction
 *           example: "2025-10-06T14:30:00Z"
 *         categoryId:
 *           type: string
 *           description: Category ID for this receipt (MongoDB ObjectId)
 *           example: "507f1f77bcf86cd799439012"
 *         userId:
 *           type: string
 *           description: User ID who owns this receipt (MongoDB ObjectId)
 *           example: "68df4cd8f4c53b419fc5f196"
 *         imageUrl:
 *           type: string
 *           format: uri
 *           description: URL to the receipt image
 *           example: "https://example.com/receipts/image.jpg"
 *         notes:
 *           type: string
 *           description: Additional notes about the receipt
 *           example: "Business lunch with client"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the receipt was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the receipt was last updated
 */

/**
 * Repository class for Receipt data access operations.
 *
 * Implements the Repository pattern to:
 * - Abstract database operations from business logic
 * - Provide a clean interface for data persistence
 * - Handle MongoDB-specific operations
 * - Manage database indexes and optimization
 */
export class ReceiptRepository {
    private collection: Collection<Receipt> | null = null;

    constructor() {

    }

    /**
   * Ensures the collection is initialized before use.
   * Implements lazy initialization pattern to avoid connection timing issues.
   *
   * @returns {Collection<Receipt>} The receipts collection
   * @throws {Error} If database is not connected
   */
  private ensureCollection(): Collection<Receipt> {
    if (!this.collection) {
      const db: Db = DatabaseConnection.getInstance().getDatabase();
      this.collection = db.collection<Receipt>('receipts');
    }
    return this.collection;
  }

  /**
     * Creates a new receipt in the database.
     * Adds timestamps for audit trail.
     *
     * @param {CreateReceiptRequest} receiptData - Validated receipt data
     * @returns {Promise<Receipt>} The created receipt with generated ID
     * @throws {Error} If receipt creation fails
     */
    async createReceipt(receiptData: CreateReceiptRequest): Promise<Receipt> {
      const collection = this.ensureCollection();
      // Add timestamps for audit trail
      const now = new Date();

      // Convert date string to Date object if needed
      const receiptDate = typeof receiptData.date === 'string'
        ? new Date(receiptData.date)
        : receiptData.date;

      const receipt: Omit<Receipt, '_id'> = {
        ...receiptData,
        date: receiptDate,
        id: '',
        createdAt: now,
        updatedAt: now,
      };

      const result: InsertOneResult<Receipt> = await collection.insertOne(receipt as Receipt);

      if (!result.insertedId) {
        throw new Error('Failed to create receipt');
      }

      const createdReceipt = await collection.findOne({ _id: result.insertedId });

      if (!createdReceipt) {
        throw new Error('Failed to retrieve created receipt');
      }

      return createdReceipt;
    }

    /**
       * Finds a receipt by its MongoDB ObjectId.
       *
       * @param {string} id - The receipt ID (as string)
       * @returns {Promise<Receipt | null>} The receipt or null if not found
       */
      async findReceiptById(id: string): Promise<Receipt | null> {
        // Validate ObjectId format to prevent MongoDB errors
        if (!ObjectId.isValid(id)) {
          return null;
        }

        const collection = this.ensureCollection();
        const receipt = await collection.findOne({ _id: new ObjectId(id) });
        return receipt;
      }

      /**
       * Finds all receipts for a specific user.
       *
       * @param {string} userId - The user ID
       * @returns {Promise<Receipt[]>} Array of receipts for the user
       */
      async findByUserId(userId: string): Promise<Receipt[]> {
        const collection = this.ensureCollection();
        const receipts = await collection.find({ userId }).toArray();
        return receipts;
      }

      /**
       * Finds all receipts for a specific category.
       *
       * @param {string} categoryId - The category ID
       * @returns {Promise<Receipt[]>} Array of receipts for the category
       */
      async findByCategoryId(categoryId: string): Promise<Receipt[]> {
        const collection = this.ensureCollection();
        const receipts = await collection.find({ categoryId }).toArray();
        return receipts;
      }

      /**
         * Retrieves all receipts from the database.
         *
         * @returns {Promise<Receipt[]>} Array of all receipts
         */
        async findAllReceipts(): Promise<Receipt[]> {
          const collection = this.ensureCollection();
          const receipts = await collection.find({}).toArray();
          return receipts;
        }

        /**
           * Updates an existing receipt with partial data.
           * Automatically updates the updatedAt timestamp.
           *
           * @param {string} id - The receipt ID to update
           * @param {UpdateReceiptRequest} updateData - Partial receipt data to update
           * @returns {Promise<Receipt | null>} Updated receipt or null if not found
           */
          async updateReceipt(id: string, updateData: Partial<UpdateReceiptRequest>): Promise<Receipt | null> {
            if (!ObjectId.isValid(id)) {
              return null;
            }

            const collection = this.ensureCollection();

            // Convert date string to Date object if needed
            const updatePayload: any = {
              ...updateData,
              updatedAt: new Date(),
            };

            if (updateData.date) {
              updatePayload.date = typeof updateData.date === 'string'
                ? new Date(updateData.date)
                : updateData.date;
            }

            const result: UpdateResult = await collection.updateOne(
              { _id: new ObjectId(id) },
              { $set: updatePayload }
            );

            if (result.matchedCount === 0) {
              return null;
            }

            return await this.findReceiptById(id);
          }

          /**
         * Deletes a receipt from the database.
         *
         * @param {string} id - The receipt ID to delete
         * @returns {Promise<boolean>} True if deleted, false if not found
         */
        async deleteReceipt(id: string): Promise<boolean> {
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
         * - categoryId: For fast category-specific queries
         * - date: For date-based queries and sorting
         */
        async createIndexes(): Promise<void> {
            const collection = this.ensureCollection();

            // Index on userId for fast user-specific queries
            await collection.createIndex({ userId: 1 });

            // Index on categoryId for fast category-specific queries
            await collection.createIndex({ categoryId: 1 });

            // Index on date for date-based queries and sorting
            await collection.createIndex({ date: -1 });
        }

}
