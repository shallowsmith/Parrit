/**
 * Google OAuth Routes
 *
 * Handles OAuth 2.0 flow for Google Sheets integration.
 * - Initiates OAuth flow
 * - Handles OAuth callback
 * - Exports transactions to Google Sheets
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { GoogleSheetsService } from '../services/GoogleSheetsService';
import { TransactionService } from '../services/TransactionService';
import { ProfileService } from '../services/ProfileService';
import { CategoryService } from '../services/CategoryService';
import { authenticateToken, requireSameUser } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

const googleSheetsService = new GoogleSheetsService();
const transactionService = new TransactionService();
const profileService = new ProfileService();
const categoryService = new CategoryService();

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback endpoint
 *     description: |
 *       Static OAuth callback route that matches Google Cloud Console redirect URI.
 *       This endpoint is called by Google after user authorization.
 *       Extracts userId from state parameter and processes the OAuth callback.
 *       **Note:** This endpoint does not require authentication as it's called by Google's redirect.
 *     tags:
 *       - Google Sheets Export
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Google OAuth
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64 encoded state parameter containing userId
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: OAuth error if authorization failed
 *     responses:
 *       '200':
 *         description: Export successful - returns HTML page with success message
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: '<!DOCTYPE html>...'
 *       '400':
 *         description: Bad request - invalid parameters or OAuth error
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       '500':
 *         description: Internal server error
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
router.get("/auth/google/callback", async (req: Request, res: Response) => {
  try {
    const { code, state, error } = req.query;

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error - Parrit</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #ef4444; }
            </style>
          </head>
          <body>
            <h1>❌ Authorization Failed</h1>
            <p>OAuth authorization failed: ${error}</p>
            <p style="font-size: 14px; color: #9ca3af;">You can close this window and try again.</p>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error - Parrit</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #ef4444; }
            </style>
          </head>
          <body>
            <h1>❌ Error</h1>
            <p>Authorization code not provided</p>
            <p style="font-size: 14px; color: #9ca3af;">You can close this window and try again.</p>
          </body>
        </html>
      `);
    }

    // Extract userId from state parameter
    let userId: string | null = null;
    if (state) {
      try {
        const decodedState = JSON.parse(Buffer.from(state as string, 'base64').toString());
        userId = decodedState.userId;
        console.log('[GoogleAuth] Static callback - extracted userId from state:', userId);
      } catch (e) {
        console.error('Error decoding state:', e);
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Error - Parrit</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                h1 { color: #ef4444; }
              </style>
            </head>
            <body>
              <h1>❌ Invalid State</h1>
              <p>Unable to verify authorization state</p>
              <p style="font-size: 14px; color: #9ca3af;">You can close this window and try again.</p>
            </body>
          </html>
        `);
      }
    }

    if (!userId || userId.length !== 24) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error - Parrit</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #ef4444; }
            </style>
          </head>
          <body>
            <h1>❌ Invalid User ID</h1>
            <p>Unable to identify user from authorization state</p>
            <p style="font-size: 14px; color: #9ca3af;">You can close this window and try again.</p>
          </body>
        </html>
      `);
    }

    // Process OAuth callback (same logic as the user-specific callback)
    const tokens = await googleSheetsService.getTokensFromCode(code as string);
    
    if (!tokens.access_token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Error - Parrit</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #ef4444; }
            </style>
          </head>
          <body>
            <h1>❌ Token Error</h1>
            <p>Failed to obtain access token</p>
            <p style="font-size: 14px; color: #9ca3af;">You can close this window and try again.</p>
          </body>
        </html>
      `);
    }

    // Store refresh token if provided
    if (tokens.refresh_token) {
      await (profileService as any).profileRepository.updateGoogleRefreshToken(userId, tokens.refresh_token);
      console.log('[GoogleAuth] Refresh token stored for userId:', userId);
    }

    googleSheetsService.setCredentials(tokens.access_token, tokens.refresh_token);

    // Fetch transactions and create sheet
    const transactions = await transactionService.getTransactionsByUserId(userId);

    // Fetch all categories for this user to map IDs to names
    const categories = await categoryService.getCategoriesByUserId(userId);

    // Create a map of categoryId -> categoryName for quick lookup
    const categoryMap = new Map(
      categories.map((cat: any) => [cat.id || cat._id?.toString(), cat.name])
    );

    // Enrich transactions with category names
    const enrichedTransactions = transactions.map((t: any) => ({
      ...t,
      categoryName: categoryMap.get(t.categoryId) || 'Uncategorized',
    }));

    const sheetTitle = `Parrit Transactions - ${new Date().toLocaleDateString()}`;
    const sheetUrl = await googleSheetsService.createSheetWithTransactions(
      enrichedTransactions,
      sheetTitle
    );

    // Return success page
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Export Successful - Parrit</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              background: #000000;
              margin: 0;
              padding: 20px;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: #1A1A1A;
              border-radius: 16px;
              padding: 40px;
              max-width: 500px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
              text-align: center;
              border: 1px solid #2A2A2A;
            }
            h1 {
              color: #6FA85F;
              font-size: 32px;
              margin-bottom: 16px;
            }
            p {
              color: #B0B0B0;
              font-size: 16px;
              margin-bottom: 24px;
            }
            .button {
              display: inline-block;
              background: #6FA85F;
              color: #FFFFFF;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              transition: background 0.2s;
            }
            .button:hover {
              background: #5A8A4F;
            }
            .count {
              font-size: 18px;
              font-weight: 600;
              color: #FFFFFF;
              margin: 16px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Export Successful</h2>
            <p>Your transactions have been exported to Google Sheets.</p>
            <div class="count">${transactions.length} transactions exported</div>
            <a href="${sheetUrl}" target="_blank" class="button">Open Google Sheet</a>
            <br><br>
            <p style="font-size: 14px; color: #B0B0B0;">You can close this window and return to the app.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Error in static OAuth callback:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - Parrit</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #ef4444; }
          </style>
        </head>
        <body>
          <h1>❌ Export Failed</h1>
          <p>Failed to export transactions: ${error.message || 'Unknown error'}</p>
          <p style="font-size: 14px; color: #9ca3af;">You can close this window and try again.</p>
        </body>
      </html>
    `);
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}/google/auth:
 *   get:
 *     summary: Initiate Google OAuth flow
 *     description: |
 *       Initiates the Google OAuth 2.0 flow for Google Sheets integration.
 *       Redirects user to Google's consent screen for authorization.
 *       **Note:** This endpoint does not require authentication as it's opened from a browser redirect.
 *     tags:
 *       - Google Sheets Export
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-f0-9]{24}$'
 *         description: User ID (MongoDB ObjectId)
 *         example: '507f1f77bcf86cd799439011'
 *     responses:
 *       '302':
 *         description: Redirects to Google OAuth consent screen
 *       '400':
 *         description: Invalid user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Failed to initiate OAuth flow
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/auth", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    // Basic validation - userId should be a valid MongoDB ObjectId format
    if (!userId || userId.length !== 24) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Generate state parameter to prevent CSRF attacks
    const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString('base64');
    
    // Get authorization URL
    const authUrl = googleSheetsService.getAuthUrl(state);
    
    console.log('[GoogleAuth] Initiating OAuth flow for userId:', userId);
    
    // Redirect to Google OAuth consent screen
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating OAuth flow:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth flow' });
  }
});

/**
 * GET /api/v1/users/{userId}/google/callback
 * Handles OAuth callback from Google
 * Exchanges authorization code for tokens and creates Google Sheet
 * Note: This endpoint doesn't require authentication because Google redirects here
 * Security is provided by verifying the state parameter
 */
