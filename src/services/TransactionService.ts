import { TransactionRepository } from '../repositories/TransactionRepository';
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

  constructor() {
    // Initialize repository for data access
    // In a larger app, this would be injected for better testability
    this.transactionRepository = new TransactionRepository();
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

        return toTransactionResponse(updatedTransaction);
      }

    /**
       * Deletes a transaction by ID.
       *
       * @param {string} id - The transaction ID to delete
       * @returns {Promise<boolean>} True if deleted, false if not found
       * @throws {TransactionValidationError} If ID is invalid
       */
      async deleteTransaction(id: string): Promise<boolean> {
        if (!id || typeof id !== 'string') {
          throw new TransactionValidationError('Invalid transaction ID');
        }

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
