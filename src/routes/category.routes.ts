import { Router } from "express";
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management endpoints for users
 */

export interface Category {
    id: string,
    name: string,
    type: string,
    userId: string
}

/**
 * @swagger
 * /api/v1/users/{userId}/categories:
 *   get:
 *     summary: Get categories for a user
 *     tags: [Categories]
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
 *         description: User category
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 */
router.get("/", (_req: Request, res: Response) => {
    let cat: Category = {
        id: randomUUID(),
        name: "Groceries",
        type: "User",
        userId: "123e4567-e89b-12d3-a456-426614174000"
    }
    res.json(cat);
});

export default router;