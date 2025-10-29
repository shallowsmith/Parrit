import { Router } from "express";
import type { Request, Response } from "express";
import { SpendingHistoryService } from '../services/SpendingHistoryService';
import { SpendingQuerySchema, MonthlyTrendsQuerySchema } from '../models/SpendingHistory';
import { authenticateToken, requireSameUser } from '../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

const spendingHistoryService = new SpendingHistoryService();

/**
 * @swagger
 * /api/v1/users/{userId}/spending/summary:
 *   get:
 *     summary: Get aggregated spending summary by category
 *     description: Returns total spending per category with percentages for visualization (e.g., pie charts)
 *     tags: [Spending History]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (MongoDB ObjectId)
 *       - in: query
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           enum: [current_month, past_week, past_30_days, custom]
 *         description: Time period for spending analysis
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date (required if period is 'custom')
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date (required if period is 'custom')
 *     responses:
 *       200:
 *         description: Spending summary by category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 period:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 totalSpending:
 *                   type: number
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       categoryId:
 *                         type: string
 *                       categoryName:
 *                         type: string
 *                       categoryType:
 *                         type: string
 *                       totalAmount:
 *                         type: number
 *                       transactionCount:
 *                         type: number
 *                       percentage:
 *                         type: number
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/summary", authenticateToken, requireSameUser('userId'), async (req: Request, res: Response) => {
  try {
    // Get userId from path parameter
    const userId = req.params.userId;

    // Validate query parameters
    const queryValidation = SpendingQuerySchema.safeParse(req.query);

    if (!queryValidation.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: queryValidation.error.issues
      });
    }

    const query = queryValidation.data;

    // Get spending summary from service
    const summary = await spendingHistoryService.getSummary(userId, query);

    // Return successful response
    res.json(summary);
  } catch (error) {
    console.error('Error fetching spending summary:', error);

    // Handle specific errors
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    // Generic server error
    res.status(500).json({ error: 'Failed to fetch spending summary' });
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}/spending/detailed:
 *   get:
 *     summary: Get detailed spending report with all transactions grouped by category
 *     description: Returns all transactions grouped by category for export or detailed analysis
 *     tags: [Spending History]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (MongoDB ObjectId)
 *       - in: query
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           enum: [current_month, past_week, past_30_days, custom]
 *         description: Time period for spending analysis
 *       - in: query
 *         name: startDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date (required if period is 'custom')
 *       - in: query
 *         name: endDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date (required if period is 'custom')
 *     responses:
 *       200:
 *         description: Detailed spending report with transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 period:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 totalSpending:
 *                   type: number
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       categoryId:
 *                         type: string
 *                       categoryName:
 *                         type: string
 *                       categoryType:
 *                         type: string
 *                       totalAmount:
 *                         type: number
 *                       transactionCount:
 *                         type: number
 *                       transactions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             vendorName:
 *                               type: string
 *                             description:
 *                               type: string
 *                             dateTime:
 *                               type: string
 *                               format: date-time
 *                             amount:
 *                               type: number
 *                             paymentType:
 *                               type: string
 *                             receiptId:
 *                               type: string
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/detailed", authenticateToken, requireSameUser('userId'), async (req: Request, res: Response) => {
  try {
    // Get userId from path parameter
    const userId = req.params.userId;

    // Validate query parameters
    const queryValidation = SpendingQuerySchema.safeParse(req.query);

    if (!queryValidation.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: queryValidation.error.issues
      });
    }

    const query = queryValidation.data;

    // Get detailed report from service
    const report = await spendingHistoryService.getDetailedReport(userId, query);

    // Return successful response
    res.json(report);
  } catch (error) {
    console.error('Error fetching detailed spending report:', error);

    // Handle specific errors
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    // Generic server error
    res.status(500).json({ error: 'Failed to fetch detailed spending report' });
  }
});

/**
 * @swagger
 * /api/v1/users/{userId}/spending/monthly-trends:
 *   get:
 *     summary: Get monthly spending trends with current month total and comparison
 *     description: Returns current month spending, historical monthly breakdown, and percentage change comparison for trend visualization
 *     tags: [Spending History]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (MongoDB ObjectId)
 *       - in: query
 *         name: monthCount
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 24
 *           default: 6
 *         description: Number of previous months to analyze (default 6)
 *       - in: query
 *         name: includeCurrentMonth
 *         required: false
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Whether to include current month in response (default true)
 *     responses:
 *       200:
 *         description: Monthly spending trends
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 currentMonth:
 *                   type: object
 *                   properties:
 *                     month:
 *                       type: string
 *                       example: "October 2025"
 *                     totalAmount:
 *                       type: number
 *                       example: 2345
 *                     transactionCount:
 *                       type: number
 *                       example: 45
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                 trend:
 *                   type: object
 *                   properties:
 *                     percentageChange:
 *                       type: number
 *                       example: 12
 *                     direction:
 *                       type: string
 *                       enum: [increase, decrease, stable]
 *                       example: "increase"
 *                     comparisonPeriod:
 *                       type: string
 *                       example: "last 6 months"
 *                     previousMonthsAverage:
 *                       type: number
 *                       example: 2094.64
 *                 monthlyBreakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                         example: "September 2025"
 *                       year:
 *                         type: number
 *                         example: 2025
 *                       monthNumber:
 *                         type: number
 *                         example: 9
 *                       totalAmount:
 *                         type: number
 *                         example: 2100
 *                       transactionCount:
 *                         type: number
 *                         example: 52
 *                       startDate:
 *                         type: string
 *                         format: date-time
 *                       endDate:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/monthly-trends", authenticateToken, requireSameUser('userId'), async (req: Request, res: Response) => {
  try {
    // Get userId from path parameter
    const userId = req.params.userId;

    // Validate query parameters
    const queryValidation = MonthlyTrendsQuerySchema.safeParse(req.query);

    if (!queryValidation.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: queryValidation.error.issues
      });
    }

    const query = queryValidation.data;

    // Get monthly trends from service
    const trends = await spendingHistoryService.getMonthlyTrends(userId, query);

    // Return successful response
    res.json(trends);
  } catch (error) {
    console.error('Error fetching monthly spending trends:', error);

    // Handle specific errors
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }

    // Generic server error
    res.status(500).json({ error: 'Failed to fetch monthly spending trends' });
  }
});

export default router;
