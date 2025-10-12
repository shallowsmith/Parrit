import { Router } from "express";
import type { Request, Response } from "express";
import { ProfileService } from '../services/ProfileService';
import { ProfileValidationError } from '../models/Profile';

/**
 * Profile Routes - Presentation Layer
 *
 * Responsibilities:
 * - Handle HTTP requests and responses
 * - Validate request format and parameters
 * - Transform service responses to HTTP format
 * - Set appropriate HTTP status codes
 * - Handle errors gracefully
 *
 * This layer should NOT contain:
 * - Business logic (delegated to ProfileService)
 * - Database operations (delegated to ProfileRepository)
 * - Data validation (basic format validation only)
 */

const router = Router();
// Initialize service layer for business logic
const profileService = new ProfileService();


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
/**
 * GET /api/v1/profiles
 * Retrieves all profiles from the system
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    // Delegate business logic to service layer
    const profiles = await profileService.getAllProfiles();

    // Return successful response with data
    res.json(profiles);
  } catch (error) {
    // Log error for debugging (in production, use proper logging)
    console.error('Error fetching profiles:', error);

    // Return generic error to client
    res.status(500).json({ error: 'Internal server error' });
  }
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
/**
 * GET /api/v1/profiles/:id
 * Retrieves a specific profile by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    // Extract ID from URL parameter
    const profile = await profileService.getProfileById(req.params.id);

    // Check if profile exists
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Return found profile
    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);

    // Handle validation errors (bad request format)
    if (error instanceof ProfileValidationError) {
      return res.status(400).json({ error: error.message });
    }

    // Handle unexpected errors
    res.status(500).json({ error: 'Internal server error' });
  }
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
/**
 * POST /api/v1/profiles
 * Creates a new profile
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    // Pass request body to service for validation and creation
    const profile = await profileService.createProfile(req.body);

    // Return created profile with 201 status
    res.status(201).json(profile);
  } catch (error) {
    console.error('Error creating profile:', error);

    // Handle business logic and validation errors
    if (error instanceof ProfileValidationError) {
      // Use 409 for conflict (email exists), 400 for validation errors
      const statusCode = error.field === 'email' && error.message.includes('already exists') ? 409 : 400;

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
 * /api/v1/profiles/{id}:
 *   put:
 *     summary: Update a profile
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * PUT /api/v1/profiles/:id
 * Updates an existing profile
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    // Pass ID and request body to service for validation and update
    const profile = await profileService.updateProfile(req.params.id, req.body);

    // Check if profile exists
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    // Return updated profile
    res.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);

    // Handle business logic and validation errors
    if (error instanceof ProfileValidationError) {
      // Use 409 for conflict (email exists), 400 for validation errors
      const statusCode = error.field === 'email' && error.message.includes('already exists') ? 409 : 400;

      return res.status(statusCode).json({
        error: error.message,
        field: error.field
      });
    }

    // Handle unexpected errors
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;