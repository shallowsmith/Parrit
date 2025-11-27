import { CategoryRepository } from '../repositories/CategoryRepository';
import {
  CategoryValidationError,
  validateCreateCategoryRequest,
  toCategoryResponse,
  updateCategorySchema
} from '../models/Category';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryResponse
} from '../models/Category';
import { z } from 'zod';

/**
 * Service class for Category business logic.
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
 *   name: Categories
 *   description: Category management endpoints for organizing transactions
 */
export class CategoryService {
  private categoryRepository: CategoryRepository;
  private transactionRepository: any;

  constructor() {
    // Initialize repository for data access
    // In a larger app, this would be injected for better testability
    this.categoryRepository = new CategoryRepository();
  }

  /**
     * Creates a new category with validation and business rules.
     *
     * Business logic includes:
     * - Input validation and sanitization
     * - Email uniqueness check
     * - Data transformation for response
     *
     * @param {any} categoryData - Raw category data from request
     * @returns {Promise<CategoryResponse>} Created category response
     * @throws {CategoryValidationError} If validation fails or category exists
     */
    async createCategory(categoryData: any): Promise<CategoryResponse> {
      // Step 1: Validate and sanitize input data
      const validatedData = validateCreateCategoryRequest(categoryData);

      // Step 2: Business rule - Category name must be unique per user
      const existingCategory = await this.categoryRepository.findByNameAndUserId(validatedData.name, validatedData.userId);
      if (existingCategory) {
        throw new CategoryValidationError('Category name already exists for this user', 'name');
      }

      // Step 3: Persist to database
      const createdCategory = await this.categoryRepository.createCategory(validatedData);

      // Step 4: Transform to response format
      return toCategoryResponse(createdCategory);
    }

    /**
     * Merge duplicate categories for a user by name (case-insensitive).
     * For each set of duplicates, pick the first as canonical, reassign transactions
     * from duplicates to the canonical category, then remove the duplicates.
     * Also fixes orphaned transactions (transactions with invalid category IDs).
     * Returns an array of merge results.
     */
    async dedupeCategoriesForUser(userId: string): Promise<Array<{ keepId: string; removedId: string; movedTransactions: number }>> {
      if (!userId) throw new CategoryValidationError('Invalid userId');
      // lazy require to avoid circular deps
      const { TransactionRepository } = await import('../repositories/TransactionRepository');
      const txRepo = new TransactionRepository();
      const cats = await this.categoryRepository.findByUserId(userId);

      // First, fix orphaned transactions
      const validCategoryIds = cats.map(c => String(c._id || c.id));
      let uncategorizedCat = cats.find(c => String(c.name || '').toLowerCase() === 'uncategorized');

      // If no "Uncategorized" category exists, create one
      if (!uncategorizedCat) {
        const created = await this.categoryRepository.createCategory({
          name: 'Uncategorized',
          type: 'expense',
          userId,
          color: '#9CA3AF'
        });
        uncategorizedCat = created;
        validCategoryIds.push(String(created._id || created.id));
      }

      // Get all transactions and fix orphaned ones, including those with 'misc' string
      const allTransactions = await txRepo.findByUserId(userId);
      let orphanedCount = 0;
      let miscFixedCount = 0;
      console.log(`[DEDUPE] Found ${allTransactions.length} transactions for user ${userId}`);
      console.log(`[DEDUPE] Valid category IDs:`, validCategoryIds);

      // Find the Misc category (if it exists)
      const miscCat = cats.find(c => String(c.name || '').toLowerCase() === 'misc');

      for (const tx of allTransactions) {
        const txCatId = String(tx.categoryId || '');

        // Fix transactions with string literal 'misc' to use proper Misc category ID
        if (txCatId.toLowerCase() === 'misc' && miscCat) {
          const txId = String(tx._id || tx.id);
          const miscId = String(miscCat._id || miscCat.id);
          console.log(`[DEDUPE] Found 'misc' string transaction: vendor=${tx.vendorName}, categoryId=${txCatId}, txId=${txId}`);
          console.log(`[DEDUPE] Updating transaction ${txId} to Misc category ${miscId}`);
          await txRepo.updateTransaction(txId, {
            categoryId: miscId
          });
          miscFixedCount++;
          console.log(`[DEDUPE] Fixed 'misc' string transaction ${txId} to Misc category (${miscId})`);
        }
        // Fix orphaned transactions (invalid category IDs)
        else if (txCatId && !validCategoryIds.includes(txCatId)) {
          console.log(`[DEDUPE] Found orphaned transaction: vendor=${tx.vendorName}, categoryId=${txCatId}, txId=${tx._id || tx.id}`);
          // This transaction has an invalid category ID - reassign to Uncategorized
          const txId = String(tx._id || tx.id);
          const uncatId = String(uncategorizedCat._id || uncategorizedCat.id);
          console.log(`[DEDUPE] Updating transaction ${txId} to categoryId ${uncatId}`);
          await txRepo.updateTransaction(txId, {
            categoryId: uncatId
          });
          orphanedCount++;
          console.log(`[DEDUPE] Reassigned transaction ${txId} to Uncategorized (${uncatId})`);
        }
      }
      console.log(`[DEDUPE] Fixed ${orphanedCount} orphaned transactions and ${miscFixedCount} 'misc' string transactions`);

      // Now dedupe categories
      const groups: Record<string, any[]> = {};
      cats.forEach(c => {
        const key = String(c.name || '').toLowerCase().trim();
        if (!key) return;
        groups[key] = groups[key] || [];
        groups[key].push(c);
      });

      const results: Array<{ keepId: string; removedId: string; movedTransactions: number }> = [];

      // Add orphaned fix result if any
      if (orphanedCount > 0) {
        results.push({
          keepId: String(uncategorizedCat._id || uncategorizedCat.id),
          removedId: 'orphaned',
          movedTransactions: orphanedCount
        });
      }

      for (const key of Object.keys(groups)) {
        const arr = groups[key];
        if (arr.length <= 1) continue;
        const canonical = arr[0];
        for (let i = 1; i < arr.length; i++) {
          const dup = arr[i];
          // move transactions
          const moved = await txRepo.updateCategoryIdForUser(userId, dup._id?.toString() || dup.id, canonical._id?.toString() || canonical.id);
          // delete duplicate category
          await this.categoryRepository.deleteCategory(dup._id?.toString() || dup.id);
          results.push({ keepId: canonical._id?.toString() || canonical.id, removedId: dup._id?.toString() || dup.id, movedTransactions: moved });
        }
      }
      return results;
    }

