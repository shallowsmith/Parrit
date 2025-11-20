import { ObjectId } from 'mongodb';
import { z } from 'zod';

export interface Receipt {
    _id?: ObjectId;
    id: string;
    merchantName: string;
    amount: number;
    date: Date;
    categoryId: string;
    userId: string;
    imageUrl?: string;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Zod schema for creating a receipt
export const createReceiptSchema = z.object({
  merchantName: z.string().trim().min(1, 'Merchant name is required'),
  amount: z.number().nonnegative(),
  date: z.string().datetime('Invalid date format').or(z.date()),
  categoryId: z.string().trim().min(1, 'Category ID is required'),
  userId: z.string().trim().min(1, 'User ID is required'),
  imageUrl: z.string().url('Invalid URL format').optional(),
  notes: z.string().trim().optional()
});

// Zod schema for updating a receipt
export const updateReceiptSchema = z.object({
  merchantName: z.string().trim().min(1, 'Merchant name is required').optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  date: z.string().datetime('Invalid date format').or(z.date()).optional(),
  categoryId: z.string().trim().min(1, 'Category ID is required').optional(),
  imageUrl: z.string().url('Invalid URL format').optional(),
  notes: z.string().trim().optional()
});

export type CreateReceiptRequest = z.infer<typeof createReceiptSchema>;
export type UpdateReceiptRequest = z.infer<typeof updateReceiptSchema>;

export interface ReceiptResponse {
    id: string;
    merchantName: string;
    amount: number;
    date: Date;
    categoryId: string;
    userId: string;
    imageUrl?: string;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;

    // 🧠 new field for AI category prediction
    predictedCategory?: string;
}

export class ReceiptValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public missingFields?: string[]
  ) {
    super(message);
    this.name = 'ReceiptValidationError';
  }
}

export function validateCreateReceiptRequest(data: any): CreateReceiptRequest {
  try {
    return createReceiptSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.issues.map((err: any) => err.path.join('.'));
      const message = error.issues[0]?.message || 'Validation failed';
      throw new ReceiptValidationError(
        message,
        error.issues[0]?.path[0]?.toString(),
        missingFields
      );
    }
    throw error;
  }
}

/**
 * Transforms a database Receipt object to an API ReceiptResponse.
 * Converts MongoDB ObjectId to string for JSON serialization.
 *
 * @param receipt - Database receipt object
 * @returns Receipt data formatted for API response
 * */
export function toReceiptResponse(receipt: Receipt): ReceiptResponse {
  return {
    id: receipt._id?.toString() || receipt.id || '',
    merchantName: receipt.merchantName,
    amount: receipt.amount,
    date: receipt.date,
    categoryId: receipt.categoryId,
    userId: receipt.userId,
    imageUrl: receipt.imageUrl,
    notes: receipt.notes,
    createdAt: receipt.createdAt,
    updatedAt: receipt.updatedAt
  };
}
