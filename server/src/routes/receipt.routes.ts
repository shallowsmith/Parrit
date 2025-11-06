import { Router } from "express";
import type { Request, Response } from "express";
import { ReceiptService } from '../services/ReceiptService';
import { ReceiptValidationError } from '../models/Receipt';

const router = Router({ mergeParams: true });

const receiptService = new ReceiptService();

/**
 * @swagger
 * /api/v1/users/{userId}/receipts:
 *   get:
 *     summary: Get all receipts for a user
 *     tags: [Receipts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: List of user's receipts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Receipt'
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // Get userId from path parameter
    const userId = req.params.userId;

    // Delegate business logic to service layer
    const receipts = await receiptService.getReceiptsByUserId(userId);

    // Return successful response with data
    res.json(receipts);
  } catch (error) {
    // Log error for debugging (in production, use proper logging)
    console.error('Error fetching receipts:', error);

    // Handle validation errors (bad request format)
    if (error instanceof ReceiptValidationError) {
      return res.status(400).json({ error: error.message });
    }

    // Return generic error to client
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}/receipts/{id}:
 *   get:
 *     summary: Get a receipt by ID
 *     tags: [Receipts]
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
 *         description: Receipt ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Receipt found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Receipt'
 *       404:
 *         description: Receipt not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    // Extract ID from URL parameter
    const receipt = await receiptService.getReceiptById(req.params.id);

    // Check if receipt exists
    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    // Return found receipt
    res.json(receipt);
  } catch (error) {
    console.error('Error fetching receipt:', error);

    // Handle validation errors (bad request format)
    if (error instanceof ReceiptValidationError) {
      return res.status(400).json({ error: error.message });
    }

    // Handle unexpected errors
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}/receipts:
 *   post:
 *     summary: Create a new receipt
 *     tags: [Receipts]
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
 *               - merchantName
 *               - amount
 *               - date
 *               - categoryId
 *               - userId
 *             properties:
 *               merchantName:
 *                 type: string
 *                 example: "Whole Foods Market"
 *               amount:
 *                 type: number
 *                 format: double
 *                 example: 45.67
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-10-06T14:30:00Z"
 *               categoryId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *               userId:
 *                 type: string
 *                 example: "68df4cd8f4c53b419fc5f196"
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/receipts/image.jpg"
 *               notes:
 *                 type: string
 *                 example: "Business lunch with client"
 *     responses:
 *       201:
 *         description: Receipt created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Receipt'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    // Pass request body to service for validation and creation
    const receipt = await receiptService.createReceipt(req.body);

    // Return created receipt with 201 status
    res.status(201).json(receipt);
  } catch (error) {
    console.error('Error creating receipt:', error);

    // Handle business logic and validation errors
    if (error instanceof ReceiptValidationError) {
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
 * /api/v1/users/{userId}/receipts/{id}:
 *   put:
 *     summary: Update a receipt
 *     tags: [Receipts]
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
 *         description: Receipt ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               merchantName:
 *                 type: string
 *                 example: "Whole Foods Market"
 *               amount:
 *                 type: number
 *                 format: double
 *                 example: 45.67
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-10-06T14:30:00Z"
 *               categoryId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439012"
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/receipts/image.jpg"
 *               notes:
 *                 type: string
 *                 example: "Business lunch with client"
 *     responses:
 *       200:
 *         description: Receipt updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Receipt'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Receipt not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    // Pass ID and request body to service for validation and update
    const receipt = await receiptService.updateReceipt(req.params.id, req.body);

    // Check if receipt exists
    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    // Return updated receipt
    res.json(receipt);
  } catch (error) {
    console.error('Error updating receipt:', error);

    // Handle business logic and validation errors
    if (error instanceof ReceiptValidationError) {
      return res.status(400).json({
        error: error.message,
        field: error.field
      });
    }

    // Handle unexpected errors
    res.status(500).json({ error: 'Internal server error' });
  }
});

// allows client to upload receipt --> backend --> send to Google Vision (OCR)/OpenAI --> return structured data --> save to MongoDB
/**
 * @swagger
 * /api/v1/users/{userId}/receipts/scan:
 *   post:
 *     summary: Upload a receipt image, extract text, and generate structured transaction data
 *     tags: [Receipts]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Extracted receipt data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     merchant:
 *                       type: string
 *                       example: "Starbucks"
 *                     date:
 *                       type: string
 *                       example: "2025-10-05"
 *                     total:
 *                       type: number
 *                       example: 7.25
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           price:
 *                             type: number
 */

import multer from "multer";
const upload = multer({ dest: "uploads/" });

router.post("/scan", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Delegate processing to service layer
    const result = await receiptService.processReceipt(userId, req.file.path);

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error scanning receipt:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});


export default router;