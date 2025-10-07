import { ObjectId } from 'mongodb';
import { z } from 'zod';

export interface Budget {
    _id?: ObjectId;
    id: string;
    userId: string;
    month: string;
    year: number;
    amount: number;
    remaining: number;
    categoryId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Zod schema for creating a budget
export const createBudgetSchema = z.object({
  userId: z.string().trim().min(1, 'User ID is required'),
  month: z.string().trim().min(1, 'Month is required'),
  year: z.number().int().positive('Year must be a positive integer'),
  amount: z.number().positive('Amount must be positive'),
  remaining: z.number().nonnegative('Remaining must be non-negative'),
  categoryId: z.string().trim().optional()
});

// Zod schema for updating a budget
export const updateBudgetSchema = z.object({
  month: z.string().trim().min(1, 'Month is required').optional(),
  year: z.number().int().positive('Year must be a positive integer').optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  remaining: z.number().nonnegative('Remaining must be non-negative').optional(),
  categoryId: z.string().trim().optional()
});

export type CreateBudgetRequest = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetRequest = z.infer<typeof updateBudgetSchema>;

export interface BudgetResponse {
    id: string;
    userId: string;
    month: string;
    year: number;
    amount: number;
    remaining: number;
    categoryId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class BudgetValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public missingFields?: string[]
  ) {
    super(message);
    this.name = 'BudgetValidationError';
  }
}

export function validateCreateBudgetRequest(data: any): CreateBudgetRequest {
  try {
    return createBudgetSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.issues.map((err: any) => err.path.join('.'));
      const message = error.issues[0]?.message || 'Validation failed';
      throw new BudgetValidationError(
        message,
        error.issues[0]?.path[0]?.toString(),
        missingFields
      );
    }
    throw error;
  }
}

/**
 * Transforms a database Budget object to an API BudgetResponse.
 * Converts MongoDB ObjectId to string for JSON serialization.
 *
 * @param budget - Database budget object
 * @returns Budget data formatted for API response
 * */
export function toBudgetResponse(budget: Budget): BudgetResponse {
  return {
    id: budget._id?.toString() || budget.id || '',
    userId: budget.userId,
    month: budget.month,
    year: budget.year,
    amount: budget.amount,
    remaining: budget.remaining,
    categoryId: budget.categoryId,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt
  };
}
