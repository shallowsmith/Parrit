import { Router } from "express";
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { CategoryService } from '../services/CategoryService';
import { CategoryValidationError } from '../models/Category';
import { authenticateToken, requireSameUser } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

const categoryService = new CategoryService();


/**
 * @swagger
 * /api/v1/users/{userId}/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: List of all categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
router.get("/", authenticateToken, requireSameUser('userId'), async (_req: Request, res: Response) => {
  try {
    // Delegate business logic to service layer
    const categories = await categoryService.getAllCategories();

    // Return successful response with data
    res.json(categories);
  } catch (error) {
    // Log error for debugging (in production, use proper logging)
    console.error('Error fetching categories:', error);

    // Return generic error to client
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}/categories/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (MongoDB ObjectId)
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Category found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", authenticateToken, requireSameUser('userId'), async (req: Request, res: Response) => {
  try {
    // Extract ID from URL parameter
    const category = await categoryService.getCategoryById(req.params.id);

    // Check if category exists
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Return found category
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);

    // Handle validation errors (bad request format)
    if (error instanceof CategoryValidationError) {
      return res.status(400).json({ error: error.message });
    }

    // Handle unexpected errors
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - userId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Groceries"
 *               type:
 *                 type: string
 *                 example: "expense"
 *               userId:
 *                 type: string
 *                 example: "68df4cd8f4c53b419fc5f196"
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Category name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", authenticateToken, requireSameUser('userId'), async (req: Request, res: Response) => {
  try {
    // Pass request body to service for validation and creation
    const category = await categoryService.createCategory(req.body);

    // Return created profile with 201 status
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);

    // Handle business logic and validation errors
    if (error instanceof CategoryValidationError) {
      // Use 409 for conflict (name exists), 400 for validation errors
      const statusCode = error.field === 'name' && error.message.includes('already exists') ? 409 : 400;

      return res.status(statusCode).json({
        error: error.message,
        field: error.field,
        missing: error.missingFields
      });
    }

    // Handle unexpected errors
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}/categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (MongoDB ObjectId)
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Groceries"
 *               type:
 *                 type: string
 *                 example: "expense"
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * PUT /api/v1/users/:userId/categories/:id
 * Updates an existing category
 */
router.put("/:id", authenticateToken, requireSameUser('userId'), async (req: Request, res: Response) => {
  try {
    // Pass ID and request body to service for validation and update
    const category = await categoryService.updateCategory(req.params.id, req.body);

    // Check if category exists
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Return updated category
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);

    // Handle business logic and validation errors
    if (error instanceof CategoryValidationError) {
      return res.status(400).json({
        error: error.message,
        field: error.field
      });
    }

    // Handle unexpected errors
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.delete("/:id", authenticateToken, requireSameUser('userId'), async (req: Request, res: Response) => {
  try {
    const deleted = await categoryService.deleteCategory(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Category not found' });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    if (error instanceof CategoryValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/dedupe', authenticateToken, requireSameUser('userId'), async (req: Request, res: Response) => {
  try {
    const result = await categoryService.dedupeCategoriesForUser(req.params.userId);
    res.json({ merged: result });
  } catch (err) {
    console.error('Failed to dedupe categories', err);
    res.status(500).json({ error: 'Failed to dedupe categories' });
  }
});

export default router;