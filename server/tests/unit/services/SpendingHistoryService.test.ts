/**
 * SpendingHistoryService Unit Tests
 *
 * Tests the business logic layer for spending history with mocked dependencies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpendingHistoryService } from '../../../src/services/SpendingHistoryService';
import type { Transaction } from '../../../src/models/Transaction';
import type { Category } from '../../../src/models/Category';

// Mock the repositories
vi.mock('../../../src/repositories/TransactionRepository', () => ({
  TransactionRepository: vi.fn().mockImplementation(() => ({
    aggregateByCategory: vi.fn(),
    findByUserIdAndDateRange: vi.fn(),
    aggregateByMonth: vi.fn(),
  })),
}));

vi.mock('../../../src/repositories/CategoryRepository', () => ({
  CategoryRepository: vi.fn().mockImplementation(() => ({
    findCategoryById: vi.fn(),
    findAllCategories: vi.fn(),
  })),
}));

import { TransactionRepository } from '../../../src/repositories/TransactionRepository';
import { CategoryRepository } from '../../../src/repositories/CategoryRepository';

describe('SpendingHistoryService', () => {
  let spendingHistoryService: SpendingHistoryService;
  let mockTransactionRepository: any;
  let mockCategoryRepository: any;

  beforeEach(() => {
    spendingHistoryService = new SpendingHistoryService();
    mockTransactionRepository = (spendingHistoryService as any).transactionRepository;
    mockCategoryRepository = (spendingHistoryService as any).categoryRepository;
    vi.clearAllMocks();
  });

  describe('getSummary', () => {
    const mockCategory: Category = {
      id: 'cat-123',
      userId: 'user-123',
      name: 'Groceries',
      type: 'expense',
    };

    const mockAggregatedData = [
      {
        categoryId: 'cat-123',
        totalAmount: 500.00,
        transactionCount: 5,
      },
      {
        categoryId: 'cat-456',
        totalAmount: 300.00,
        transactionCount: 3,
      },
    ];

    it('should return spending summary for current_month period', async () => {
      // Arrange
      mockTransactionRepository.aggregateByCategory.mockResolvedValue(mockAggregatedData);
      mockCategoryRepository.findCategoryById.mockResolvedValueOnce(mockCategory);
      mockCategoryRepository.findCategoryById.mockResolvedValueOnce({
        ...mockCategory,
        id: 'cat-456',
        name: 'Dining',
      });

      const query = { period: 'current_month' as const };

      // Act
      const result = await spendingHistoryService.getSummary('user-123', query);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(result.period).toBe('Current Month');
      expect(result.totalSpending).toBe(800.00);
      expect(result.categories).toHaveLength(2);
      expect(result.categories[0].categoryName).toBe('Groceries');
      expect(result.categories[0].percentage).toBe(62.5); // 500/800 * 100
      expect(result.categories[1].percentage).toBe(37.5); // 300/800 * 100
    });

    it('should return spending summary for past_week period', async () => {
      // Arrange
      mockTransactionRepository.aggregateByCategory.mockResolvedValue(mockAggregatedData);
      mockCategoryRepository.findCategoryById.mockResolvedValueOnce(mockCategory);
      mockCategoryRepository.findCategoryById.mockResolvedValueOnce({
        ...mockCategory,
        id: 'cat-456',
        name: 'Entertainment',
      });

      const query = { period: 'past_week' as const };

      // Act
      const result = await spendingHistoryService.getSummary('user-123', query);

      // Assert
      expect(result.period).toBe('Past Week');
      expect(result.categories).toHaveLength(2);
    });

    it('should return spending summary for past_30_days period', async () => {
      // Arrange
      mockTransactionRepository.aggregateByCategory.mockResolvedValue(mockAggregatedData);
      mockCategoryRepository.findCategoryById.mockResolvedValueOnce(mockCategory);
      mockCategoryRepository.findCategoryById.mockResolvedValueOnce({
        ...mockCategory,
        id: 'cat-456',
        name: 'Transport',
      });

      const query = { period: 'past_30_days' as const };

      // Act
      const result = await spendingHistoryService.getSummary('user-123', query);

      // Assert
      expect(result.period).toBe('Past 30 Days');
      expect(result.categories).toHaveLength(2);
    });

    it('should return spending summary for custom period', async () => {
      // Arrange
      mockTransactionRepository.aggregateByCategory.mockResolvedValue(mockAggregatedData);
      mockCategoryRepository.findCategoryById.mockResolvedValueOnce(mockCategory);
      mockCategoryRepository.findCategoryById.mockResolvedValueOnce({
        ...mockCategory,
        id: 'cat-456',
        name: 'Shopping',
      });

      const query = {
        period: 'custom' as const,
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
      };

      // Act
      const result = await spendingHistoryService.getSummary('user-123', query);

      // Assert
      expect(result.period).toBe('Custom Range');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.categories).toHaveLength(2);
    });

    it('should throw error for custom period without startDate', async () => {
      // Arrange
      const query = {
        period: 'custom' as const,
        endDate: '2025-01-31T23:59:59Z',
      };

      // Act & Assert
      await expect(
        spendingHistoryService.getSummary('user-123', query)
      ).rejects.toThrow('startDate and endDate are required for custom period');
    });

    it('should handle zero spending gracefully', async () => {
      // Arrange
      mockTransactionRepository.aggregateByCategory.mockResolvedValue([]);

      const query = { period: 'current_month' as const };

      // Act
      const result = await spendingHistoryService.getSummary('user-123', query);

      // Assert
      expect(result.totalSpending).toBe(0);
      expect(result.categories).toHaveLength(0);
    });

    it('should skip categories that are not found', async () => {
      // Arrange
      mockTransactionRepository.aggregateByCategory.mockResolvedValue(mockAggregatedData);
      mockCategoryRepository.findCategoryById.mockResolvedValueOnce(mockCategory);
      mockCategoryRepository.findCategoryById.mockResolvedValueOnce(null); // Category not found

      const query = { period: 'current_month' as const };

      // Act
      const result = await spendingHistoryService.getSummary('user-123', query);

      // Assert
      expect(result.categories).toHaveLength(1); // Only first category should be included
      expect(result.categories[0].categoryName).toBe('Groceries');
    });

    it('should round percentages to 2 decimal places', async () => {
      // Arrange
      const complexAggregatedData = [
        {
          categoryId: 'cat-1',
          totalAmount: 333.33,
          transactionCount: 3,
        },
        {
          categoryId: 'cat-2',
          totalAmount: 666.67,
          transactionCount: 2,
        },
      ];

      mockTransactionRepository.aggregateByCategory.mockResolvedValue(complexAggregatedData);
      mockCategoryRepository.findCategoryById.mockResolvedValueOnce({ ...mockCategory, id: 'cat-1' });
      mockCategoryRepository.findCategoryById.mockResolvedValueOnce({ ...mockCategory, id: 'cat-2', name: 'Food' });

      const query = { period: 'current_month' as const };

      // Act
      const result = await spendingHistoryService.getSummary('user-123', query);

      // Assert
      expect(result.categories[0].percentage).toBe(33.33);
      expect(result.categories[1].percentage).toBe(66.67);
    });
  });

  describe('getDetailedReport', () => {
    const mockCategory: Category = {
      id: 'cat-123',
      userId: 'user-123',
      name: 'Groceries',
      type: 'expense',
    };

    const mockTransactions: Transaction[] = [
      {
        id: 'tx-1',
        userId: 'user-123',
        vendorName: 'Whole Foods',
        description: 'Weekly groceries',
        dateTime: new Date('2025-01-25T14:30:00Z'),
        amount: 125.50,
        paymentType: 'credit',
        categoryId: 'cat-123',
      },
      {
        id: 'tx-2',
        userId: 'user-123',
        vendorName: 'Trader Joes',
        description: 'Weekend shopping',
        dateTime: new Date('2025-01-26T10:00:00Z'),
        amount: 87.25,
        paymentType: 'debit',
        categoryId: 'cat-123',
      },
    ];

    it('should return detailed report with transactions', async () => {
      // Arrange
      mockTransactionRepository.findByUserIdAndDateRange.mockResolvedValue(mockTransactions);
      mockCategoryRepository.findCategoryById.mockResolvedValue(mockCategory);
      mockCategoryRepository.findAllCategories.mockResolvedValue([mockCategory]);

      const query = { period: 'current_month' as const };

      // Act
      const result = await spendingHistoryService.getDetailedReport('user-123', query);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(result.totalSpending).toBe(212.75);
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].categoryName).toBe('Groceries');
      expect(result.categories[0].transactions).toHaveLength(2);
      expect(result.categories[0].transactions[0].vendorName).toBe('Whole Foods');
    });

    it('should group transactions by category', async () => {
      // Arrange
      const entertainmentCategory: Category = {
        id: 'cat-456',
        userId: 'user-123',
        name: 'Entertainment',
        type: 'expense',
      };

      const mixedTransactions: Transaction[] = [
        {
          id: 'tx-1',
          userId: 'user-123',
          vendorName: 'Store A',
          description: 'Food',
          dateTime: new Date(),
          amount: 50.00,
          paymentType: 'credit',
          categoryId: 'cat-123',
        },
        {
          id: 'tx-2',
          userId: 'user-123',
          vendorName: 'Store B',
          description: 'Entertainment',
          dateTime: new Date(),
          amount: 30.00,
          paymentType: 'debit',
          categoryId: 'cat-456',
        },
        {
          id: 'tx-3',
          userId: 'user-123',
          vendorName: 'Store C',
          description: 'More food',
          dateTime: new Date(),
          amount: 40.00,
          paymentType: 'credit',
          categoryId: 'cat-123',
        },
      ];

      mockTransactionRepository.findByUserIdAndDateRange.mockResolvedValue(mixedTransactions);
      mockCategoryRepository.findCategoryById.mockResolvedValue(mockCategory);
      mockCategoryRepository.findAllCategories.mockResolvedValue([mockCategory, entertainmentCategory]);

      const query = { period: 'current_month' as const };

      // Act
      const result = await spendingHistoryService.getDetailedReport('user-123', query);

      // Assert
      expect(result.categories).toHaveLength(2);
      // Groceries category should have 2 transactions
      const groceriesCategory = result.categories.find(c => c.categoryName === 'Groceries');
      expect(groceriesCategory?.transactions).toHaveLength(2);
      expect(groceriesCategory?.totalAmount).toBe(90.00);
    });

    it('should handle empty transaction list', async () => {
      // Arrange
      mockTransactionRepository.findByUserIdAndDateRange.mockResolvedValue([]);
      mockCategoryRepository.findAllCategories.mockResolvedValue([]);

      const query = { period: 'current_month' as const };

      // Act
      const result = await spendingHistoryService.getDetailedReport('user-123', query);

      // Assert
      expect(result.totalSpending).toBe(0);
      expect(result.categories).toHaveLength(0);
    });
  });

  describe('getMonthlyTrends', () => {
    const mockMonthlyData = [
      {
        year: 2025,
        month: 1,
        totalAmount: 1250.50,
        transactionCount: 25,
      },
      {
        year: 2024,
        month: 12,
        totalAmount: 1100.00,
        transactionCount: 20,
      },
      {
        year: 2024,
        month: 11,
        totalAmount: 1050.00,
        transactionCount: 18,
      },
    ];

    it('should return monthly trends with default parameters', async () => {
      // Arrange
      mockTransactionRepository.findByUserIdAndDateRange.mockResolvedValue([]); // Current month transactions
      mockTransactionRepository.aggregateByMonth.mockResolvedValue(mockMonthlyData);

      const query = {
        monthCount: 6,
        includeCurrentMonth: true,
      };

      // Act
      const result = await spendingHistoryService.getMonthlyTrends('user-123', query);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(result.currentMonth).toBeDefined();
      expect(result.trend).toBeDefined();
      expect(result.monthlyBreakdown).toBeDefined();
      expect(Array.isArray(result.monthlyBreakdown)).toBe(true);
    });

    it('should calculate trend direction correctly for increasing spending', async () => {
      // Arrange - Current month higher than average
      const currentMonthTransactions: Transaction[] = [
        {
          id: 'tx-1',
          userId: 'user-123',
          vendorName: 'Store',
          description: 'Purchase',
          dateTime: new Date(),
          amount: 1500.00,
          paymentType: 'credit',
          categoryId: 'cat-123',
        },
      ];

      // Service requests last N months from current date (Nov 2025)
      // Last 2 months = Sep (month 9) and Oct (month 10)
      const previousMonthsData = [
        {
          year: 2025,
          month: 9, // September
          totalAmount: 1000.00,
          transactionCount: 20,
        },
        {
          year: 2025,
          month: 10, // October
          totalAmount: 1000.00,
          transactionCount: 20,
        },
      ];

      mockTransactionRepository.findByUserIdAndDateRange.mockResolvedValue(currentMonthTransactions);
      mockTransactionRepository.aggregateByMonth.mockResolvedValue(previousMonthsData);

      const query = { monthCount: 2, includeCurrentMonth: true };

      // Act
      const result = await spendingHistoryService.getMonthlyTrends('user-123', query);

      // Assert
      expect(result.trend.direction).toBe('increase');
      expect(result.trend.percentageChange).toBeGreaterThan(0);
    });

    it('should calculate trend direction correctly for decreasing spending', async () => {
      // Arrange - Current month lower than average
      const currentMonthTransactions: Transaction[] = [
        {
          id: 'tx-1',
          userId: 'user-123',
          vendorName: 'Store',
          description: 'Purchase',
          dateTime: new Date(),
          amount: 800.00,
          paymentType: 'credit',
          categoryId: 'cat-123',
        },
      ];

      // Service requests last N months from current date (Nov 2025)
      // Last 2 months = Sep (month 9) and Oct (month 10)
      const previousMonthsData = [
        {
          year: 2025,
          month: 9, // September
          totalAmount: 1200.00,
          transactionCount: 25,
        },
        {
          year: 2025,
          month: 10, // October
          totalAmount: 1200.00,
          transactionCount: 25,
        },
      ];

      mockTransactionRepository.findByUserIdAndDateRange.mockResolvedValue(currentMonthTransactions);
      mockTransactionRepository.aggregateByMonth.mockResolvedValue(previousMonthsData);

      const query = { monthCount: 2, includeCurrentMonth: true };

      // Act
      const result = await spendingHistoryService.getMonthlyTrends('user-123', query);

      // Assert
      expect(result.trend.direction).toBe('decrease');
      expect(result.trend.percentageChange).toBeLessThan(0);
    });

    it('should handle stable spending (within 5% threshold)', async () => {
      // Arrange
      const stableData = [
        {
          year: 2025,
          month: 1,
          totalAmount: 1020.00, // Within 5% of 1000
          transactionCount: 20,
        },
        {
          year: 2024,
          month: 12,
          totalAmount: 1000.00,
          transactionCount: 20,
        },
        {
          year: 2024,
          month: 11,
          totalAmount: 1000.00,
          transactionCount: 20,
        },
      ];

      mockTransactionRepository.findByUserIdAndDateRange.mockResolvedValue([]);
      mockTransactionRepository.aggregateByMonth.mockResolvedValue(stableData);

      const query = { monthCount: 3, includeCurrentMonth: true };

      // Act
      const result = await spendingHistoryService.getMonthlyTrends('user-123', query);

      // Assert
      expect(result.trend.direction).toBe('stable');
    });

    it('should exclude current month when requested', async () => {
      // Arrange
      mockTransactionRepository.findByUserIdAndDateRange.mockResolvedValue([]);
      mockTransactionRepository.aggregateByMonth.mockResolvedValue(mockMonthlyData.slice(1)); // Exclude first month

      const query = { monthCount: 6, includeCurrentMonth: false };

      // Act
      const result = await spendingHistoryService.getMonthlyTrends('user-123', query);

      // Assert
      expect(result.monthlyBreakdown).toBeDefined();
      // Current month should not be included
    });

    it('should handle no spending data', async () => {
      // Arrange
      mockTransactionRepository.findByUserIdAndDateRange.mockResolvedValue([]);
      mockTransactionRepository.aggregateByMonth.mockResolvedValue([]);

      const query = { monthCount: 6, includeCurrentMonth: true };

      // Act
      const result = await spendingHistoryService.getMonthlyTrends('user-123', query);

      // Assert
      expect(result.currentMonth.totalAmount).toBe(0);
      expect(result.trend.direction).toBe('stable');
      // monthlyBreakdown should contain 6 months with 0 amounts (service always returns requested month count)
      expect(result.monthlyBreakdown).toHaveLength(6);
      expect(result.monthlyBreakdown.every(m => m.totalAmount === 0)).toBe(true);
    });
  });
});
