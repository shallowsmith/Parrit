import { ReceiptRepository } from '../repositories/ReceiptRepository';
import {
  ReceiptValidationError,
  validateCreateReceiptRequest,
  toReceiptResponse,
  updateReceiptSchema
} from '../models/Receipt';
import type {
  Receipt,
  CreateReceiptRequest,
  UpdateReceiptRequest,
  ReceiptResponse
} from '../models/Receipt';
import { z } from 'zod';

/**
 * Service class for Receipt business logic.
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
 *   name: Receipts
 *   description: Receipt management endpoints for tracking transactions and expenses
 */
export class ReceiptService {
  private receiptRepository: ReceiptRepository;

  constructor() {
    // Initialize repository for data access
    // In a larger app, this would be injected for better testability
    this.receiptRepository = new ReceiptRepository();
  }

  /**
     * Creates a new receipt with validation and business rules.
     *
     * Business logic includes:
     * - Input validation and sanitization
     * - Data transformation for response
     *
     * @param {any} receiptData - Raw receipt data from request
     * @returns {Promise<ReceiptResponse>} Created receipt response
     * @throws {ReceiptValidationError} If validation fails
     */
    async createReceipt(receiptData: any): Promise<ReceiptResponse> {
      // Step 1: Validate and sanitize input data
      const validatedData = validateCreateReceiptRequest(receiptData);

      // Step 2: Persist to database
      const createdReceipt = await this.receiptRepository.createReceipt(validatedData);

      // Step 3: Transform to response format
      return toReceiptResponse(createdReceipt);
    }

    /**
       * Retrieves a receipt by ID.
       *
       * @param {string} id - The receipt ID
       * @returns {Promise<ReceiptResponse | null>} Receipt or null if not found
       * @throws {ReceiptValidationError} If ID is invalid
       */
      async getReceiptById(id: string): Promise<ReceiptResponse | null> {
        // Validate ID format
        if (!id || typeof id !== 'string') {
          throw new ReceiptValidationError('Invalid receipt ID');
        }

        const receipt = await this.receiptRepository.findReceiptById(id);

        if (!receipt) {
          return null;
        }

        return toReceiptResponse(receipt);
      }

      /**
         * Retrieves all receipts.
         *
         * @returns {Promise<ReceiptResponse[]>} Array of all receipts
         */
        async getAllReceipts(): Promise<ReceiptResponse[]> {
          const receipts = await this.receiptRepository.findAllReceipts();
          return receipts.map(receipt => toReceiptResponse(receipt));
        }

        /**
         * Retrieves all receipts for a specific user.
         *
         * @param {string} userId - The user ID
         * @returns {Promise<ReceiptResponse[]>} Array of user's receipts
         */
        async getReceiptsByUserId(userId: string): Promise<ReceiptResponse[]> {
          if (!userId || typeof userId !== 'string') {
            throw new ReceiptValidationError('Invalid user ID');
          }

          const receipts = await this.receiptRepository.findByUserId(userId);
          return receipts.map(receipt => toReceiptResponse(receipt));
        }

        /**
         * Retrieves all receipts for a specific category.
         *
         * @param {string} categoryId - The category ID
         * @returns {Promise<ReceiptResponse[]>} Array of category's receipts
         */
        async getReceiptsByCategoryId(categoryId: string): Promise<ReceiptResponse[]> {
          if (!categoryId || typeof categoryId !== 'string') {
            throw new ReceiptValidationError('Invalid category ID');
          }

          const receipts = await this.receiptRepository.findByCategoryId(categoryId);
          return receipts.map(receipt => toReceiptResponse(receipt));
        }

    /**
       * Updates an existing receipt with validation.
       *
       * Supports partial updates - only provided fields are updated.
       *
       * @param {string} id - The receipt ID to update
       * @param {any} updateData - Partial receipt data to update
       * @returns {Promise<ReceiptResponse | null>} Updated receipt or null
       * @throws {ReceiptValidationError} If validation fails
       */
      async updateReceipt(id: string, updateData: any): Promise<ReceiptResponse | null> {
        // Validate ID
        if (!id || typeof id !== 'string') {
          throw new ReceiptValidationError('Invalid receipt ID');
        }

        // Check if receipt exists
        const existingReceipt = await this.receiptRepository.findReceiptById(id);
        if (!existingReceipt) {
          return null;
        }

        // Validate update data using Zod schema
        let validatedData: Partial<UpdateReceiptRequest>;
        try {
          validatedData = updateReceiptSchema.parse(updateData);
        } catch (error) {
          if (error instanceof z.ZodError) {
            const message = error.issues[0]?.message || 'Validation failed';
            throw new ReceiptValidationError(
              message,
              error.issues[0]?.path[0]?.toString()
            );
          }
          throw error;
        }

        // Update receipt in database
        const updatedReceipt = await this.receiptRepository.updateReceipt(id, validatedData);

        if (!updatedReceipt) {
          return null;
        }

        return toReceiptResponse(updatedReceipt);
      }

    /**
       * Deletes a receipt by ID.
       *
       * @param {string} id - The receipt ID to delete
       * @returns {Promise<boolean>} True if deleted, false if not found
       * @throws {ReceiptValidationError} If ID is invalid
       */
      async deleteReceipt(id: string): Promise<boolean> {
        if (!id || typeof id !== 'string') {
          throw new ReceiptValidationError('Invalid receipt ID');
        }

        return await this.receiptRepository.deleteReceipt(id);
      }

      /**
       * Initializes database indexes.
       * Should be called during application startup.
       */
      async initializeIndexes(): Promise<void> {
        await this.receiptRepository.createIndexes();
      }
}
