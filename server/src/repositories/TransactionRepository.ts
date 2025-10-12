import { Collection, Db, ObjectId } from 'mongodb';
import type { InsertOneResult, UpdateResult, DeleteResult } from 'mongodb';
import type { Transaction, CreateTransactionRequest, UpdateTransactionRequest } from '../models/Transaction';
import DatabaseConnection from '../config/database';

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *         - vendorName
 *         - description
 *         - dateTime
 *         - amount
 *         - paymentType
 *         - categoryId
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the transaction (MongoDB ObjectId)
 *           example: "507f1f77bcf86cd799439011"
 *         userId:
 *           type: string
 *           description: User ID who owns this transaction (MongoDB ObjectId)
 *           example: "68df4cd8f4c53b419fc5f196"
 *         vendorName:
 *           type: string
 *           description: Name of the vendor/merchant
 *           example: "Starbucks"
 *         description:
 *           type: string
 *           description: Transaction description
 *           example: "Morning coffee"
 *         dateTime:
 *           type: string
 *           format: date-time
 *           description: Date and time of the transaction
 *           example: "2025-10-06T10:30:00Z"
 *         amount:
 *           type: number
 *           format: double
 *           description: Transaction amount
 *           example: 5.99
 *         paymentType:
 *           type: string
 *           description: Payment method used
 *           example: "Credit Card"
 *         categoryId:
 *           type: string
 *           description: Category ID for this transaction (MongoDB ObjectId)
 *           example: "507f1f77bcf86cd799439012"
 *         receiptId:
 *           type: string
 *           description: Optional receipt ID linked to this transaction (MongoDB ObjectId)
 *           example: "507f1f77bcf86cd799439013"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the transaction was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the transaction was last updated
 */

/**
 * Repository class for Transaction data access operations.
 *
 * Implements the Repository pattern to:
 * - Abstract database operations from business logic
 * - Provide a clean interface for data persistence
 * - Handle MongoDB-specific operations
 * - Manage database indexes and optimization
 */
export class TransactionRepository {
    private collection: Collection<Transaction> | null = null;

    constructor() {

    }

    /**
   * Ensures the collection is initialized before use.
   * Implements lazy initialization pattern to avoid connection timing issues.
   *
   * @returns {Collection<Transaction>} The transactions collection
   * @throws {Error} If database is not connected
   */
  private ensureCollection(): Collection<Transaction> {
    if (!this.collection) {
      const db: Db = DatabaseConnection.getInstance().getDatabase();
      this.collection = db.collection<Transaction>('transactions');
    }
    return this.collection;
  }

  /**
     * Creates a new transaction in the database.
     * Adds timestamps for audit trail.
     *
     * @param {CreateTransactionRequest} transactionData - Validated transaction data
     * @returns {Promise<Transaction>} The created transaction with generated ID
     * @throws {Error} If transaction creation fails
     */
    async createTransaction(transactionData: CreateTransactionRequest): Promise<Transaction> {
      const collection = this.ensureCollection();
      // Add timestamps for audit trail
      const now = new Date();

      // Convert dateTime string to Date object if needed
      const transactionDateTime = typeof transactionData.dateTime === 'string'
        ? new Date(transactionData.dateTime)
        : transactionData.dateTime;

      const transaction: Omit<Transaction, '_id'> = {
        ...transactionData,
        dateTime: transactionDateTime,
        id: '',
        createdAt: now,
        updatedAt: now,
      };

      const result: InsertOneResult<Transaction> = await collection.insertOne(transaction as Transaction);

      if (!result.insertedId) {
        throw new Error('Failed to create transaction');
      }

      const createdTransaction = await collection.findOne({ _id: result.insertedId });

      if (!createdTransaction) {
        throw new Error('Failed to retrieve created transaction');
      }

      return createdTransaction;
    }

