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

