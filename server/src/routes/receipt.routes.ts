import { Router } from "express";
import type { Request, Response } from "express";
import multer from "multer";
import { ReceiptService } from "../services/ReceiptService";
import { ReceiptValidationError } from "../models/Receipt";
import { authenticateToken, requireSameUser } from "../middleware/auth.middleware";

const upload = multer({ dest: "uploads/" });
const router = Router({ mergeParams: true });
const receiptService = new ReceiptService();

/**
 * @swagger
 * tags:
 *   name: Receipts
 *   description: API endpoints for managing receipts (Firebase integration)
 */

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
 *         description: Firebase user ID
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
router.get("/", authenticateToken, requireSameUser("userId"), async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const receipts = await receiptService.getReceiptsByUserId(userId);
    res.json(receipts);
  } catch (error) {
    console.error("Error fetching receipts:", error);
    if (error instanceof ReceiptValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}/receipts/{id}:
 *   get:
 *     summary: Get a single receipt by ID
 *     tags: [Receipts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Firebase user ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Receipt document ID
 *     responses:
 *       200:
 *         description: Receipt found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Receipt'
 *       404:
 *         description: Receipt not found
 */
router.get("/:id", authenticateToken, requireSameUser("userId"), async (req: Request, res: Response) => {
  try {
    const receipt = await receiptService.getReceiptById(req.params.id);
    if (!receipt) return res.status(404).json({ error: "Receipt not found" });
    res.json(receipt);
  } catch (error) {
    console.error("Error fetching receipt:", error);
    res.status(500).json({ error: "Internal server error" });
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Receipt'
 *     responses:
 *       201:
 *         description: Receipt created successfully
 */
router.post("/", authenticateToken, requireSameUser("userId"), async (req: Request, res: Response) => {
  try {
    const receipt = await receiptService.createReceipt(req.body);
    res.status(201).json(receipt);
  } catch (error: any) {
    console.error("Error creating receipt:", error);
    res.status(500).json({ error: "Internal server error" });
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Receipt'
 *     responses:
 *       200:
 *         description: Receipt updated successfully
 *       404:
 *         description: Receipt not found
 */
router.put("/:id", authenticateToken, requireSameUser("userId"), async (req: Request, res: Response) => {
  try {
    const receipt = await receiptService.updateReceipt(req.params.id, req.body);
    if (!receipt) return res.status(404).json({ error: "Receipt not found" });
    res.json(receipt);
  } catch (error) {
    console.error("Error updating receipt:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}/receipts/scan:
 *   post:
 *     summary: Upload a receipt image and extract structured data
 *     tags: [Receipts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
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
 */
router.post("/scan", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const result = await receiptService.processReceipt(userId, req.file.path);
    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error scanning receipt:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}/receipts/{id}:
 *   delete:
 *     summary: Delete a receipt
 *     tags: [Receipts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Receipt deleted successfully
 *       404:
 *         description: Receipt not found
 */
router.delete("/:id", authenticateToken, requireSameUser("userId"), async (req: Request, res: Response) => {
  try {
    const success = await receiptService.deleteReceipt(req.params.id);
    if (!success) return res.status(404).json({ error: "Receipt not found" });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting receipt:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
