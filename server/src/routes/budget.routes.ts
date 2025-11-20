import { Router } from "express";
import type { Request, Response } from "express";
import { BudgetService } from '../services/BudgetService';
import { BudgetValidationError } from '../models/Budget';
import { authenticateToken, requireSameUser } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true });

const budgetService = new BudgetService();

/**
 * @swagger
 * /api/v1/users/{userId}/budgets:
 *   get:
 *     summary: Get all budgets for a user
 *     description: Requires authentication and authorization - userId in JWT must match userId in URL
 *     tags: [Budgets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (must match userId in JWT custom claim)
 *     responses:
 *       200:
 *         description: List of user's budgets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Budget'
 *       401:
 *         description: Unauthorized - Missing token, invalid token, or userId mismatch
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 */
router.get("/", authenticateToken, requireSameUser('id'), async (req: Request, res: Response) => {
  try {
    // Get userId from path parameter
    const userId = req.params.id;

    // Delegate business logic to service layer
    const budgets = await budgetService.getBudgetsByUserId(userId);

    // Return successful response with data
    res.json(budgets);
  } catch (error) {
    // Log error for debugging (in production, use proper logging)
    console.error('Error fetching budgets:', error);

    // Handle validation errors (bad request format)
    if (error instanceof BudgetValidationError) {
      return res.status(400).json({ error: error.message });
    }

    // Return generic error to client
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}/budgets/{id}:
 *   get:
 *     summary: Get a budget by ID
 *     description: Requires authentication and authorization - userId in JWT must match userId in URL
 *     tags: [Budgets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (must match userId in JWT custom claim)
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Budget ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Budget found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Budget'
 *       401:
 *         description: Unauthorized - Missing token, invalid token, or userId mismatch
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       404:
 *         description: Budget not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", authenticateToken, requireSameUser('id'), async (req: Request, res: Response) => {
  try {
    // Extract ID from URL parameter
    const budget = await budgetService.getBudgetById(req.params.id);

    // Check if budget exists
    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    // Return found budget
    res.json(budget);
  } catch (error) {
    console.error('Error fetching budget:', error);

    // Handle validation errors (bad request format)
    if (error instanceof BudgetValidationError) {
      return res.status(400).json({ error: error.message });
    }

    // Handle unexpected errors
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}/budgets:
 *   post:
 *     summary: Create a new budget
 *     tags: [Budgets]
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
 *               - userId
 *               - month
 *               - year
 *               - amount
 *               - remaining
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "68df4cd8f4c53b419fc5f196"
 *               month:
 *                 type: string
 *                 example: "January"
 *               year:
 *                 type: number
 *                 example: 2025
 *               amount:
 *                 type: number
 *                 format: double
 *                 example: 1000.00
 *               remaining:
 *                 type: number
 *                 format: double
 *                 example: 1000.00
 *               categoryId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *     responses:
 *       201:
 *         description: Budget created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Budget'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Budget already exists for this period
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", authenticateToken, requireSameUser('id'), async (req: Request, res: Response) => {
  try {
    // Pass request body to service for validation and creation
    const budget = await budgetService.createBudget(req.body);

    // Return created budget with 201 status
    res.status(201).json(budget);
  } catch (error) {
    console.error('Error creating budget:', error);

    // Handle business logic and validation errors
    if (error instanceof BudgetValidationError) {
      // Use 409 for conflict (budget exists), 400 for validation errors
      const statusCode = error.message.includes('already exists') ? 409 : 400;

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
 * /api/v1/users/{userId}/budgets/{id}:
 *   put:
 *     summary: Update a budget
 *     tags: [Budgets]
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
 *         description: Budget ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               month:
 *                 type: string
 *                 example: "January"
 *               year:
 *                 type: number
 *                 example: 2025
 *               amount:
 *                 type: number
 *                 format: double
 *                 example: 1000.00
 *               remaining:
 *                 type: number
 *                 format: double
 *                 example: 750.00
 *               categoryId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Budget updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Budget'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Budget not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id", authenticateToken, requireSameUser('id'), async (req: Request, res: Response) => {
  try {
    // Pass ID and request body to service for validation and update
    const budget = await budgetService.updateBudget(req.params.id, req.body);

    // Check if budget exists
    if (!budget) {
      return res.status(404).json({ error: "Budget not found" });
    }

    // Return updated budget
    res.json(budget);
  } catch (error) {
    console.error('Error updating budget:', error);

    // Handle business logic and validation errors
    if (error instanceof BudgetValidationError) {
      return res.status(400).json({
        error: error.message,
        field: error.field
      });
    }

    // Handle unexpected errors
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
