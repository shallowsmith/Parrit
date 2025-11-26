import { TransactionRepository } from '../repositories/TransactionRepository';
import { ReceiptService } from './ReceiptService';
import { CategoryService } from './CategoryService';
import {
  TransactionValidationError,
  validateCreateTransactionRequest,
  toTransactionResponse,
  updateTransactionSchema
} from '../models/Transaction';
import type {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionResponse
} from '../models/Transaction';
import { z } from 'zod';

/**
 * Service class for Transaction business logic.
 *
 * Implements the Service Layer pattern to:
 * - Encapsulate business rules and validation
 * - Orchestrate repository operations
 * - Transform data between layers
 * - Handle business-specific errors
 *
 * This layer sits between routes (presentation) and repositories (data access),
 * ensuring separation of concerns and maintainability.
 *
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management endpoints for tracking financial transactions
 */
export class TransactionService {
  private transactionRepository: TransactionRepository;
  private receiptService: ReceiptService;
  private categoryService: CategoryService;

  constructor() {
    // Initialize repository for data access
    // In a larger app, this would be injected for better testability
    this.transactionRepository = new TransactionRepository();
    this.receiptService = new ReceiptService();
    this.categoryService = new CategoryService();
  }

  /**
     * Creates a new transaction with validation and business rules.
     *
     * Business logic includes:
     * - Input validation and sanitization
     * - Data transformation for response
     *
     * @param {any} transactionData - Raw transaction data from request
     * @returns {Promise<TransactionResponse>} Created transaction response
     * @throws {TransactionValidationError} If validation fails
     */
    async createTransaction(transactionData: any): Promise<TransactionResponse> {
      // Step 1: Validate and sanitize input data
      const validatedData = validateCreateTransactionRequest(transactionData);

      // Step 2: Persist to database
      const createdTransaction = await this.transactionRepository.createTransaction(validatedData);

      // Step 3: Transform to response format
      return toTransactionResponse(createdTransaction);
    }

    /**
       * Retrieves a transaction by ID.
       *
       * @param {string} id - The transaction ID
       * @returns {Promise<TransactionResponse | null>} Transaction or null if not found
       * @throws {TransactionValidationError} If ID is invalid
       */
      async getTransactionById(id: string): Promise<TransactionResponse | null> {
        // Validate ID format
        if (!id || typeof id !== 'string') {
          throw new TransactionValidationError('Invalid transaction ID');
        }

        const transaction = await this.transactionRepository.findTransactionById(id);

        if (!transaction) {
          return null;
        }

        return toTransactionResponse(transaction);
      }

      /**
         * Retrieves all transactions.
         *
         * @returns {Promise<TransactionResponse[]>} Array of all transactions
         */
        async getAllTransactions(): Promise<TransactionResponse[]> {
          const transactions = await this.transactionRepository.findAllTransactions();
          return transactions.map(transaction => toTransactionResponse(transaction));
        }

        /**
         * Retrieves all transactions for a specific user.
         *
         * @param {string} userId - The user ID
         * @returns {Promise<TransactionResponse[]>} Array of user's transactions
         */
        async getTransactionsByUserId(userId: string): Promise<TransactionResponse[]> {
          if (!userId || typeof userId !== 'string') {
            throw new TransactionValidationError('Invalid user ID');
          }

          const transactions = await this.transactionRepository.findByUserId(userId);
          return transactions.map(transaction => toTransactionResponse(transaction));
        }

        /**
         * Retrieves all transactions for a specific category.
         *
         * @param {string} categoryId - The category ID
         * @returns {Promise<TransactionResponse[]>} Array of category's transactions
         */
        async getTransactionsByCategoryId(categoryId: string): Promise<TransactionResponse[]> {
          if (!categoryId || typeof categoryId !== 'string') {
            throw new TransactionValidationError('Invalid category ID');
          }

          const transactions = await this.transactionRepository.findByCategoryId(categoryId);
          return transactions.map(transaction => toTransactionResponse(transaction));
        }

        /**
         * Retrieves all transactions for a specific receipt.
         *
         * @param {string} receiptId - The receipt ID
         * @returns {Promise<TransactionResponse[]>} Array of receipt's transactions
         */
        async getTransactionsByReceiptId(receiptId: string): Promise<TransactionResponse[]> {
          if (!receiptId || typeof receiptId !== 'string') {
            throw new TransactionValidationError('Invalid receipt ID');
          }

          const transactions = await this.transactionRepository.findByReceiptId(receiptId);
          return transactions.map(transaction => toTransactionResponse(transaction));
        }