router.get("/callback", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const { code, state, error } = req.query;
    
    // Basic validation - userId should be a valid MongoDB ObjectId format
    if (!userId || userId.length !== 24) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Error - Parrit</title></head>
          <body><h1>Invalid user ID</h1></body>
        </html>
      `);
    }

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return res.status(400).json({ 
        error: 'OAuth authorization failed',
        details: error 
      });
    }

    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    // Verify state parameter (security check)
    if (state) {
      try {
        const decodedState = JSON.parse(Buffer.from(state as string, 'base64').toString());
        if (decodedState.userId !== userId) {
          return res.status(400).send(`
            <!DOCTYPE html>
            <html>
              <head><title>Error - Parrit</title></head>
              <body><h1>Invalid state parameter</h1></body>
            </html>
          `);
        }
        console.log('[GoogleAuth] State verified for userId:', userId);
      } catch (e) {
        console.error('Error verifying state:', e);
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
            <head><title>Error - Parrit</title></head>
            <body><h1>Invalid state parameter</h1></body>
          </html>
        `);
      }
    } else {
      console.warn('[GoogleAuth] No state parameter provided in callback');
    }

    // Exchange code for tokens
    const tokens = await googleSheetsService.getTokensFromCode(code as string);
    
    if (!tokens.access_token) {
      return res.status(400).json({ error: 'Failed to obtain access token' });
    }

    // Store refresh token in user's profile
    if (tokens.refresh_token) {
      await (profileService as any).profileRepository.updateGoogleRefreshToken(userId, tokens.refresh_token);
    }

    // Set credentials for Google Sheets API
    googleSheetsService.setCredentials(tokens.access_token, tokens.refresh_token);

    // Fetch user's transactions
    const transactions = await transactionService.getTransactionsByUserId(userId);

    // Fetch all categories for this user to map IDs to names
    const categories = await categoryService.getCategoriesByUserId(userId);

    // Create a map of categoryId -> categoryName for quick lookup
    const categoryMap = new Map(
      categories.map((cat: any) => [cat.id || cat._id?.toString(), cat.name])
    );

    // Enrich transactions with category names
    const enrichedTransactions = transactions.map((t: any) => ({
      ...t,
      categoryName: categoryMap.get(t.categoryId) || 'Uncategorized',
    }));

    // Create Google Sheet with transactions
    const sheetTitle = `Parrit Transactions - ${new Date().toLocaleDateString()}`;
    const sheetUrl = await googleSheetsService.createSheetWithTransactions(
      enrichedTransactions,
      sheetTitle
    );

    // Return HTML page with success message and link to sheet
    // This provides better UX since OAuth callback happens in browser
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Export Successful - Parrit</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #000000;
              padding: 20px;
            }
            .container {
              background: #1A1A1A;
              border-radius: 16px;
              padding: 40px;
              max-width: 500px;
              width: 100%;
              box-shadow: 0 20px 60px rgba(0,0,0,0.5);
              text-align: center;
              border: 1px solid #2A2A2A;
            }
            h1 {
              color: #6FA85F;
              margin-bottom: 16px;
              font-size: 28px;
            }
            p {
              color: #B0B0B0;
              margin-bottom: 24px;
              line-height: 1.6;
            }
            .button {
              display: inline-block;
              background: #6FA85F;
              color: #FFFFFF;
              padding: 14px 28px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              margin: 8px;
              transition: background 0.2s;
            }
            .button:hover {
              background: #5A8A4F;
            }
            .button-secondary {
              background: #3A4A3A;
              color: #FFFFFF;
            }
            .button-secondary:hover {
              background: #4A5A4A;
            }
            .count {
              font-size: 18px;
              font-weight: 600;
              color: #FFFFFF;
              margin: 16px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Export Successful!</h1>
            <p>Your transactions have been exported to Google Sheets.</p>
            <div class="count">${transactions.length} transactions exported</div>
            <a href="${sheetUrl}" target="_blank" class="button">Open Google Sheet</a>
            <br><br>
            <p style="font-size: 14px; color: #B0B0B0;">You can close this window and return to the app.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Error in OAuth callback:', error);
    res.status(500).json({ 
      error: 'Failed to export transactions',
      details: error.message 
    });
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}/google/export:
 *   post:
 *     summary: Export transactions to Google Sheets
 *     description: |
 *       Exports all user transactions to a new Google Sheet.
 *       - If user has a stored refresh token, exports immediately
 *       - If no refresh token exists, returns 401 with authUrl to initiate OAuth flow
 *     tags:
 *       - Google Sheets Export
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-f0-9]{24}$'
 *         description: User ID (MongoDB ObjectId) - must match JWT userId claim
 *         example: '507f1f77bcf86cd799439011'
 *     responses:
 *       '200':
 *         description: Export successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Transactions exported to Google Sheets successfully'
 *                 sheetUrl:
 *                   type: string
 *                   format: uri
 *                   example: 'https://docs.google.com/spreadsheets/d/1abc123xyz'
 *                 transactionCount:
 *                   type: number
 *                   example: 42
 *       '401':
 *         description: Authorization required or expired
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Google authorization required'
 *                 authUrl:
 *                   type: string
 *                   example: '/users/{userId}/google/auth'
 *                 message:
 *                   type: string
 *                   example: 'Please authorize Google Sheets access first'
 *       '404':
 *         description: Profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Failed to export transactions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/export", authenticateToken, requireSameUser('userId'), async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    // Get user's profile to check for refresh token
    const profile = await profileService.getProfileById(userId);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Check if user has a refresh token stored
    const fullProfile = await (profileService as any).profileRepository.findProfileById(userId);
    
    if (!fullProfile?.googleRefreshToken) {
      // No refresh token - need to initiate OAuth flow
      // Return path without /api/v1 prefix since API_URL already includes it
      return res.status(401).json({
        error: 'Google authorization required',
        authUrl: `/users/${userId}/google/auth`,
        message: 'Please authorize Google Sheets access first',
      });
    }

    // User has refresh token - refresh access token and export
    try {
      const accessToken = await googleSheetsService.refreshAccessToken(fullProfile.googleRefreshToken);
      googleSheetsService.setCredentials(accessToken, fullProfile.googleRefreshToken);

      // Fetch transactions
      const transactions = await transactionService.getTransactionsByUserId(userId);

      // Fetch all categories for this user to map IDs to names
      const categories = await categoryService.getCategoriesByUserId(userId);

      // Create a map of categoryId -> categoryName for quick lookup
      const categoryMap = new Map(
        categories.map((cat: any) => [cat.id || cat._id?.toString(), cat.name])
      );

      // Enrich transactions with category names
      const enrichedTransactions = transactions.map((t: any) => ({
        ...t,
        categoryName: categoryMap.get(t.categoryId) || 'Uncategorized',
      }));

      // Create Google Sheet
      const sheetTitle = `Parrit Transactions - ${new Date().toLocaleDateString()}`;
      const sheetUrl = await googleSheetsService.createSheetWithTransactions(
        enrichedTransactions,
        sheetTitle
      );

      res.status(200).json({
        success: true,
        message: 'Transactions exported to Google Sheets successfully',
        sheetUrl: sheetUrl,
        transactionCount: transactions.length,
      });
    } catch (refreshError: any) {
      // Refresh token expired or invalid - need to re-authenticate
      console.error('Error refreshing token:', refreshError);
      return res.status(401).json({
        error: 'Google authorization expired',
        authUrl: `/api/v1/users/${userId}/google/auth`,
        message: 'Please re-authorize Google Sheets access',
      });
    }
  } catch (error: any) {
    console.error('Error exporting transactions:', error);
    res.status(500).json({ 
      error: 'Failed to export transactions',
      details: error.message 
    });
  }
});

export default router;

