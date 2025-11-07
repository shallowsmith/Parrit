import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as d3 from 'd3-shape';
import { AppColors } from '@/constants/theme';

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'ytd';
type DataPoint = { id: string; label: string; amount: number };

// Mock spending history data - replace with API call later
const MOCK_SPENDING_DATA = {
  daily: Array.from({ length: 24 }, (_, i) => ({
    id: `${i}`,
    label: `${i}:00`,
    amount: 20 + Math.random() * 80 + Math.sin(i / 4) * 30,
  })),
  weekly: Array.from({ length: 30 }, (_, i) => ({
    id: `${i}`,
    label: `Day ${i + 1}`,
    amount: 300 + Math.random() * 400 + Math.sin(i / 5) * 150,
  })),
  monthly: Array.from({ length: 30 }, (_, i) => ({
    id: `${i}`,
    label: `Day ${i + 1}`,
    amount: 800 + Math.random() * 1000 + Math.sin(i / 6) * 400,
  })),
  ytd: Array.from({ length: 50 }, (_, i) => ({
    id: `${i}`,
    label: `Week ${i + 1}`,
    amount: 1000 + Math.random() * 800 + Math.sin(i / 8) * 500,
  })),
};

export const SpendingHistoryChart: React.FC = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');

  // Get data based on selected time period
  const spendingData = MOCK_SPENDING_DATA[timePeriod];

  // Calculate stats
  const { maxAmount, totalSpending, percentChange } = useMemo(() => {
    const max = Math.max(...spendingData.map(item => item.amount));
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
          {spendingData.length > 1 && (() => {
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
});

