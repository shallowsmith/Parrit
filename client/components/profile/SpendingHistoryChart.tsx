import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as d3 from 'd3-shape';
import { AppColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { transactionService, Transaction } from '@/services/transaction.service';

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'ytd';
type DataPoint = { id: string; label: string; amount: number };

export const SpendingHistoryChart: React.FC = () => {
  const { profile } = useAuth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions when component mounts or time period changes
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!profile?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const allTransactions = await transactionService.getTransactions(profile.id);
        
        // Filter transactions based on time period
        const now = new Date();
        let startDate: Date;

        switch (timePeriod) {
          case 'daily':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'weekly':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'monthly':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 30);
            break;
          case 'ytd':
            startDate = new Date(now.getFullYear(), 0, 1); // January 1st of current year
            break;
        }

        const filtered = allTransactions.filter(t => {
          // API returns dates as strings, convert to Date
          const transactionDate = new Date(t.dateTime);
          return transactionDate >= startDate && transactionDate <= now;
        });

        setTransactions(filtered);
      } catch (err: any) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load spending data');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [profile?.id, timePeriod]);

  // Transform transactions into chart data points based on time period
  const spendingData = useMemo(() => {
    if (transactions.length === 0) {
      return [];
    }

    const now = new Date();
    let buckets: Map<string, number> = new Map();
    let labels: Map<string, string> = new Map();

    switch (timePeriod) {
      case 'daily': {
        // Group by hour (last 24 hours)
        for (let i = 0; i < 24; i++) {
          buckets.set(`${i}`, 0);
          labels.set(`${i}`, `${i}:00`);
        }
        
        for (const t of transactions) {
          const date = new Date(t.dateTime);
          const hour = date.getHours();
          const current = buckets.get(`${hour}`) || 0;
          buckets.set(`${hour}`, current + t.amount);
        }
        break;
      }

      case 'weekly': {
        // Group by day (last 7 days)
        for (let i = 0; i < 7; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - (6 - i));
          const dayKey = date.toISOString().split('T')[0];
          buckets.set(dayKey, 0);
          labels.set(dayKey, date.toLocaleDateString('en-US', { weekday: 'short' }));
        }
        
        for (const t of transactions) {
          const date = new Date(t.dateTime);
          const dayKey = date.toISOString().split('T')[0];
          const current = buckets.get(dayKey) || 0;
          buckets.set(dayKey, current + t.amount);
        }
        break;
      }

      case 'monthly': {
        // Group by day (last 30 days)
        for (let i = 0; i < 30; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - (29 - i));
          const dayKey = date.toISOString().split('T')[0];
          buckets.set(dayKey, 0);
          labels.set(dayKey, `${date.getDate()}`);
        }
        
        for (const t of transactions) {
          const date = new Date(t.dateTime);
          const dayKey = date.toISOString().split('T')[0];
          const current = buckets.get(dayKey) || 0;
          buckets.set(dayKey, current + t.amount);
        }
        break;
      }

      case 'ytd': {
        // Group by week (year to date)
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const weeksSinceStart = Math.floor((now.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const maxWeeks = Math.min(weeksSinceStart + 1, 52);
        
        for (let i = 0; i < maxWeeks; i++) {
          const weekStart = new Date(yearStart);
          weekStart.setDate(weekStart.getDate() + (i * 7));
          buckets.set(`${i}`, 0);
          labels.set(`${i}`, `W${i + 1}`);
        }
        
        for (const t of transactions) {
          const date = new Date(t.dateTime);
          const weekNumber = Math.floor((date.getTime() - yearStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
          if (weekNumber >= 0 && weekNumber < maxWeeks) {
            const current = buckets.get(`${weekNumber}`) || 0;
            buckets.set(`${weekNumber}`, current + t.amount);
          }
        }
        break;
      }
    }

    // Convert buckets to data points
    const dataPoints: DataPoint[] = Array.from(buckets.entries())
      .sort(([a], [b]) => {
        if (timePeriod === 'daily' || timePeriod === 'ytd') {
          return Number(a) - Number(b);
        }
        return a.localeCompare(b);
      })
      .map(([key, amount], index) => ({
        id: key,
        label: labels.get(key) || key,
        amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
      }));

    return dataPoints;
  }, [transactions, timePeriod]);

  // Calculate stats
  const { maxAmount, totalSpending, percentChange } = useMemo(() => {
    if (spendingData.length === 0) {
      return { maxAmount: 0, totalSpending: 0, percentChange: 0 };
    }

    const amounts = spendingData.map(item => item.amount);
    const max = Math.max(...amounts);
    const total = spendingData.reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate percentage change (comparing first half to second half)
    const midPoint = Math.floor(spendingData.length / 2);
    const firstHalf = spendingData.slice(0, midPoint);
    const secondHalf = spendingData.slice(midPoint);
    
    const firstHalfTotal = firstHalf.reduce((sum, item) => sum + item.amount, 0);
    const secondHalfTotal = secondHalf.reduce((sum, item) => sum + item.amount, 0);
    
    const change = firstHalfTotal > 0 
      ? ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100 
      : 0;
    
    return { maxAmount: max, totalSpending: total, percentChange: change };
  }, [spendingData]);

  // Get subtitle text based on time period
  const getSubtitle = () => {
    switch (timePeriod) {
      case 'daily': return 'Last 24 hours';
      case 'weekly': return 'Last 7 days';
      case 'monthly': return 'Last 30 days';
      case 'ytd': return 'Year to date';
    }
  };

  const isPositive = percentChange >= 0;
  const percentChangeText = `${isPositive ? '+' : ''}${percentChange.toFixed(1)}%`;

  // Render time period selector (reusable component)
  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      <TouchableOpacity
        style={[styles.periodButton, timePeriod === 'daily' && styles.periodButtonActive]}
        onPress={() => setTimePeriod('daily')}
      >
        <Text style={[styles.periodButtonText, timePeriod === 'daily' && styles.periodButtonTextActive]}>
          1D
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.periodButton, timePeriod === 'weekly' && styles.periodButtonActive]}
        onPress={() => setTimePeriod('weekly')}
      >
        <Text style={[styles.periodButtonText, timePeriod === 'weekly' && styles.periodButtonTextActive]}>
          1W
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.periodButton, timePeriod === 'monthly' && styles.periodButtonActive]}
        onPress={() => setTimePeriod('monthly')}
      >
        <Text style={[styles.periodButtonText, timePeriod === 'monthly' && styles.periodButtonTextActive]}>
          1M
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.periodButton, timePeriod === 'ytd' && styles.periodButtonActive]}
        onPress={() => setTimePeriod('ytd')}
      >
        <Text style={[styles.periodButtonText, timePeriod === 'ytd' && styles.periodButtonTextActive]}>
          YTD
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Show loading state
  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.widgetHeader}>
          <Text style={styles.widgetTitle}>Spending History</Text>
          <Text style={styles.widgetSubtitle}>{getSubtitle()}</Text>
        </View>

        {/* Stats Row - Placeholder */}
        <View style={styles.statsRow}>
          <Text style={styles.statText}>
            <Text style={styles.statLabel}>Total: </Text>
            <Text style={styles.statValue}>--</Text>
          </Text>
        </View>

        {/* Placeholder Chart */}
        <View style={styles.lineChartContainer}>
          <Svg height="220" width="100%" style={styles.svgChart}>
            <Defs>
              <LinearGradient id="chartGradientPlaceholder" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={AppColors.primary} stopOpacity="0.1" />
                <Stop offset="100%" stopColor={AppColors.primary} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            {/* Empty placeholder - maintains height */}
            <Path
              d={`M 0 220 L ${Dimensions.get('window').width - 80} 220`}
              fill="none"
              stroke={AppColors.primary}
              strokeWidth="2"
              strokeOpacity="0.2"
              strokeDasharray="5,5"
            />
          </Svg>
          {/* Loading indicator overlay */}
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <Text style={styles.loadingText}>Loading spending data...</Text>
          </View>
        </View>

        {/* Time Period Selector */}
        {renderPeriodSelector()}
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.card}>
        <View style={styles.widgetHeader}>
          <Text style={styles.widgetTitle}>Spending History</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
        {renderPeriodSelector()}
      </View>
    );
  }

  // Show empty state
  if (spendingData.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.widgetHeader}>
          <Text style={styles.widgetTitle}>Spending History</Text>
          <Text style={styles.widgetSubtitle}>{getSubtitle()}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No spending data available for this period</Text>
          <Text style={styles.emptySubtext}>Create some transactions to see your spending history</Text>
        </View>
        {renderPeriodSelector()}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.widgetHeader}>
        <Text style={styles.widgetTitle}>Spending History</Text>
        <View style={styles.subtitleRow}>
          <Text style={styles.widgetSubtitle}>{getSubtitle()} </Text>
          <Text style={[styles.percentChange, isPositive ? styles.percentUp : styles.percentDown]}>
            {percentChangeText}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Text style={styles.statText}>
          <Text style={styles.statLabel}>Total: </Text>
          <Text style={styles.statValue}>${totalSpending.toLocaleString()}</Text>
        </Text>
      </View>

      {/* Line Chart */}
      <View style={styles.lineChartContainer}>
        <Svg height="220" width="100%" style={styles.svgChart}>
          {/* Gradient Definition */}
          <Defs>
            <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={AppColors.primary} stopOpacity="0.4" />
              <Stop offset="100%" stopColor={AppColors.primary} stopOpacity="0" />
            </LinearGradient>
          </Defs>

          {/* D3 smooth area and line */}
          {spendingData.length > 1 && maxAmount > 0 && (() => {
            const screenWidth = Dimensions.get('window').width - 80; // Account for padding
            
            // Create d3 area generator for the gradient fill
            const areaGenerator = d3.area<DataPoint>()
              .x((d, i) => (i / (spendingData.length - 1)) * screenWidth)
              .y0(220) // Bottom of the chart
              .y1((d) => 220 - ((d.amount / maxAmount) * 200) - 10)
              .curve(d3.curveMonotoneX);
            
            // Create d3 line generator for the stroke
            const lineGenerator = d3.line<DataPoint>()
              .x((d, i) => (i / (spendingData.length - 1)) * screenWidth)
              .y((d) => 220 - ((d.amount / maxAmount) * 200) - 10)
              .curve(d3.curveMonotoneX);
            
            const areaData = areaGenerator(spendingData);
            const lineData = lineGenerator(spendingData);
            
            return (
              <>
                {/* Gradient fill area */}
                <Path
                  d={areaData || ''}
                  fill="url(#chartGradient)"
                />
                {/* Line stroke */}
                <Path
                  d={lineData || ''}
                  fill="none"
                  stroke={AppColors.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            );
          })()}
        </Svg>
      </View>

      {/* Time Period Selector */}
      {renderPeriodSelector()}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  widgetHeader: {
    marginBottom: 20,
  },
  widgetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.text,
    marginBottom: 4,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  widgetSubtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  percentChange: {
    fontSize: 13,
    fontWeight: '600',
  },
  percentUp: {
    color: '#10b981', // Green
  },
  percentDown: {
    color: '#ef4444', // Red
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 16,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: AppColors.primary,
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.textSecondary,
  },
  periodButtonTextActive: {
    color: AppColors.text,
    fontWeight: '600',
  },
  statsRow: {
    marginBottom: 16,
  },
  statText: {
    fontSize: 14,
  },
  statLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.text,
  },
  lineChartContainer: {
    marginTop: 20,
    marginBottom: 8,
  },
  svgChart: {
    marginBottom: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surface,
    opacity: 0.9,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: AppColors.textSecondary,
    textAlign: 'center',
    opacity: 0.7,
  },
});