    /**
       * Updates an existing transaction with validation.
       *
       * Supports partial updates - only provided fields are updated.
       * If transaction has a linked receipt, syncs changes to Firestore.
       *
       * @param {string} id - The transaction ID to update
       * @param {any} updateData - Partial transaction data to update
       * @returns {Promise<TransactionResponse | null>} Updated transaction or null
       * @throws {TransactionValidationError} If validation fails
       */
      async updateTransaction(id: string, updateData: any): Promise<TransactionResponse | null> {
        // Validate ID
        if (!id || typeof id !== 'string') {
          throw new TransactionValidationError('Invalid transaction ID');
        }

        // Check if transaction exists
        const existingTransaction = await this.transactionRepository.findTransactionById(id);
        if (!existingTransaction) {
          return null;
        }

        // Validate update data using Zod schema
        let validatedData: Partial<UpdateTransactionRequest>;
        try {
          validatedData = updateTransactionSchema.parse(updateData);
        } catch (error) {
          if (error instanceof z.ZodError) {
            const message = error.issues[0]?.message || 'Validation failed';
            throw new TransactionValidationError(
              message,
              error.issues[0]?.path[0]?.toString()
            );
          }
          throw error;
        }

        // Update transaction in database
        const updatedTransaction = await this.transactionRepository.updateTransaction(id, validatedData);

        if (!updatedTransaction) {
          return null;
        }

        // Sync changes to linked receipt if exists
        if (updatedTransaction.receiptId) {
          await this.syncTransactionToReceipt(updatedTransaction, validatedData);
        }

        return toTransactionResponse(updatedTransaction);
      }

      /**
       * Syncs transaction changes to linked receipt in Firestore.
       * Maps transaction fields to receipt fields for consistency.
       *
       * @param {Transaction} transaction - Updated transaction
       * @param {Partial<UpdateTransactionRequest>} updateData - Fields that were updated
       * @private
       */
      private async syncTransactionToReceipt(
        transaction: Transaction,
        updateData: Partial<UpdateTransactionRequest>
      ): Promise<void> {
        try {
          const receiptUpdateData: any = {};

          // Map transaction fields to receipt fields
          if (updateData.vendorName !== undefined) {
            receiptUpdateData.merchantName = updateData.vendorName;
          }
          if (updateData.amount !== undefined) {
            receiptUpdateData.amount = updateData.amount;
          }
          if (updateData.description !== undefined) {
            receiptUpdateData.notes = updateData.description;
          }
          if (updateData.dateTime !== undefined) {
            receiptUpdateData.date = new Date(updateData.dateTime);
          }
          if (updateData.paymentType !== undefined) {
            receiptUpdateData.paymentType = updateData.paymentType;
          }

          // Resolve category name if categoryId was updated
          if (updateData.categoryId !== undefined) {
            try {
              const category = await this.categoryService.getCategoryById(updateData.categoryId);
              if (category) {
                receiptUpdateData.category = category.name;
              }
            } catch (error) {
              console.warn('Could not resolve category name for receipt sync:', error);
              // Continue with sync even if category resolution fails
            }
          }

          // Only update receipt if there are fields to update
          if (Object.keys(receiptUpdateData).length > 0) {
            if (!transaction.receiptId) return;
            await this.receiptService.updateReceipt(transaction.receiptId, receiptUpdateData);
            console.log(`✅ Synced transaction ${transaction.id} to receipt ${transaction.receiptId}`);
          }
        } catch (error) {
          console.error('Failed to sync transaction to receipt:', error);
          // Don't throw - receipt sync failure shouldn't fail the transaction update
        }
      }

    /**
       * Deletes a transaction by ID.
       * If the transaction has a linked receipt, also deletes the receipt from Firestore and Firebase Storage.
       *
       * @param {string} id - The transaction ID to delete
       * @returns {Promise<boolean>} True if deleted, false if not found
       * @throws {TransactionValidationError} If ID is invalid
       */
      async deleteTransaction(id: string): Promise<boolean> {
        if (!id || typeof id !== 'string') {
          throw new TransactionValidationError('Invalid transaction ID');
        }

        // Get the transaction to check if it has a linked receipt
        const transaction = await this.transactionRepository.findTransactionById(id);

        if (!transaction) {
          return false;
        }

        // If transaction has a linked receipt, delete it from Firestore and Storage
        if (transaction.receiptId) {
          try {
            console.log(`🗑️ Deleting linked receipt ${transaction.receiptId} for transaction ${id}`);
            await this.receiptService.deleteReceipt(transaction.receiptId);
            console.log(`✅ Successfully deleted linked receipt ${transaction.receiptId}`);
          } catch (error) {
            console.error(`Failed to delete linked receipt ${transaction.receiptId}:`, error);
            // Continue with transaction deletion even if receipt deletion fails
          }
        }

        // Delete the transaction from MongoDB
        return await this.transactionRepository.deleteTransaction(id);
      }

      /**
       * Initializes database indexes.
       * Should be called during application startup.
       */
      async initializeIndexes(): Promise<void> {
        await this.transactionRepository.createIndexes();
      }
}
