import { TransactionRepository } from '../repositories/TransactionRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import type {
  SpendingQuery,
  SpendingSummaryResponse,
  CategorySpendingSummary,
  DetailedSpendingReport,
  CategoryTransactions,
  TransactionDetail,
  MonthlyTrendsQuery,
  MonthlyTrendsResponse,
  MonthlyBreakdown,
  CurrentMonthSummary,
  TrendData
} from '../models/SpendingHistory';
import type { Transaction } from '../models/Transaction';
import type { Category } from '../models/Category';

/**
 * Service class for Spending History business logic.
 *
 * Handles:
 * - Date range calculations based on period types
 * - Aggregated spending summaries by category
 * - Detailed spending reports with transaction listings
 * - Percentage calculations for visualization
 */
export class SpendingHistoryService {
  private transactionRepository: TransactionRepository;
  private categoryRepository: CategoryRepository;

  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.categoryRepository = new CategoryRepository();
  }

  /**
   * Calculates date range based on period type.
   *
   * @param {SpendingQuery} query - Query parameters
   * @returns {{ startDate: Date, endDate: Date, periodLabel: string }}
   */
  private calculateDateRange(query: SpendingQuery): { startDate: Date; endDate: Date; periodLabel: string } {
    const now = new Date();

    switch (query.period) {
      case 'current_month': {
        // First day of current month to now
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const endDate = new Date(now);
        return { startDate, endDate, periodLabel: 'Current Month' };
      }

      case 'past_week': {
        // 7 days ago to now
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(now);
        return { startDate, endDate, periodLabel: 'Past Week' };
      }

      case 'past_30_days': {
        // 30 days ago to now
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(now);
        return { startDate, endDate, periodLabel: 'Past 30 Days' };
      }

      case 'custom': {
        // User-provided date range
        if (!query.startDate || !query.endDate) {
          throw new Error('startDate and endDate are required for custom period');
        }
        const startDate = new Date(query.startDate);
        const endDate = new Date(query.endDate);

        // Set start to beginning of day, end to end of day
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        return { startDate, endDate, periodLabel: 'Custom Range' };
      }

      default:
        throw new Error(`Invalid period type: ${query.period}`);
    }
  }

  /**
   * Gets spending summary aggregated by category.
   * Includes percentage calculations for visualization.
   *
   * @param {string} userId - The user ID
   * @param {SpendingQuery} query - Query parameters
   * @returns {Promise<SpendingSummaryResponse>} Aggregated spending data
   */
  async getSummary(userId: string, query: SpendingQuery): Promise<SpendingSummaryResponse> {
    // Calculate date range
    const { startDate, endDate, periodLabel } = this.calculateDateRange(query);

    // Get aggregated data from repository
    const aggregatedData = await this.transactionRepository.aggregateByCategory(
      userId,
      startDate,
      endDate
    );

    // Calculate total spending across all categories
    const totalSpending = aggregatedData.reduce((sum, item) => sum + item.totalAmount, 0);

    // Fetch category details and build summary
    const categories: CategorySpendingSummary[] = [];

    for (const item of aggregatedData) {
      // Get category details
      const category = await this.categoryRepository.findCategoryById(item.categoryId);

      if (category) {
        // Calculate percentage of total spending
        const percentage = totalSpending > 0
          ? (item.totalAmount / totalSpending) * 100
          : 0;

        categories.push({
          categoryId: item.categoryId,
          categoryName: category.name,
          categoryType: category.type,
          totalAmount: item.totalAmount,
          transactionCount: item.transactionCount,
          percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
        });
      }
    }

    return {
      userId,
      period: periodLabel,
      startDate,
      endDate,
      totalSpending,
      categories,
    };
  }

  /**
   * Gets detailed spending report with all transactions grouped by category.
   * Used for export or detailed analysis.
   *
   * @param {string} userId - The user ID
   * @param {SpendingQuery} query - Query parameters
   * @returns {Promise<DetailedSpendingReport>} Detailed spending data with transactions
   */
  async getDetailedReport(userId: string, query: SpendingQuery): Promise<DetailedSpendingReport> {
    // Calculate date range
    const { startDate, endDate, periodLabel } = this.calculateDateRange(query);

    // Get all transactions for the user within date range
    const transactions = await this.transactionRepository.findByUserIdAndDateRange(
      userId,
      startDate,
      endDate
    );

    // Get all categories for this user
    const allCategories = await this.categoryRepository.findAllCategories();
    const categoryMap = new Map<string, Category>();
    allCategories.forEach(cat => categoryMap.set(cat.id, cat));

    // Group transactions by category
    const categoryGroups = new Map<string, Transaction[]>();

    for (const transaction of transactions) {
      if (!categoryGroups.has(transaction.categoryId)) {
        categoryGroups.set(transaction.categoryId, []);
      }
      categoryGroups.get(transaction.categoryId)!.push(transaction);
    }

    // Build detailed report
    const categories: CategoryTransactions[] = [];
    let totalSpending = 0;

    for (const [categoryId, categoryTransactions] of categoryGroups) {
      const category = categoryMap.get(categoryId);

      if (category) {
        // Calculate category total
        const categoryTotal = categoryTransactions.reduce(
          (sum, t) => sum + t.amount,
          0
        );

        totalSpending += categoryTotal;

        // Map transactions to detail format
        const transactionDetails: TransactionDetail[] = categoryTransactions.map(t => ({
          id: t.id,
          vendorName: t.vendorName,
          description: t.description,
          dateTime: t.dateTime,
          amount: t.amount,
          paymentType: t.paymentType,
          receiptId: t.receiptId,
        }));

        categories.push({
          categoryId,
          categoryName: category.name,
          categoryType: category.type,
          totalAmount: categoryTotal,
          transactionCount: categoryTransactions.length,
          transactions: transactionDetails,
        });
      }
    }

    // Sort categories by total amount descending
    categories.sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      userId,
      period: periodLabel,
      startDate,
      endDate,
      totalSpending,
      categories,
    };
  }

  /**
   * Gets month boundaries (first and last moment of a month).
   *
   * @param {Date} date - Any date within the month
   * @returns {{ startDate: Date, endDate: Date }}
   */
  private getMonthBoundaries(date: Date): { startDate: Date; endDate: Date } {
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { startDate, endDate };
  }

  /**
   * Formats a date as a month label (e.g., "January 2025").
   *
   * @param {Date} date - The date to format
   * @returns {string} Formatted month label
   */
  private formatMonthLabel(date: Date): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }

  /**
   * Gets an array of month date ranges for the last N months (excluding current month).
   *
   * @param {number} count - Number of previous months to get
   * @returns {Array<{ year: number, month: number, startDate: Date, endDate: Date }>}
   */
  private getLastNMonths(count: number): Array<{
    year: number;
    month: number;
    startDate: Date;
    endDate: Date;
  }> {
    const months = [];
    const now = new Date();

    for (let i = 1; i <= count; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const { startDate, endDate } = this.getMonthBoundaries(date);

      months.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1, // 1-12
        startDate,
        endDate,
      });
    }

    return months.reverse(); // Return oldest to newest
  }

  /**
   * Gets monthly spending trends with current month total and comparison.
   *
   * @param {string} userId - The user ID
   * @param {MonthlyTrendsQuery} query - Query parameters
   * @returns {Promise<MonthlyTrendsResponse>} Monthly trends data
   */
  async getMonthlyTrends(userId: string, query: MonthlyTrendsQuery): Promise<MonthlyTrendsResponse> {
    const { monthCount, includeCurrentMonth } = query;

    // Get current month data
    const now = new Date();
    const currentMonthBoundaries = this.getMonthBoundaries(now);
    const currentMonthLabel = this.formatMonthLabel(now);

    // Fetch current month transactions
    const currentMonthTransactions = await this.transactionRepository.findByUserIdAndDateRange(
      userId,
      currentMonthBoundaries.startDate,
      currentMonthBoundaries.endDate
    );

    const currentMonthTotal = currentMonthTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    const currentMonthSummary: CurrentMonthSummary = {
      month: currentMonthLabel,
      totalAmount: currentMonthTotal,
      transactionCount: currentMonthTransactions.length,
      startDate: currentMonthBoundaries.startDate,
      endDate: currentMonthBoundaries.endDate,
    };

    // Get previous months data
    const previousMonths = this.getLastNMonths(monthCount);

    // Calculate date range for aggregation
    const aggregationStartDate = previousMonths[0].startDate;
    const aggregationEndDate = previousMonths[previousMonths.length - 1].endDate;

    // Fetch monthly aggregated data from repository
    const monthlyData = await this.transactionRepository.aggregateByMonth(
      userId,
      aggregationStartDate,
      aggregationEndDate
    );

    // Create a map for quick lookup
    const monthlyDataMap = new Map(
      monthlyData.map(item => [`${item.year}-${item.month}`, item])
    );

    // Build monthly breakdown with all months (including months with no transactions)
    const monthlyBreakdown: MonthlyBreakdown[] = previousMonths.map(monthInfo => {
      const key = `${monthInfo.year}-${monthInfo.month}`;
      const data = monthlyDataMap.get(key);
      const date = new Date(monthInfo.year, monthInfo.month - 1, 1);

      return {
        month: this.formatMonthLabel(date),
        year: monthInfo.year,
        monthNumber: monthInfo.month,
        totalAmount: data?.totalAmount ?? 0,
        transactionCount: data?.transactionCount ?? 0,
        startDate: monthInfo.startDate,
        endDate: monthInfo.endDate,
      };
    });

    // Calculate trend comparison
    const previousMonthsTotals = monthlyBreakdown.map(m => m.totalAmount);
    const previousMonthsSum = previousMonthsTotals.reduce((sum, amount) => sum + amount, 0);
    const previousMonthsAverage = previousMonthsSum / monthCount;

    // Calculate percentage change
    let percentageChange = 0;
    let direction: 'increase' | 'decrease' | 'stable' = 'stable';

    if (previousMonthsAverage > 0) {
      percentageChange = ((currentMonthTotal - previousMonthsAverage) / previousMonthsAverage) * 100;

      // Round to 2 decimal places
      percentageChange = Math.round(percentageChange * 100) / 100;

      if (percentageChange > 1) {
        direction = 'increase';
      } else if (percentageChange < -1) {
        direction = 'decrease';
      }
    }

    const trendData: TrendData = {
      percentageChange,
      direction,
      comparisonPeriod: `last ${monthCount} months`,
      previousMonthsAverage: Math.round(previousMonthsAverage * 100) / 100,
    };

    return {
      userId,
      currentMonth: currentMonthSummary,
      trend: trendData,
      monthlyBreakdown,
    };
  }
}
