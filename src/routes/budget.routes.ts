import { Router } from "express";
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Budgets
 *   description: Budget management endpoints for users
 */

export interface Budget {
    id: string,
    userId: string,
    month: string,
    year: string,
    amount: number,
    remaining: number
}

// In-memory “DB”
const budgets: Budget[] = [];

/**
 * @swagger
 * /api/v1/users/{userId}/budgets:
 *   get:
 *     summary: Get all budgets for a user
 *     tags: [Budgets]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of user's budgets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Budget'
 */
router.get("/", (_req: Request, res: Response) => {
  res.json(budgets);
});

/**
 * @swagger
 * /api/v1/users/{userId}/budgets/{budgetId}:
 *   get:
 *     summary: Get a specific budget by ID
 *     tags: [Budgets]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - in: path
 *         name: budgetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Budget ID
 *     responses:
 *       200:
 *         description: Budget found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Budget'
 *       404:
 *         description: Budget not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", (req: Request, res: Response) => {
  const budget = budgets.find(b => b.id === req.params.id);
  if (!budget) return res.status(404).json({ error: "Budget not found" });
  res.json(budget);
});

/**
 * @swagger
 * /api/v1/users/{userId}/budgets:
 *   post:
 *     summary: Create a new budget for a user
 *     tags: [Budgets]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - month
 *               - year
 *               - amount
 *               - remaining
 *             properties:
 *               month:
 *                 type: string
 *                 example: "January"
 *               year:
 *                 type: string
 *                 example: "2024"
 *               amount:
 *                 type: number
 *                 example: 1000.00
 *               remaining:
 *                 type: number
 *                 example: 1000.00
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
 */
router.post("/", (req: Request, res: Response) => {
  const { month, year, amount, remaining } = req.body ?? {};
  const userId = req.params.id;

  const missing = ["month", "year", "amount", "remaining"]
    .filter(k => !req.body?.[k]);

  if (missing.length) {
    return res.status(400).json({
      error: "Missing required fields",
      missing,
    });
  }

  const newBudget: Budget = {
    id: randomUUID(),
    userId,
    month,
    year,
    amount,
    remaining,
  };

  budgets.push(newBudget);
  return res.status(201).json(newBudget);
});

export default router;

