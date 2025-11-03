import { z } from 'zod';

/**
 * Query parameter schema for spending history endpoints
 */
export const SpendingQuerySchema = z.object({
  period: z.enum(['current_month', 'past_week', 'past_30_days', 'custom']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine(
  (data) => {
    // If period is custom, both startDate and endDate are required
    if (data.period === 'custom') {
      return data.startDate !== undefined && data.endDate !== undefined;
    }
    return true;
  },
  {
    message: 'startDate and endDate are required when period is "custom"',
  }
).refine(
  (data) => {
    // If both dates are provided, startDate must be before endDate
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'startDate must be before or equal to endDate',
  }
);

export type SpendingQuery = z.infer<typeof SpendingQuerySchema>;

/**
 * Category spending summary for aggregated view
 */
export const CategorySpendingSummarySchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  categoryType: z.string(),
  totalAmount: z.number(),
  transactionCount: z.number(),
  percentage: z.number(), // Percentage of total spending
});

export type CategorySpendingSummary = z.infer<typeof CategorySpendingSummarySchema>;

/**
 * Response schema for spending summary endpoint
 */
export const SpendingSummaryResponseSchema = z.object({
  userId: z.string(),
  period: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  totalSpending: z.number(),
  categories: z.array(CategorySpendingSummarySchema),
});

export type SpendingSummaryResponse = z.infer<typeof SpendingSummaryResponseSchema>;

/**
 * Transaction detail for detailed report
 */
export const TransactionDetailSchema = z.object({
  id: z.string(),
  vendorName: z.string(),
  description: z.string(),
  dateTime: z.date(),
  amount: z.number(),
  paymentType: z.string(),
  receiptId: z.string().optional(),
});

export type TransactionDetail = z.infer<typeof TransactionDetailSchema>;

/**
 * Category with transactions for detailed report
 */
export const CategoryTransactionsSchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  categoryType: z.string(),
  totalAmount: z.number(),
  transactionCount: z.number(),
  transactions: z.array(TransactionDetailSchema),
});

export type CategoryTransactions = z.infer<typeof CategoryTransactionsSchema>;

/**
 * Response schema for detailed spending report endpoint
 */
export const DetailedSpendingReportSchema = z.object({
  userId: z.string(),
  period: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  totalSpending: z.number(),
  categories: z.array(CategoryTransactionsSchema),
});

export type DetailedSpendingReport = z.infer<typeof DetailedSpendingReportSchema>;

/**
 * Query parameter schema for monthly trends endpoint
 */
export const MonthlyTrendsQuerySchema = z.object({
  monthCount: z.coerce.number().int().min(1).max(24).default(6),
  includeCurrentMonth: z.coerce.boolean().default(true),
});

export type MonthlyTrendsQuery = z.infer<typeof MonthlyTrendsQuerySchema>;

/**
 * Monthly breakdown data for a single month
 */
export const MonthlyBreakdownSchema = z.object({
  month: z.string(), // e.g., "January 2025"
  year: z.number(),
  monthNumber: z.number(), // 1-12
  totalAmount: z.number(),
  transactionCount: z.number(),
  startDate: z.date(),
  endDate: z.date(),
});

export type MonthlyBreakdown = z.infer<typeof MonthlyBreakdownSchema>;

/**
 * Current month summary
 */
export const CurrentMonthSummarySchema = z.object({
  month: z.string(),
  totalAmount: z.number(),
  transactionCount: z.number(),
  startDate: z.date(),
  endDate: z.date(),
});

export type CurrentMonthSummary = z.infer<typeof CurrentMonthSummarySchema>;

/**
 * Trend comparison data
 */
export const TrendDataSchema = z.object({
  percentageChange: z.number(),
  direction: z.enum(['increase', 'decrease', 'stable']),
  comparisonPeriod: z.string(), // e.g., "last 6 months"
  previousMonthsAverage: z.number(),
});

export type TrendData = z.infer<typeof TrendDataSchema>;

/**
 * Response schema for monthly trends endpoint
 */
export const MonthlyTrendsResponseSchema = z.object({
  userId: z.string(),
  currentMonth: CurrentMonthSummarySchema,
  trend: TrendDataSchema,
  monthlyBreakdown: z.array(MonthlyBreakdownSchema),
});

export type MonthlyTrendsResponse = z.infer<typeof MonthlyTrendsResponseSchema>;