    /**
       * Finds a transaction by its MongoDB ObjectId.
       *
       * @param {string} id - The transaction ID (as string)
       * @returns {Promise<Transaction | null>} The transaction or null if not found
       */
      async findTransactionById(id: string): Promise<Transaction | null> {
        // Validate ObjectId format to prevent MongoDB errors
        if (!ObjectId.isValid(id)) {
          return null;
        }

        const collection = this.ensureCollection();
        const transaction = await collection.findOne({ _id: new ObjectId(id) });
        return transaction;
      }

      /**
       * Finds all transactions for a specific user.
       *
       * @param {string} userId - The user ID
       * @returns {Promise<Transaction[]>} Array of transactions for the user
       */
      async findByUserId(userId: string): Promise<Transaction[]> {
        const collection = this.ensureCollection();
        const transactions = await collection.find({ userId }).sort({ dateTime: -1 }).toArray();
        return transactions;
      }

      /**
       * Finds all transactions for a specific category.
       *
       * @param {string} categoryId - The category ID
       * @returns {Promise<Transaction[]>} Array of transactions for the category
       */
      async findByCategoryId(categoryId: string): Promise<Transaction[]> {
        const collection = this.ensureCollection();
        const transactions = await collection.find({ categoryId }).sort({ dateTime: -1 }).toArray();
        return transactions;
      }

      /**
       * Finds all transactions for a specific receipt.
       *
       * @param {string} receiptId - The receipt ID
       * @returns {Promise<Transaction[]>} Array of transactions for the receipt
       */
      async findByReceiptId(receiptId: string): Promise<Transaction[]> {
        const collection = this.ensureCollection();
        const transactions = await collection.find({ receiptId }).toArray();
        return transactions;
      }

      /**
         * Retrieves all transactions from the database.
         *
         * @returns {Promise<Transaction[]>} Array of all transactions
         */
        async findAllTransactions(): Promise<Transaction[]> {
          const collection = this.ensureCollection();
          const transactions = await collection.find({}).sort({ dateTime: -1 }).toArray();
          return transactions;
        }

        /**
           * Updates an existing transaction with partial data.
           * Automatically updates the updatedAt timestamp.
           *
           * @param {string} id - The transaction ID to update
           * @param {UpdateTransactionRequest} updateData - Partial transaction data to update
           * @returns {Promise<Transaction | null>} Updated transaction or null if not found
           */
          async updateTransaction(id: string, updateData: Partial<UpdateTransactionRequest>): Promise<Transaction | null> {
            if (!ObjectId.isValid(id)) {
              return null;
            }

            const collection = this.ensureCollection();

            // Convert dateTime string to Date object if needed
            const updatePayload: any = {
              ...updateData,
              updatedAt: new Date(),
            };

            if (updateData.dateTime) {
              updatePayload.dateTime = typeof updateData.dateTime === 'string'
                ? new Date(updateData.dateTime)
                : updateData.dateTime;
            }

            const result: UpdateResult = await collection.updateOne(
              { _id: new ObjectId(id) },
              { $set: updatePayload }
            );

            if (result.matchedCount === 0) {
              return null;
            }

            return await this.findTransactionById(id);
          }

          /**
         * Deletes a transaction from the database.
         *
         * @param {string} id - The transaction ID to delete
         * @returns {Promise<boolean>} True if deleted, false if not found
         */
        async deleteTransaction(id: string): Promise<boolean> {
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
         * - dateTime: For date-based queries and sorting
         * - receiptId: For receipt-specific queries
         */
        async createIndexes(): Promise<void> {
            const collection = this.ensureCollection();

            // Index on userId for fast user-specific queries
            await collection.createIndex({ userId: 1 });

            // Index on categoryId for fast category-specific queries
            await collection.createIndex({ categoryId: 1 });

            // Index on dateTime for date-based queries and sorting
            await collection.createIndex({ dateTime: -1 });

            // Index on receiptId for receipt-specific queries
            await collection.createIndex({ receiptId: 1 });
        }

}
