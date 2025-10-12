import { ObjectId } from 'mongodb';
import { z } from 'zod';

export interface Transaction {
    _id?: ObjectId;
    id: string;
    userId: string;
    vendorName: string;
    description: string;
    dateTime: Date;
    amount: number;
    paymentType: string;
    categoryId: string;
    receiptId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Zod schema for creating a transaction
export const createTransactionSchema = z.object({
  userId: z.string().trim().min(1, 'User ID is required'),
  vendorName: z.string().trim().min(1, 'Vendor name is required'),
  description: z.string().trim().min(1, 'Description is required'),
  dateTime: z.string().datetime('Invalid date format').or(z.date()),
  amount: z.number().positive('Amount must be positive'),
  paymentType: z.string().trim().min(1, 'Payment type is required'),
  categoryId: z.string().trim().min(1, 'Category ID is required'),
  receiptId: z.string().trim().optional()
});

// Zod schema for updating a transaction
export const updateTransactionSchema = z.object({
  vendorName: z.string().trim().min(1, 'Vendor name is required').optional(),
  description: z.string().trim().min(1, 'Description is required').optional(),
  dateTime: z.string().datetime('Invalid date format').or(z.date()).optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  paymentType: z.string().trim().min(1, 'Payment type is required').optional(),
  categoryId: z.string().trim().min(1, 'Category ID is required').optional(),
  receiptId: z.string().trim().optional()
});

export type CreateTransactionRequest = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionRequest = z.infer<typeof updateTransactionSchema>;

export interface TransactionResponse {
    id: string;
    userId: string;
    vendorName: string;
    description: string;
    dateTime: Date;
    amount: number;
    paymentType: string;
    categoryId: string;
    receiptId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export class TransactionValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public missingFields?: string[]
  ) {
    super(message);
    this.name = 'TransactionValidationError';
  }
}

export function validateCreateTransactionRequest(data: any): CreateTransactionRequest {
  try {
    return createTransactionSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.issues.map((err: any) => err.path.join('.'));
      const message = error.issues[0]?.message || 'Validation failed';
      throw new TransactionValidationError(
        message,
        error.issues[0]?.path[0]?.toString(),
        missingFields
      );
    }
    throw error;
  }
}

/**
 * Transforms a database Transaction object to an API TransactionResponse.
 * Converts MongoDB ObjectId to string for JSON serialization.
 *
 * @param transaction - Database transaction object
 * @returns Transaction data formatted for API response
 * */
export function toTransactionResponse(transaction: Transaction): TransactionResponse {
  return {
    id: transaction._id?.toString() || transaction.id || '',
    userId: transaction.userId,
    vendorName: transaction.vendorName,
    description: transaction.description,
    dateTime: transaction.dateTime,
    amount: transaction.amount,
    paymentType: transaction.paymentType,
    categoryId: transaction.categoryId,
    receiptId: transaction.receiptId,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt
  };
}
