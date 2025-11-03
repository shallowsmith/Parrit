import { Router } from "express";
import type { Request, Response } from "express";
import { ProfileService } from '../services/ProfileService';
import { ProfileValidationError } from '../models/Profile';
import { authenticateToken, requireSameUser } from '../middleware/auth.middleware.js';

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
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all profiles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Unauthorized - Missing, invalid, or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 */
/**
 * GET /api/v1/profiles
 * Retrieves all profiles from the system
 * Protected: Requires valid JWT token
 */
router.get("/", authenticateToken, async (_req: Request, res: Response) => {
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
 * /api/v1/login:
 *   post:
 *     summary: Login endpoint to check user registration status
 *     description: |
 *       Validates JWT token and checks if user has completed profile creation.
 *       - Returns 200 with "Login success" and profile data if user exists
 *       - Returns 404 with "First time login" and firebaseUid if user needs to register
 *       - Returns 401 if JWT is missing, invalid, or expired
 *     tags: [Profiles]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Login successful - user exists in system
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login success"
 *                 profile:
 *                   $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Unauthorized - Missing, invalid, or expired JWT token
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: "No token provided"
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: "Invalid token"
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: "Token expired"
 *       404:
 *         description: First time login - user needs to complete registration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found"
 *                 message:
 *                   type: string
 *                   example: "First time login"
 *                 firebaseUid:
 *                   type: string
 *                   example: "firebase-uid-123"
 */
/**
 * POST /api/v1/login
 * Login endpoint to check user registration status
 * Protected: Requires valid JWT token (authentication only, no authorization)
 *
 * Flow:
 * 1. JWT missing/invalid/expired → 401
 * 2. JWT valid but no userId claim → 404 "First time login"
 * 3. JWT valid with userId but profile doesn't exist → 404 "First time login"
 * 4. JWT valid with userId and profile exists → 200 "Login success"
 */
router.post("/login", authenticateToken, async (req: Request, res: Response) => {
  try {
    // Extract Firebase UID from verified JWT token
    const firebaseUid = req.user?.uid;
    const userId = req.user?.userId; // Custom claim (may not exist for first-time users)

    if (!firebaseUid) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Case 1: No userId claim in JWT - first time login
    if (!userId) {
      return res.status(404).json({
        error: "User not found",
        message: "First time login",
        firebaseUid
      });
    }

    // Case 2: userId exists in JWT, check if profile exists in database
    const profile = await profileService.getProfileById(userId);

    if (!profile) {
      // Profile was deleted or doesn't exist - treat as first time login
      return res.status(404).json({
        error: "User not found",
        message: "First time login",
        firebaseUid
      });
    }

    // Case 3: Profile exists - successful login
    return res.status(200).json({
      message: "Login success",
      profile
    });

  } catch (error) {
    console.error('Error during login:', error);

    // Handle validation errors from service
    if (error instanceof ProfileValidationError) {
      return res.status(400).json({ error: error.message });
    }

    // Handle unexpected errors
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/v1/profiles/{id}:
 *   get:
 *     summary: Get a profile by ID
 *     description: Retrieves a specific profile. Requires authentication and authorization - the userId in JWT must match the profile ID.
 *     tags: [Profiles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Profile ID (must match userId in JWT custom claim)
 *     responses:
 *       200:
 *         description: Profile found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Unauthorized - Missing token, invalid token, or userId mismatch
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
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
 * Protected: Requires valid JWT token and user must own this profile
 */
router.get("/:id", authenticateToken, requireSameUser('id'), async (req: Request, res: Response) => {
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
 *     description: Creates a user profile. Requires JWT authentication to extract firebaseUid. After profile creation, the userId custom claim is automatically set on the Firebase user. Client should refresh token to get updated JWT with userId.
 *     tags: [Profiles]
 *     security:
 *       - BearerAuth: []
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
 *         description: Profile created successfully. Firebase custom claim userId has been set.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Missing required fields or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Missing or invalid JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * POST /api/v1/profiles
 * Creates a new profile
 * Protected: Requires valid JWT token (but userId custom claim not yet required)
 * After profile creation, Firebase custom claims are updated with the new userId
 */
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    // Extract Firebase UID from verified JWT token
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Pass request body and Firebase UID to service for validation and creation
    const profile = await profileService.createProfile(req.body, firebaseUid);

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
 *     description: Updates an existing profile. Requires authentication and authorization - the userId in JWT must match the profile ID.
 *     tags: [Profiles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile ID (must match userId in JWT custom claim)
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
 *       401:
 *         description: Unauthorized - Missing token, invalid token, or userId mismatch
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
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
 * Protected: Requires valid JWT token and user must own this profile
 */
router.put("/:id", authenticateToken, requireSameUser('id'), async (req: Request, res: Response) => {
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