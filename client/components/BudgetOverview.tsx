import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import BudgetDonut from '@/components/BudgetDonut';
import TransactionsList from '@/components/TransactionsList';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import budgetService from '@/services/budget.service';
import transactionService from '@/services/transaction.service';
import { on, off } from '@/utils/events';

// Category -> colors for each differnt category
const CATEGORY_COLORS: Record<string, string> = {
  food: '#10B981', // green
  rent: '#EF4444', // red
  utilities: '#3B82F6', // blue
  transportation: '#F59E0B', // amber
  entertainment: '#8B5CF6', // purple
  travel: '#06B6D4', // teal
  gift: '#EC4899', // pink
  misc: '#ffe100ff', // yellow
};

const FALLBACK_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#A78BFA', '#F97316'];

export default function BudgetOverview() {
  const { profile } = useAuth();
  const [budget, setBudget] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    let mounted = true;
    Promise.all([
      budgetService.getBudgets(profile.id),
      transactionService.getTransactions(profile.id),
    ])
      .then(([bRes, tRes]) => {
        if (!mounted) return;
        const budgets = bRes.data || [];
        // pick the most recent budget
        const chosen = budgets.length ? budgets[0] : null;
        setBudget(chosen);

        const txs = Array.isArray(tRes.data) ? tRes.data : [];
        setTransactions(txs);
  setSelectedGroup(null);
      })
      .catch((err) => {
        console.error('Failed to load budgets/transactions', err);
      })
      .finally(() => setLoading(false));
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    const handler = () => {
      Promise.all([budgetService.getBudgets(profile.id), transactionService.getTransactions(profile.id)])
        .then(([bRes, tRes]) => {
          const budgets = bRes.data || [];
          const chosen = budgets.length ? budgets[0] : null;
          setBudget(chosen);
          const txs = Array.isArray(tRes.data) ? tRes.data : [];
          setTransactions(txs);
        })
        .catch((err) => console.error('Failed to refresh budgets/transactions', err));
    };

    const unsubscribe = on('transactions:changed', handler);
    return () => { unsubscribe(); };
  }, [profile?.id]);

  const totalSpent = useMemo(() => transactions.reduce((s, t) => s + (t.amount || 0), 0), [transactions]);

  // Group transactions by categoryId or if undefined then make it misc
  const grouped = useMemo(() => {
    const m = new Map<string, { key: string; label: string; total: number; txs: any[] }>();
    transactions.forEach((tx) => {
      const key = tx.categoryId || 'misc';
      const label = tx.categoryId || tx.vendorName || 'Misc';
      const existing = m.get(key);
      const amt = Math.abs(tx.amount || 0);
      if (existing) {
        existing.total += amt;
        existing.txs.push(tx);
      } else {
        m.set(key, { key, label, total: amt, txs: [tx] });
      }
    });
    return Array.from(m.values());
  }, [transactions]);

  const totalBudget = budget?.amount ?? 0;
  const remaining = budget?.remaining ?? Math.max(0, totalBudget - totalSpent);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.leftBox}>
          <Text style={styles.smallText}>Total Budget</Text>
          <Text style={styles.largeText}>${totalBudget.toFixed(2)}</Text>
        </View>
        <View style={styles.rightBox}>
          <Text style={styles.smallText}>Remaining</Text>
          <Text style={[styles.largeText, { color: remaining < 0 ? '#EF4444' : '#10B981' }]}>${remaining.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.wheelRow}>
        <View style={styles.wheelContainer}>
          {/* Donut chart (separate widget) */}
          <View style={styles.svgWrapper}>
            <BudgetDonut grouped={grouped} selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup} totalSpent={totalSpent} />
          </View>
        </View>

        {/* Transactions list (separate widget) */}
        <TransactionsList transactions={transactions} onSelectTransaction={() => setSelectedGroup(null)} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, marginBottom: 12, backgroundColor: '#0f172a', borderRadius: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  leftBox: { flex: 1 },
  rightBox: { flex: 1, alignItems: 'flex-end' },
  smallText: { color: '#9CA3AF', fontSize: 12 },
  largeText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  wheelRow: { flexDirection: 'column', alignItems: 'center', gap: 12 },
  wheelContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#0ea5a7' },
  centerAmount: { color: '#fff', fontSize: 20, fontWeight: '700' },
  centerLabel: { color: '#9CA3AF', fontSize: 12, marginTop: 6 },
  segmentRow: { width: '100%', marginTop: 12 },
  legendContainer: { width: '100%', alignItems: 'center' },
  legendStack: { width: '100%', alignItems: 'center' },
  legendItemVertical: { width: '86%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderLeftWidth: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', marginVertical: 6 },
  moreButton: { marginTop: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.02)' },
  moreText: { color: '#9CA3AF', fontSize: 12 },
  segment: { height: 48, borderRadius: 12, marginRight: 8, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  segmentText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  svgWrapper: { alignItems: 'center', justifyContent: 'center', width: 240, height: 240 },
  centerOverlay: { position: 'absolute', left: '50%', top: '50%', transform: [{ translateX: -70 }, { translateY: -40 }], width: 140, height: 120, alignItems: 'center', justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderLeftWidth: 6, borderRadius: 8, marginRight: 8, backgroundColor: 'rgba(255,255,255,0.03)' },
  legendAmount: { color: '#9CA3AF', fontSize: 12, marginLeft: 8 },
  transactionsContainer: { width: '100%', marginTop: 8 },
  dateHeader: { color: '#9CA3AF', fontSize: 12, marginBottom: 8 },
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0b1220', borderRadius: 12, padding: 12, marginBottom: 8 },
  txAccent: { width: 6, height: '100%', borderRadius: 8, marginRight: 12 },
  txContent: { flex: 1 },
  txVendor: { color: '#fff', fontSize: 16, fontWeight: '700' },
  txSubtitle: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
  txRight: { alignItems: 'flex-end', marginLeft: 12 },
  txAmount: { color: '#fff', fontSize: 16, fontWeight: '700' },
  txTime: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
});