    /**
       * Retrieves a cateogry by ID.
       *
       * @param {string} id - The cateogry ID
       * @returns {Promise<CategoryResponse | null>} Cateogry or null if not found
       * @throws {CateogryValidationError} If ID is invalid
       */
      async getCategoryById(id: string): Promise<CategoryResponse | null> {
        // Validate ID format
        if (!id || typeof id !== 'string') {
          throw new CategoryValidationError('Invalid category ID');
        }
    
        const category = await this.categoryRepository.findCategoryById(id);
    
        if (!category) {
          return null;
        }
    
        return toCategoryResponse(category);
      }

      /**
         * Retrieves all categories.
         *
         * @returns {Promise<CategoryResponse[]>} Array of all categories
         */
        async getAllCategories(): Promise<CategoryResponse[]> {
          const categories = await this.categoryRepository.findAllCategories();
          return categories.map(category => toCategoryResponse(category));
        }

      /**
         * Retrieves all categories for a specific user.
         *
         * @param {string} userId - The user ID
         * @returns {Promise<CategoryResponse[]>} Array of user's categories
         */
        async getCategoriesByUserId(userId: string): Promise<CategoryResponse[]> {
          const categories = await this.categoryRepository.findByUserId(userId);
          return categories.map(category => toCategoryResponse(category));
        }

    /**
       * Updates an existing category with validation.
       *
       * Supports partial updates - only provided fields are updated.
       *
       * @param {string} id - The category ID to update
       * @param {any} updateData - Partial category data to update
       * @returns {Promise<CategoryResponse | null>} Updated category or null
       * @throws {CategoryValidationError} If validation fails
       */
      async updateCategory(id: string, updateData: any): Promise<CategoryResponse | null> {
        // Validate ID
        if (!id || typeof id !== 'string') {
          throw new CategoryValidationError('Invalid category ID');
        }

        // Check if category exists
        const existingCategory = await this.categoryRepository.findCategoryById(id);
        if (!existingCategory) {
          return null;
        }

        // Validate update data using Zod schema
        let validatedData: Partial<UpdateCategoryRequest>;
        try {
          validatedData = updateCategorySchema.parse(updateData);
        } catch (error) {
          if (error instanceof z.ZodError) {
            const message = error.issues[0]?.message || 'Validation failed';
            throw new CategoryValidationError(
              message,
              error.issues[0]?.path[0]?.toString()
            );
          }
          throw error;
        }

        // Update category in database
        const updatedCategory = await this.categoryRepository.updateCategory(id, validatedData);

        if (!updatedCategory) {
          return null;
        }

        return toCategoryResponse(updatedCategory);
      }

    /**
       * Deletes a category by ID.
       *
       * @param {string} id - The category ID to delete
       * @returns {Promise<boolean>} True if deleted, false if not found
       * @throws {CategoryValidationError} If ID is invalid
       */
      async deleteCategory(id: string): Promise<boolean> {
        if (!id || typeof id !== 'string') {
          throw new CategoryValidationError('Invalid category ID');
        }
    
        return await this.categoryRepository.deleteCategory(id);
      }
    
      /**
       * Initializes database indexes.
       * Should be called during application startup.
       */
      async initializeIndexes(): Promise<void> {
        await this.categoryRepository.createIndexes();
      }
}

