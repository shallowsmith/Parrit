/**
 * ReceiptService Unit Tests
 *
 * Tests the business logic layer for receipts with mocked dependencies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReceiptService } from '../../../src/services/ReceiptService';
import { ReceiptValidationError } from '../../../src/models/Receipt';
import type { Receipt } from '../../../src/models/Receipt';

// Mock the ReceiptRepository
vi.mock('../../../src/repositories/ReceiptRepository', () => ({
  ReceiptRepository: vi.fn().mockImplementation(() => ({
    createReceipt: vi.fn(),
    findReceiptById: vi.fn(),
    findAllReceipts: vi.fn(),
    findByUserId: vi.fn(),
    updateReceipt: vi.fn(),
    deleteReceipt: vi.fn(),
    createIndexes: vi.fn(),
  })),
}));

import { ReceiptRepository } from '../../../src/repositories/ReceiptRepository';

describe('ReceiptService', () => {
  let receiptService: ReceiptService;
  let mockReceiptRepository: any;

  beforeEach(() => {
    receiptService = new ReceiptService();
    mockReceiptRepository = (receiptService as any).receiptRepository;
    vi.clearAllMocks();
  });

  describe('createReceipt', () => {
    const validReceiptData = {
      userId: 'user-123',
      merchantName: 'Target',
      date: new Date('2025-01-26T10:00:00Z'),
      amount: 75.25,
      categoryId: 'cat-123',
      imageUrl: 'https://example.com/receipt.jpg',
      notes: 'Home supplies',
    };

    const mockCreatedReceipt: Receipt = {
      id: 'receipt-123',
      ...validReceiptData,
    };

    it('should create a receipt successfully with valid data', async () => {
      // Arrange
      mockReceiptRepository.createReceipt.mockResolvedValue(mockCreatedReceipt);

      // Act
      const result = await receiptService.createReceipt(validReceiptData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('receipt-123');
      expect(result.merchantName).toBe('Target');
      expect(result.amount).toBe(75.25);
      expect(result.imageUrl).toBe('https://example.com/receipt.jpg');
      expect(mockReceiptRepository.createReceipt).toHaveBeenCalledWith(validReceiptData);
    });

    it('should throw ReceiptValidationError for missing required fields', async () => {
      // Arrange
      const incompleteData = { userId: 'user-123' };

      // Act & Assert
      await expect(
        receiptService.createReceipt(incompleteData)
      ).rejects.toThrow(ReceiptValidationError);
    });

    it('should throw ReceiptValidationError for invalid amount (negative)', async () => {
      // Arrange
      const invalidData = { ...validReceiptData, amount: -100 };

      // Act & Assert
      await expect(
        receiptService.createReceipt(invalidData)
      ).rejects.toThrow(ReceiptValidationError);
    });

    it('should throw ReceiptValidationError for invalid URL format', async () => {
      // Arrange
      const invalidData = { ...validReceiptData, imageUrl: 'not-a-url' };

      // Act & Assert
      await expect(
        receiptService.createReceipt(invalidData)
      ).rejects.toThrow(ReceiptValidationError);
    });
  });

  describe('getReceiptById', () => {
    const mockReceipt: Receipt = {
      id: 'receipt-123',
      userId: 'user-123',
      merchantName: 'Target',
      date: new Date('2025-01-26T10:00:00Z'),
      amount: 75.25,
      categoryId: 'cat-123',
      imageUrl: 'https://example.com/receipt.jpg',
      notes: 'Home supplies',
    };

    it('should return receipt if found', async () => {
      // Arrange
      mockReceiptRepository.findReceiptById.mockResolvedValue(mockReceipt);

      // Act
      const result = await receiptService.getReceiptById('receipt-123');

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe('receipt-123');
      expect(mockReceiptRepository.findReceiptById).toHaveBeenCalledWith('receipt-123');
    });

    it('should return null if receipt not found', async () => {
      // Arrange
      mockReceiptRepository.findReceiptById.mockResolvedValue(null);

      // Act
      const result = await receiptService.getReceiptById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw ReceiptValidationError for invalid ID format', async () => {
      // Act & Assert
      await expect(receiptService.getReceiptById('')).rejects.toThrow(ReceiptValidationError);
      expect(mockReceiptRepository.findReceiptById).not.toHaveBeenCalled();
    });
  });

  describe('getAllReceipts', () => {
    it('should return all receipts', async () => {
      // Arrange
      const mockReceipts: Receipt[] = [
        {
          id: 'receipt-1',
          userId: 'user-123',
          merchantName: 'Store A',
          date: new Date(),
          amount: 50.00,
          categoryId: 'cat-123',
          imageUrl: 'https://example.com/r1.jpg',
          notes: 'Purchase',
        },
        {
          id: 'receipt-2',
          userId: 'user-456',
          merchantName: 'Store B',
          date: new Date(),
          amount: 75.00,
          categoryId: 'cat-456',
          imageUrl: 'https://example.com/r2.jpg',
          notes: 'Purchase',
        },
      ];

      mockReceiptRepository.findAllReceipts.mockResolvedValue(mockReceipts);

      // Act
      const result = await receiptService.getAllReceipts();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('receipt-1');
      expect(result[1].id).toBe('receipt-2');
    });

    it('should return empty array if no receipts exist', async () => {
      // Arrange
      mockReceiptRepository.findAllReceipts.mockResolvedValue([]);

      // Act
      const result = await receiptService.getAllReceipts();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('updateReceipt', () => {
    const existingReceipt: Receipt = {
      id: 'receipt-123',
      userId: 'user-123',
      merchantName: 'Target',
      date: new Date('2025-01-26T10:00:00Z'),
      amount: 75.25,
      categoryId: 'cat-123',
      imageUrl: 'https://example.com/receipt.jpg',
      notes: 'Home supplies',
    };

    it('should update a receipt with valid data', async () => {
      // Arrange
      const updateData = { amount: 80.00 };
      const updatedReceipt: Receipt = { ...existingReceipt, amount: 80.00 };

      mockReceiptRepository.findReceiptById.mockResolvedValue(existingReceipt);
      mockReceiptRepository.updateReceipt.mockResolvedValue(updatedReceipt);

      // Act
      const result = await receiptService.updateReceipt('receipt-123', updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result?.amount).toBe(80.00);
      expect(mockReceiptRepository.updateReceipt).toHaveBeenCalledWith('receipt-123', updateData);
    });

    it('should return null if receipt not found', async () => {
      // Arrange
      mockReceiptRepository.findReceiptById.mockResolvedValue(null);

      // Act
      const result = await receiptService.updateReceipt('non-existent-id', { amount: 80.00 });

      // Assert
      expect(result).toBeNull();
      expect(mockReceiptRepository.updateReceipt).not.toHaveBeenCalled();
    });

    it('should throw ReceiptValidationError for invalid ID', async () => {
      // Act & Assert
      await expect(
        receiptService.updateReceipt('', { amount: 80.00 })
      ).rejects.toThrow(ReceiptValidationError);
    });
  });

  describe('deleteReceipt', () => {
    it('should delete receipt successfully', async () => {
      // Arrange
      mockReceiptRepository.deleteReceipt.mockResolvedValue(true);

      // Act
      const result = await receiptService.deleteReceipt('receipt-123');

      // Assert
      expect(result).toBe(true);
      expect(mockReceiptRepository.deleteReceipt).toHaveBeenCalledWith('receipt-123');
    });

    it('should return false if receipt not found', async () => {
      // Arrange
      mockReceiptRepository.deleteReceipt.mockResolvedValue(false);

      // Act
      const result = await receiptService.deleteReceipt('non-existent-id');

      // Assert
      expect(result).toBe(false);
    });

    it('should throw ReceiptValidationError for invalid ID', async () => {
      // Act & Assert
      await expect(receiptService.deleteReceipt('')).rejects.toThrow(ReceiptValidationError);
      expect(mockReceiptRepository.deleteReceipt).not.toHaveBeenCalled();
    });
  });
});
