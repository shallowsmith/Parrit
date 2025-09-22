import { Router } from "express";
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Profiles
 *   description: Profile management endpoints
 */

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  birthday: string;           // mm/dd
  email: string;
  phoneNumber: string;
  profileImage?: string | null;
  nickname?: string | null;
  status?: string | null;
}

// In-memory “DB”
const profiles: Profile[] = [];

/**
 * @swagger
 * /api/v1/profiles:
 *   get:
 *     summary: Get all profiles
 *     tags: [Profiles]
 *     responses:
 *       200:
 *         description: List of all profiles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Profile'
 */
router.get("/", (_req: Request, res: Response) => {
  res.json(profiles);
});

/**
 * @swagger
 * /api/v1/profiles/{id}:
 *   get:
 *     summary: Get a profile by ID
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Profile ID
 *     responses:
 *       200:
 *         description: Profile found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", (req: Request, res: Response) => {
  const p = profiles.find(pr => pr.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Profile not found" });
  res.json(p);
});

/**
 * @swagger
 * /api/v1/profiles:
 *   post:
 *     summary: Create a new profile
 *     tags: [Profiles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - birthday
 *               - email
 *               - phoneNumber
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               birthday:
 *                 type: string
 *                 pattern: "^[0-9]{2}/[0-9]{2}$"
 *                 example: "01/15"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               profileImage:
 *                 type: string
 *                 nullable: true
 *                 example: "https://example.com/image.jpg"
 *               nickname:
 *                 type: string
 *                 nullable: true
 *                 example: "Johnny"
 *               status:
 *                 type: string
 *                 nullable: true
 *                 example: "Active"
 *     responses:
 *       201:
 *         description: Profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", (req: Request, res: Response) => {
  const {
    firstName,
    lastName,
    birthday,
    email,
    phoneNumber,
    profileImage = null,
    nickname = null,
    status = null,
  } = req.body ?? {};

  // Minimal validation for required fields
  const missing = ["firstName","lastName","birthday","email","phoneNumber"]
    .filter(k => !req.body?.[k]);

  if (missing.length) {
    return res.status(400).json({
      error: "Missing required fields",
      missing,
    });
  }

  const newProfile: Profile = {
    id: randomUUID(),
    firstName,
    lastName,
    birthday,
    email,
    phoneNumber,
    profileImage,
    nickname,
    status,
  };

  profiles.push(newProfile);
  return res.status(201).json(newProfile);
});

export default router;