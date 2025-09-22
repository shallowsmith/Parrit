import { Router } from "express";
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Receipts
 *   description: Receipt management endpoints for users
 */

export interface Receipt {
    id: string,
    userId: string,
    vendorName: string,
    description: string,
    dateTime: Date,
    amount: number,
    paymentType: string, 
    categoryName: string,
    receiptImageUrl: string 
}


/**
 * @swagger
 * /api/v1/users/{userId}/receipts:
 *   get:
 *     summary: Get receipts for a user
 *     tags: [Receipts]
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
 *         description: User receipt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Receipt'
 */
router.get("/", (_req: Request, res: Response) => {
    let r: Receipt = {
        id: randomUUID(),
        userId: "123e4567-e89b-12d3-a456-426614174000",
        vendorName: "Starbucks",
        description: "coffee",
        dateTime: new Date("2024-01-15T10:30:00Z"),
        amount: 5.99,
        paymentType: "Credit Card",
        categoryName: "Food",
        receiptImageUrl: "https://example.com/receipt/starbucks-12345.jpg"
    }
    res.json(r);
});

export default router;