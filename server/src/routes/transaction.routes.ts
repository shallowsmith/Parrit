import { Router } from "express";
import type { Request, Response } from "express";
import { TransactionService } from '../services/TransactionService';
import { TransactionValidationError } from '../models/Transaction';
import { authenticateToken, requireSameUser } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

const transactionService = new TransactionService();

/**
 * @swagger
 * /api/v1/users/{userId}/transactions:
 *   get:
 *     summary: Get all transactions for a user
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: List of user's transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 */
router.get("/", authenticateToken, requireSameUser('userId'), async (req: Request, res: Response) => {
  try {
    // Get userId from path parameter
    const userId = req.params.userId;

    // Delegate business logic to service layer
    const transactions = await transactionService.getTransactionsByUserId(userId);

    // Return successful response with data
    res.json(transactions);
  } catch (error) {
    // Log error for debugging (in production, use proper logging)
    console.error('Error fetching transactions:', error);

    // Handle validation errors (bad request format)
    if (error instanceof TransactionValidationError) {
      return res.status(400).json({ error: error.message });
    }

    // Return generic error to client
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}/transactions/{id}:
 *   get:
 *     summary: Get a transaction by ID
 *     tags: [Transactions]
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
 *         description: Transaction ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Transaction found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", authenticateToken, requireSameUser('userId'), async (req: Request, res: Response) => {
  try {
    // Extract ID from URL parameter
    const transaction = await transactionService.getTransactionById(req.params.id);

    // Check if transaction exists
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Return found transaction
    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);

    // Handle validation errors (bad request format)
    if (error instanceof TransactionValidationError) {
      return res.status(400).json({ error: error.message });
    }

    // Handle unexpected errors
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
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
 *               - vendorName
 *               - description
 *               - dateTime
 *               - amount
 *               - paymentType
 *               - categoryId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "68df4cd8f4c53b419fc5f196"
 *               vendorName:
 *                 type: string
 *                 example: "Starbucks"
 *               description:
 *                 type: string
 *                 example: "Morning coffee"
 *               dateTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-10-06T10:30:00Z"
 *               amount:
 *                 type: number
 *                 format: double
 *                 example: 5.99
 *               paymentType:
 *                 type: string
 *                 example: "Credit Card"
 *               categoryId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *               receiptId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439013"
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", authenticateToken, requireSameUser('userId'), async (req: Request, res: Response) => {
  try {
    // Pass request body to service for validation and creation
    const transaction = await transactionService.createTransaction(req.body);

    // Return created transaction with 201 status
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);

    // Handle business logic and validation errors
    if (error instanceof TransactionValidationError) {
      return res.status(400).json({
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
 * /api/v1/users/{userId}/transactions/{id}:
 *   put:
 *     summary: Update a transaction
 *     tags: [Transactions]
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
 *         description: Transaction ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vendorName:
 *                 type: string
 *                 example: "Starbucks"
 *               description:
 *                 type: string
 *                 example: "Morning coffee"
 *               dateTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-10-06T10:30:00Z"
 *               amount:
 *                 type: number
 *                 format: double
 *                 example: 5.99
 *               paymentType:
 *                 type: string
 *                 example: "Credit Card"
 *               categoryId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *               receiptId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439013"
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id", authenticateToken, requireSameUser('userId'), async (req: Request, res: Response) => {
  try {
    // Pass ID and request body to service for validation and update
    const transaction = await transactionService.updateTransaction(req.params.id, req.body);

    // Check if transaction exists
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Return updated transaction
    res.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);

    // Handle business logic and validation errors
    if (error instanceof TransactionValidationError) {
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
