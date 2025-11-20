/**
 * CategoryService Unit Tests
 *
 * Tests the business logic layer for categories with mocked dependencies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategoryService } from '../../../src/services/CategoryService';
import { CategoryValidationError } from '../../../src/models/Category';
import type { Category } from '../../../src/models/Category';

// Mock the CategoryRepository
vi.mock('../../../src/repositories/CategoryRepository', () => ({
  CategoryRepository: vi.fn().mockImplementation(() => ({
    createCategory: vi.fn(),
    findCategoryById: vi.fn(),
    findAllCategories: vi.fn(),
    findByNameAndUserId: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    createIndexes: vi.fn(),
  })),
}));

import { CategoryRepository } from '../../../src/repositories/CategoryRepository';

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let mockCategoryRepository: any;

  beforeEach(() => {
    categoryService = new CategoryService();
    mockCategoryRepository = (categoryService as any).categoryRepository;
    vi.clearAllMocks();
  });

  describe('createCategory', () => {
    const validCategoryData = {
      userId: 'user-123',
      name: 'Groceries',
      type: 'expense',
    };

    const mockCreatedCategory: Category = {
      id: 'cat-123',
      userId: 'user-123',
      name: 'Groceries',
      type: 'expense',
    };

    it('should create a category successfully with valid data', async () => {
      // Arrange
      mockCategoryRepository.findByNameAndUserId.mockResolvedValue(null);
      mockCategoryRepository.createCategory.mockResolvedValue(mockCreatedCategory);

      // Act
      const result = await categoryService.createCategory(validCategoryData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('cat-123');
      expect(result.name).toBe('Groceries');
      expect(result.type).toBe('expense');
      expect(mockCategoryRepository.findByNameAndUserId).toHaveBeenCalledWith(
        'Groceries',
        'user-123'
      );
      expect(mockCategoryRepository.createCategory).toHaveBeenCalledWith(validCategoryData);
    });

    it('should throw CategoryValidationError if category name already exists for user', async () => {
      // Arrange
      mockCategoryRepository.findByNameAndUserId.mockResolvedValue(mockCreatedCategory);

      // Act & Assert
      await expect(
        categoryService.createCategory(validCategoryData)
      ).rejects.toThrow(CategoryValidationError);

      expect(mockCategoryRepository.createCategory).not.toHaveBeenCalled();
    });

    it('should throw CategoryValidationError for missing required fields', async () => {
      // Arrange
      const incompleteData = { userId: 'user-123' }; // Missing name and type

      // Act & Assert
      await expect(
        categoryService.createCategory(incompleteData)
      ).rejects.toThrow(CategoryValidationError);
    });

    it('should accept any string type since schema does not validate enum', async () => {
      // Arrange
      const dataWithCustomType = { ...validCategoryData, type: 'custom-type' };
      mockCategoryRepository.findByNameAndUserId.mockResolvedValue(null);
      mockCategoryRepository.createCategory.mockResolvedValue({
        ...mockCreatedCategory,
        type: 'custom-type',
      });

      // Act
      const result = await categoryService.createCategory(dataWithCustomType);

      // Assert
      expect(result).toBeDefined();
      expect(result.type).toBe('custom-type');
    });

    it('should allow different users to have categories with the same name', async () => {
      // Arrange
      mockCategoryRepository.findByNameAndUserId.mockResolvedValue(null);
      mockCategoryRepository.createCategory.mockResolvedValue({
        ...mockCreatedCategory,
        userId: 'user-456',
      });

      const dataForDifferentUser = { ...validCategoryData, userId: 'user-456' };

      // Act
      const result = await categoryService.createCategory(dataForDifferentUser);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe('user-456');
      expect(mockCategoryRepository.findByNameAndUserId).toHaveBeenCalledWith(
        'Groceries',
        'user-456'
      );
    });
  });

  describe('getCategoryById', () => {
    const mockCategory: Category = {
      id: 'cat-123',
      userId: 'user-123',
      name: 'Groceries',
      type: 'expense',
    };

    it('should return category if found', async () => {
      // Arrange
      mockCategoryRepository.findCategoryById.mockResolvedValue(mockCategory);

      // Act
      const result = await categoryService.getCategoryById('cat-123');

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe('cat-123');
      expect(mockCategoryRepository.findCategoryById).toHaveBeenCalledWith('cat-123');
    });

    it('should return null if category not found', async () => {
      // Arrange
      mockCategoryRepository.findCategoryById.mockResolvedValue(null);

      // Act
      const result = await categoryService.getCategoryById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw CategoryValidationError for invalid ID format', async () => {
      // Act & Assert
      await expect(categoryService.getCategoryById('')).rejects.toThrow(CategoryValidationError);
      expect(mockCategoryRepository.findCategoryById).not.toHaveBeenCalled();
    });
  });

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      // Arrange
      const mockCategories: Category[] = [
        {
          id: 'cat-1',
          userId: 'user-123',
          name: 'Groceries',
          type: 'expense',
        },
        {
          id: 'cat-2',
          userId: 'user-123',
          name: 'Salary',
          type: 'income',
        },
      ];

      mockCategoryRepository.findAllCategories.mockResolvedValue(mockCategories);

      // Act
      const result = await categoryService.getAllCategories();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('cat-1');
      expect(result[0].type).toBe('expense');
      expect(result[1].id).toBe('cat-2');
      expect(result[1].type).toBe('income');
    });

    it('should return empty array if no categories exist', async () => {
      // Arrange
      mockCategoryRepository.findAllCategories.mockResolvedValue([]);

      // Act
      const result = await categoryService.getAllCategories();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('updateCategory', () => {
    const existingCategory: Category = {
      id: 'cat-123',
      userId: 'user-123',
      name: 'Groceries',
      type: 'expense',
    };

    it('should update a category with valid data', async () => {
      // Arrange
      const updateData = { name: 'Food & Groceries' };
      const updatedCategory: Category = { ...existingCategory, name: 'Food & Groceries' };

      mockCategoryRepository.findCategoryById.mockResolvedValue(existingCategory);
      mockCategoryRepository.updateCategory.mockResolvedValue(updatedCategory);

      // Act
      const result = await categoryService.updateCategory('cat-123', updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result?.name).toBe('Food & Groceries');
      expect(mockCategoryRepository.updateCategory).toHaveBeenCalledWith('cat-123', updateData);
    });

    it('should update category type', async () => {
      // Arrange
      const updateData = { type: 'income' };
      const updatedCategory: Category = { ...existingCategory, type: 'income' };

      mockCategoryRepository.findCategoryById.mockResolvedValue(existingCategory);
      mockCategoryRepository.updateCategory.mockResolvedValue(updatedCategory);

      // Act
      const result = await categoryService.updateCategory('cat-123', updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result?.type).toBe('income');
    });

    it('should return null if category not found', async () => {
      // Arrange
      mockCategoryRepository.findCategoryById.mockResolvedValue(null);

      // Act
      const result = await categoryService.updateCategory('non-existent-id', { name: 'New Name' });

      // Assert
      expect(result).toBeNull();
      expect(mockCategoryRepository.updateCategory).not.toHaveBeenCalled();
    });

    it('should throw CategoryValidationError for invalid ID', async () => {
      // Act & Assert
      await expect(
        categoryService.updateCategory('', { name: 'New Name' })
      ).rejects.toThrow(CategoryValidationError);
    });

    it('should accept any string type in update since schema does not validate enum', async () => {
      // Arrange
      mockCategoryRepository.findCategoryById.mockResolvedValue(existingCategory);
      mockCategoryRepository.updateCategory.mockResolvedValue({
        ...existingCategory,
        type: 'custom-type',
      });

      // Act
      const result = await categoryService.updateCategory('cat-123', { type: 'custom-type' });

      // Assert
      expect(result).toBeDefined();
      expect(result?.type).toBe('custom-type');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      // Arrange
      mockCategoryRepository.deleteCategory.mockResolvedValue(true);

      // Act
      const result = await categoryService.deleteCategory('cat-123');

      // Assert
      expect(result).toBe(true);
      expect(mockCategoryRepository.deleteCategory).toHaveBeenCalledWith('cat-123');
    });

    it('should return false if category not found', async () => {
      // Arrange
      mockCategoryRepository.deleteCategory.mockResolvedValue(false);

      // Act
      const result = await categoryService.deleteCategory('non-existent-id');

      // Assert
      expect(result).toBe(false);
    });

    it('should throw CategoryValidationError for invalid ID', async () => {
      // Act & Assert
      await expect(categoryService.deleteCategory('')).rejects.toThrow(CategoryValidationError);
      expect(mockCategoryRepository.deleteCategory).not.toHaveBeenCalled();
    });
  });

  describe('initializeIndexes', () => {
    it('should call repository createIndexes', async () => {
      // Arrange
      mockCategoryRepository.createIndexes.mockResolvedValue(undefined);

      // Act
      await categoryService.initializeIndexes();

      // Assert
      expect(mockCategoryRepository.createIndexes).toHaveBeenCalled();
    });
  });
});
