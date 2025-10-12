import { ObjectId } from 'mongodb';
import { z } from 'zod';

export interface Category {
    _id?: ObjectId;
    id: string,
    name: string,
    type: string,
    userId: string,
    createdAt?: Date;
    updatedAt?: Date;
}

// Zod schema for creating a category
export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  type: z.string().trim().min(1, 'Type is required'),
  userId: z.string().trim().min(1, 'User ID is required')
});

// Zod schema for updating a category
export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').optional(),
  type: z.string().trim().min(1, 'Type is required').optional()
});

export type CreateCategoryRequest = z.infer<typeof createCategorySchema>;
export type UpdateCategoryRequest = z.infer<typeof updateCategorySchema>;

export interface CategoryResponse {
    id: string,
    name: string,
    type: string,
    userId: string
    createdAt?: Date;
    updatedAt?: Date;
}

export class CategoryValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public missingFields?: string[]
  ) {
    super(message);
    this.name = 'CategoryValidationError';
  }
}

export function validateCreateCategoryRequest(data: any): CreateCategoryRequest {
  try {
    return createCategorySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.issues.map((err: any) => err.path.join('.'));
      const message = error.issues[0]?.message || 'Validation failed';
      throw new CategoryValidationError(
        message,
        error.issues[0]?.path[0]?.toString(),
        missingFields
      );
    }
    throw error;
  }
}

/**
 * Transforms a database Profile object to an API ProfileResponse.
 * Converts MongoDB ObjectId to string for JSON serialization.
 *
 * @param category - Database category object
 * @returns Category data formatted for API response
 * */
export function toCategoryResponse(category: Category): CategoryResponse {
  return {
    id: category._id?.toString() || category.id || '',
    name: category.name,
    type: category.type,
    userId: category.userId
  };

}
