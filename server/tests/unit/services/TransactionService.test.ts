/**
 * TransactionService Unit Tests
 *
 * Tests the business logic layer for transactions with mocked dependencies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionService } from '../../../src/services/TransactionService';
import { TransactionValidationError } from '../../../src/models/Transaction';
import type { Transaction } from '../../../src/models/Transaction';

// Mock the TransactionRepository
vi.mock('../../../src/repositories/TransactionRepository', () => ({
  TransactionRepository: vi.fn().mockImplementation(() => ({
    createTransaction: vi.fn(),
    findTransactionById: vi.fn(),
    findAllTransactions: vi.fn(),
    findByUserId: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    createIndexes: vi.fn(),
  })),
}));

import { TransactionRepository } from '../../../src/repositories/TransactionRepository';

describe('TransactionService', () => {
  let transactionService: TransactionService;
  let mockTransactionRepository: any;

  beforeEach(() => {
    transactionService = new TransactionService();
    mockTransactionRepository = (transactionService as any).transactionRepository;
    vi.clearAllMocks();
  });

  describe('createTransaction', () => {
    const validTransactionData = {
      userId: 'user-123',
      vendorName: 'Whole Foods',
      description: 'Weekly groceries',
      dateTime: '2025-01-25T14:30:00Z',
      amount: 125.50,
      paymentType: 'credit',
      categoryId: 'cat-123',
    };

    const mockCreatedTransaction: Transaction = {
      id: 'tx-123',
      userId: 'user-123',
      vendorName: 'Whole Foods',
      description: 'Weekly groceries',
      dateTime: new Date('2025-01-25T14:30:00Z'),
      amount: 125.50,
      paymentType: 'credit',
      categoryId: 'cat-123',
    };

    it('should create a transaction successfully with valid data', async () => {
      // Arrange
      mockTransactionRepository.createTransaction.mockResolvedValue(mockCreatedTransaction);

      // Act
      const result = await transactionService.createTransaction(validTransactionData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('tx-123');
      expect(result.vendorName).toBe('Whole Foods');
      expect(result.amount).toBe(125.50);
      expect(mockTransactionRepository.createTransaction).toHaveBeenCalledWith(validTransactionData);
    });

    it('should throw TransactionValidationError for missing required fields', async () => {
      // Arrange
      const incompleteData = { userId: 'user-123' };

      // Act & Assert
      await expect(
        transactionService.createTransaction(incompleteData)
      ).rejects.toThrow(TransactionValidationError);
    });

    it('should throw TransactionValidationError for invalid amount (negative)', async () => {
      // Arrange
      const invalidData = { ...validTransactionData, amount: -100 };

      // Act & Assert
      await expect(
        transactionService.createTransaction(invalidData)
      ).rejects.toThrow(TransactionValidationError);
    });

    it('should accept any string paymentType since schema does not validate enum', async () => {
      // Arrange
      const dataWithCustomPaymentType = { ...validTransactionData, paymentType: 'cryptocurrency' };
      mockTransactionRepository.createTransaction.mockResolvedValue({
        ...mockCreatedTransaction,
        paymentType: 'cryptocurrency',
      });

      // Act
      const result = await transactionService.createTransaction(dataWithCustomPaymentType);

      // Assert
      expect(result).toBeDefined();
      expect(result.paymentType).toBe('cryptocurrency');
    });
  });

  describe('getTransactionById', () => {
    const mockTransaction: Transaction = {
      id: 'tx-123',
      userId: 'user-123',
      vendorName: 'Whole Foods',
      description: 'Weekly groceries',
      dateTime: new Date('2025-01-25T14:30:00Z'),
      amount: 125.50,
      paymentType: 'credit',
      categoryId: 'cat-123',
    };

    it('should return transaction if found', async () => {
      // Arrange
      mockTransactionRepository.findTransactionById.mockResolvedValue(mockTransaction);

      // Act
      const result = await transactionService.getTransactionById('tx-123');

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe('tx-123');
      expect(mockTransactionRepository.findTransactionById).toHaveBeenCalledWith('tx-123');
    });

    it('should return null if transaction not found', async () => {
      // Arrange
      mockTransactionRepository.findTransactionById.mockResolvedValue(null);

      // Act
      const result = await transactionService.getTransactionById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw TransactionValidationError for invalid ID format', async () => {
      // Act & Assert
      await expect(transactionService.getTransactionById('')).rejects.toThrow(TransactionValidationError);
      expect(mockTransactionRepository.findTransactionById).not.toHaveBeenCalled();
    });
  });

  describe('getAllTransactions', () => {
    it('should return all transactions', async () => {
      // Arrange
      const mockTransactions: Transaction[] = [
        {
          id: 'tx-1',
          userId: 'user-123',
          vendorName: 'Store A',
          description: 'Purchase',
          dateTime: new Date(),
          amount: 50.00,
          paymentType: 'credit',
          categoryId: 'cat-123',
        },
        {
          id: 'tx-2',
          userId: 'user-456',
          vendorName: 'Store B',
          description: 'Purchase',
          dateTime: new Date(),
          amount: 75.00,
          paymentType: 'debit',
          categoryId: 'cat-456',
        },
      ];

      mockTransactionRepository.findAllTransactions.mockResolvedValue(mockTransactions);

      // Act
      const result = await transactionService.getAllTransactions();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('tx-1');
      expect(result[1].id).toBe('tx-2');
    });

    it('should return empty array if no transactions exist', async () => {
      // Arrange
      mockTransactionRepository.findAllTransactions.mockResolvedValue([]);

      // Act
      const result = await transactionService.getAllTransactions();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('updateTransaction', () => {
    const existingTransaction: Transaction = {
      id: 'tx-123',
      userId: 'user-123',
      vendorName: 'Whole Foods',
      description: 'Weekly groceries',
      dateTime: new Date('2025-01-25T14:30:00Z'),
      amount: 125.50,
      paymentType: 'credit',
      categoryId: 'cat-123',
    };

    it('should update a transaction with valid data', async () => {
      // Arrange
      const updateData = { amount: 150.00 };
      const updatedTransaction: Transaction = { ...existingTransaction, amount: 150.00 };

      mockTransactionRepository.findTransactionById.mockResolvedValue(existingTransaction);
      mockTransactionRepository.updateTransaction.mockResolvedValue(updatedTransaction);

      // Act
      const result = await transactionService.updateTransaction('tx-123', updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result?.amount).toBe(150.00);
      expect(mockTransactionRepository.updateTransaction).toHaveBeenCalledWith('tx-123', updateData);
    });

    it('should return null if transaction not found', async () => {
      // Arrange
      mockTransactionRepository.findTransactionById.mockResolvedValue(null);

      // Act
      const result = await transactionService.updateTransaction('non-existent-id', { amount: 150.00 });

      // Assert
      expect(result).toBeNull();
      expect(mockTransactionRepository.updateTransaction).not.toHaveBeenCalled();
    });

    it('should throw TransactionValidationError for invalid ID', async () => {
      // Act & Assert
      await expect(
        transactionService.updateTransaction('', { amount: 150.00 })
      ).rejects.toThrow(TransactionValidationError);
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction successfully', async () => {
      // Arrange
      mockTransactionRepository.deleteTransaction.mockResolvedValue(true);

      // Act
      const result = await transactionService.deleteTransaction('tx-123');

      // Assert
      expect(result).toBe(true);
      expect(mockTransactionRepository.deleteTransaction).toHaveBeenCalledWith('tx-123');
    });

    it('should return false if transaction not found', async () => {
      // Arrange
      mockTransactionRepository.deleteTransaction.mockResolvedValue(false);

      // Act
      const result = await transactionService.deleteTransaction('non-existent-id');

      // Assert
      expect(result).toBe(false);
    });

    it('should throw TransactionValidationError for invalid ID', async () => {
      // Act & Assert
      await expect(transactionService.deleteTransaction('')).rejects.toThrow(TransactionValidationError);
      expect(mockTransactionRepository.deleteTransaction).not.toHaveBeenCalled();
    });
  });
});
