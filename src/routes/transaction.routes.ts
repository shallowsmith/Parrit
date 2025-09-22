import { Router } from "express";
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction management endpoints for users
 */

export interface Transaction {
    id: string,
    userId: string,
    vendorName: string,
    description: string,
    dateTime: Date,
    amount: number,
    paymentType: string, 
    categoryName: string,
    receiptImageUrl?: string | null
}

/**
 * @swagger
 * /api/v1/users/{userId}/transactions:
 *   get:
 *     summary: Get transactions for a user
 *     tags: [Transactions]
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
 *         description: User transaction
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 */
router.get("/", (_req: Request, res: Response) => {
    let t: Transaction = {
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
    res.json(t);
});

export default router;