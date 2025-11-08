/**
 * BudgetService Unit Tests
 *
 * Tests the business logic layer for budgets with mocked dependencies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BudgetService } from '../../../src/services/BudgetService';
import { BudgetValidationError } from '../../../src/models/Budget';
import type { Budget } from '../../../src/models/Budget';

// Mock the BudgetRepository
vi.mock('../../../src/repositories/BudgetRepository', () => ({
  BudgetRepository: vi.fn().mockImplementation(() => ({
    createBudget: vi.fn(),
    findBudgetById: vi.fn(),
    findAllBudgets: vi.fn(),
    findByUserId: vi.fn(),
    findByUserMonthYear: vi.fn(),
    updateBudget: vi.fn(),
    deleteBudget: vi.fn(),
    createIndexes: vi.fn(),
  })),
}));

import { BudgetRepository } from '../../../src/repositories/BudgetRepository';

describe('BudgetService', () => {
  let budgetService: BudgetService;
  let mockBudgetRepository: any;

  beforeEach(() => {
    budgetService = new BudgetService();
    mockBudgetRepository = (budgetService as any).budgetRepository;
    vi.clearAllMocks();
  });

  describe('createBudget', () => {
    const validBudgetData = {
      userId: 'user-123',
      month: 'January',
      year: 2025,
      amount: 5000,
      remaining: 5000,
      categoryId: 'cat-123',
    };

    const mockCreatedBudget: Budget = {
      id: 'budget-123',
      userId: 'user-123',
      month: 'January',
      year: 2025,
      amount: 5000,
      remaining: 5000,
      categoryId: 'cat-123',
    };

    it('should create a budget successfully with valid data', async () => {
      // Arrange
      mockBudgetRepository.findByUserMonthYear.mockResolvedValue(null);
      mockBudgetRepository.createBudget.mockResolvedValue(mockCreatedBudget);

      // Act
      const result = await budgetService.createBudget(validBudgetData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('budget-123');
      expect(result.month).toBe('January');
      expect(result.amount).toBe(5000);
      expect(mockBudgetRepository.findByUserMonthYear).toHaveBeenCalledWith(
        'user-123',
        'January',
        2025,
        'cat-123'
      );
      expect(mockBudgetRepository.createBudget).toHaveBeenCalledWith(validBudgetData);
    });

    it('should throw BudgetValidationError if budget already exists for user/month/year', async () => {
      // Arrange
      mockBudgetRepository.findByUserMonthYear.mockResolvedValue(mockCreatedBudget);

      // Act & Assert
      await expect(
        budgetService.createBudget(validBudgetData)
      ).rejects.toThrow(BudgetValidationError);

      expect(mockBudgetRepository.createBudget).not.toHaveBeenCalled();
    });

    it('should throw BudgetValidationError for missing required fields', async () => {
      // Arrange
      const incompleteData = { userId: 'user-123' }; // Missing other fields

      // Act & Assert
      await expect(
        budgetService.createBudget(incompleteData)
      ).rejects.toThrow(BudgetValidationError);
    });

    it('should throw BudgetValidationError for invalid amount (negative)', async () => {
      // Arrange
      const invalidData = { ...validBudgetData, amount: -100 };

      // Act & Assert
      await expect(
        budgetService.createBudget(invalidData)
      ).rejects.toThrow(BudgetValidationError);
    });

    it('should accept any positive integer year since schema only validates positive', async () => {
      // Arrange
      const dataWithOldYear = { ...validBudgetData, year: 1900 };
      mockBudgetRepository.findByUserMonthYear.mockResolvedValue(null);
      mockBudgetRepository.createBudget.mockResolvedValue({
        ...mockCreatedBudget,
        year: 1900,
      });

      // Act
      const result = await budgetService.createBudget(dataWithOldYear);

      // Assert
      expect(result).toBeDefined();
      expect(result.year).toBe(1900);
    });
  });

  describe('getBudgetById', () => {
    const mockBudget: Budget = {
      id: 'budget-123',
      userId: 'user-123',
      month: 'January',
      year: 2025,
      amount: 5000,
      remaining: 5000,
      categoryId: 'cat-123',
    };

    it('should return budget if found', async () => {
      // Arrange
      mockBudgetRepository.findBudgetById.mockResolvedValue(mockBudget);

      // Act
      const result = await budgetService.getBudgetById('budget-123');

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe('budget-123');
      expect(mockBudgetRepository.findBudgetById).toHaveBeenCalledWith('budget-123');
    });

    it('should return null if budget not found', async () => {
      // Arrange
      mockBudgetRepository.findBudgetById.mockResolvedValue(null);

      // Act
      const result = await budgetService.getBudgetById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw BudgetValidationError for invalid ID format', async () => {
      // Act & Assert
      await expect(budgetService.getBudgetById('')).rejects.toThrow(BudgetValidationError);
      expect(mockBudgetRepository.findBudgetById).not.toHaveBeenCalled();
    });
  });

  describe('getAllBudgets', () => {
    it('should return all budgets', async () => {
      // Arrange
      const mockBudgets: Budget[] = [
        {
          id: 'budget-1',
          userId: 'user-123',
          month: 'January',
          year: 2025,
          amount: 5000,
          remaining: 5000,
          categoryId: 'cat-123',
        },
        {
          id: 'budget-2',
          userId: 'user-456',
          month: 'February',
          year: 2025,
          amount: 3000,
          remaining: 3000,
          categoryId: 'cat-456',
        },
      ];

      mockBudgetRepository.findAllBudgets.mockResolvedValue(mockBudgets);

      // Act
      const result = await budgetService.getAllBudgets();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('budget-1');
      expect(result[1].id).toBe('budget-2');
    });

    it('should return empty array if no budgets exist', async () => {
      // Arrange
      mockBudgetRepository.findAllBudgets.mockResolvedValue([]);

      // Act
      const result = await budgetService.getAllBudgets();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getBudgetsByUserId', () => {
    it('should return all budgets for a user', async () => {
      // Arrange
      const mockBudgets: Budget[] = [
        {
          id: 'budget-1',
          userId: 'user-123',
          month: 'January',
          year: 2025,
          amount: 5000,
          remaining: 5000,
          categoryId: 'cat-123',
        },
        {
          id: 'budget-2',
          userId: 'user-123',
          month: 'February',
          year: 2025,
          amount: 3000,
          remaining: 3000,
          categoryId: 'cat-456',
        },
      ];

      mockBudgetRepository.findByUserId.mockResolvedValue(mockBudgets);

      // Act
      const result = await budgetService.getBudgetsByUserId('user-123');

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user-123');
      expect(result[1].userId).toBe('user-123');
      expect(mockBudgetRepository.findByUserId).toHaveBeenCalledWith('user-123');
    });

    it('should return empty array if user has no budgets', async () => {
      // Arrange
      mockBudgetRepository.findByUserId.mockResolvedValue([]);

      // Act
      const result = await budgetService.getBudgetsByUserId('user-123');

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw BudgetValidationError for invalid user ID', async () => {
      // Act & Assert
      await expect(budgetService.getBudgetsByUserId('')).rejects.toThrow(BudgetValidationError);
      expect(mockBudgetRepository.findByUserId).not.toHaveBeenCalled();
    });
  });

  describe('updateBudget', () => {
    const existingBudget: Budget = {
      id: 'budget-123',
      userId: 'user-123',
      month: 'January',
      year: 2025,
      amount: 5000,
      remaining: 5000,
      categoryId: 'cat-123',
    };

    it('should update a budget with valid data', async () => {
      // Arrange
      const updateData = { amount: 6000 };
      const updatedBudget: Budget = { ...existingBudget, amount: 6000 };

      mockBudgetRepository.findBudgetById.mockResolvedValue(existingBudget);
      mockBudgetRepository.updateBudget.mockResolvedValue(updatedBudget);

      // Act
      const result = await budgetService.updateBudget('budget-123', updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result?.amount).toBe(6000);
      expect(mockBudgetRepository.updateBudget).toHaveBeenCalledWith('budget-123', updateData);
    });

    it('should return null if budget not found', async () => {
      // Arrange
      mockBudgetRepository.findBudgetById.mockResolvedValue(null);

      // Act
      const result = await budgetService.updateBudget('non-existent-id', { amount: 6000 });

      // Assert
      expect(result).toBeNull();
      expect(mockBudgetRepository.updateBudget).not.toHaveBeenCalled();
    });

    it('should throw BudgetValidationError for invalid ID', async () => {
      // Act & Assert
      await expect(
        budgetService.updateBudget('', { amount: 6000 })
      ).rejects.toThrow(BudgetValidationError);
    });

    it('should throw BudgetValidationError for invalid update data', async () => {
      // Arrange
      mockBudgetRepository.findBudgetById.mockResolvedValue(existingBudget);

      // Act & Assert
      await expect(
        budgetService.updateBudget('budget-123', { amount: -100 })
      ).rejects.toThrow(BudgetValidationError);
    });
  });

  describe('deleteBudget', () => {
    it('should delete budget successfully', async () => {
      // Arrange
      mockBudgetRepository.deleteBudget.mockResolvedValue(true);

      // Act
      const result = await budgetService.deleteBudget('budget-123');

      // Assert
      expect(result).toBe(true);
      expect(mockBudgetRepository.deleteBudget).toHaveBeenCalledWith('budget-123');
    });

    it('should return false if budget not found', async () => {
      // Arrange
      mockBudgetRepository.deleteBudget.mockResolvedValue(false);

      // Act
      const result = await budgetService.deleteBudget('non-existent-id');

      // Assert
      expect(result).toBe(false);
    });

    it('should throw BudgetValidationError for invalid ID', async () => {
      // Act & Assert
      await expect(budgetService.deleteBudget('')).rejects.toThrow(BudgetValidationError);
      expect(mockBudgetRepository.deleteBudget).not.toHaveBeenCalled();
    });
  });

  describe('initializeIndexes', () => {
    it('should call repository createIndexes', async () => {
      // Arrange
      mockBudgetRepository.createIndexes.mockResolvedValue(undefined);

      // Act
      await budgetService.initializeIndexes();

      // Assert
      expect(mockBudgetRepository.createIndexes).toHaveBeenCalled();
    });
  });
});
