import { BudgetRepository } from '../repositories/BudgetRepository';
import {
  BudgetValidationError,
  validateCreateBudgetRequest,
  toBudgetResponse,
  updateBudgetSchema
} from '../models/Budget';
import type {
  Budget,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  BudgetResponse
} from '../models/Budget';
import { z } from 'zod';

/**
 * Service class for Budget business logic.
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
 *   name: Budgets
 *   description: Budget management endpoints for tracking spending limits
 */
export class BudgetService {
  private budgetRepository: BudgetRepository;

  constructor() {
    // Initialize repository for data access
    // In a larger app, this would be injected for better testability
    this.budgetRepository = new BudgetRepository();
  }

  /**
     * Creates a new budget with validation and business rules.
     *
     * Business logic includes:
     * - Input validation and sanitization
     * - Duplicate budget check (same user/month/year/category)
     * - Data transformation for response
     *
     * @param {any} budgetData - Raw budget data from request
     * @returns {Promise<BudgetResponse>} Created budget response
     * @throws {BudgetValidationError} If validation fails or budget exists
     */
    async createBudget(budgetData: any): Promise<BudgetResponse> {
      // Step 1: Validate and sanitize input data
      const validatedData = validateCreateBudgetRequest(budgetData);

      // Step 2: Business rule - Budget must be unique per user/month/year/category
      const existingBudget = await this.budgetRepository.findByUserMonthYear(
        validatedData.userId,
        validatedData.month,
        validatedData.year,
        validatedData.categoryId
      );

      if (existingBudget) {
        throw new BudgetValidationError('Budget already exists for this user, month, and year', 'month');
      }

      // Step 3: Persist to database
      const createdBudget = await this.budgetRepository.createBudget(validatedData);

      // Step 4: Transform to response format
      return toBudgetResponse(createdBudget);
    }

    /**
       * Retrieves a budget by ID.
       *
       * @param {string} id - The budget ID
       * @returns {Promise<BudgetResponse | null>} Budget or null if not found
       * @throws {BudgetValidationError} If ID is invalid
       */
      async getBudgetById(id: string): Promise<BudgetResponse | null> {
        // Validate ID format
        if (!id || typeof id !== 'string') {
          throw new BudgetValidationError('Invalid budget ID');
        }

        const budget = await this.budgetRepository.findBudgetById(id);

        if (!budget) {
          return null;
        }

        return toBudgetResponse(budget);
      }

      /**
         * Retrieves all budgets.
         *
         * @returns {Promise<BudgetResponse[]>} Array of all budgets
         */
        async getAllBudgets(): Promise<BudgetResponse[]> {
          const budgets = await this.budgetRepository.findAllBudgets();
          return budgets.map(budget => toBudgetResponse(budget));
        }

        /**
         * Retrieves all budgets for a specific user.
         *
         * @param {string} userId - The user ID
         * @returns {Promise<BudgetResponse[]>} Array of user's budgets
         */
        async getBudgetsByUserId(userId: string): Promise<BudgetResponse[]> {
          if (!userId || typeof userId !== 'string') {
            throw new BudgetValidationError('Invalid user ID');
          }

          const budgets = await this.budgetRepository.findByUserId(userId);
          return budgets.map(budget => toBudgetResponse(budget));
        }

    /**
       * Updates an existing budget with validation.
       *
       * Supports partial updates - only provided fields are updated.
       *
       * @param {string} id - The budget ID to update
       * @param {any} updateData - Partial budget data to update
       * @returns {Promise<BudgetResponse | null>} Updated budget or null
       * @throws {BudgetValidationError} If validation fails
       */
      async updateBudget(id: string, updateData: any): Promise<BudgetResponse | null> {
        // Validate ID
        if (!id || typeof id !== 'string') {
          throw new BudgetValidationError('Invalid budget ID');
        }

        // Check if budget exists
        const existingBudget = await this.budgetRepository.findBudgetById(id);
        if (!existingBudget) {
          return null;
        }

        // Validate update data using Zod schema
        let validatedData: Partial<UpdateBudgetRequest>;
        try {
          validatedData = updateBudgetSchema.parse(updateData);
        } catch (error) {
          if (error instanceof z.ZodError) {
            const message = error.issues[0]?.message || 'Validation failed';
            throw new BudgetValidationError(
              message,
              error.issues[0]?.path[0]?.toString()
            );
          }
          throw error;
        }

        // Update budget in database
        const updatedBudget = await this.budgetRepository.updateBudget(id, validatedData);

        if (!updatedBudget) {
          return null;
        }

        return toBudgetResponse(updatedBudget);
      }

    /**
       * Deletes a budget by ID.
       *
       * @param {string} id - The budget ID to delete
       * @returns {Promise<boolean>} True if deleted, false if not found
       * @throws {BudgetValidationError} If ID is invalid
       */
      async deleteBudget(id: string): Promise<boolean> {
        if (!id || typeof id !== 'string') {
          throw new BudgetValidationError('Invalid budget ID');
        }

        return await this.budgetRepository.deleteBudget(id);
      }

      /**
       * Initializes database indexes.
       * Should be called during application startup.
       */
      async initializeIndexes(): Promise<void> {
        await this.budgetRepository.createIndexes();
      }
}
