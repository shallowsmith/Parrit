import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Button, Alert } from 'react-native';
import BudgetDonut from '@/components/BudgetDonut';
import TransactionsList from '@/components/TransactionsList';
import TransactionFilter from '@/components/TransactionFilter';
import { normalizeCategoryKey } from '@/constants/categoryColors';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import budgetService from '@/services/budget.service';
import transactionService from '@/services/transaction.service';
import categoryService from '@/services/category.service';
import { categoryServiceWritable } from '@/services/category.service';
import { on } from '@/utils/events';
import { emit } from '@/utils/events';


export default function BudgetOverview() {
  const { profile } = useAuth();
  const [budget, setBudget] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editVendor, setEditVendor] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategoryInput, setEditCategoryInput] = useState('');
  const [editBudgetModalVisible, setEditBudgetModalVisible] = useState(false);
  const [editBudgetAmount, setEditBudgetAmount] = useState('');
  const [editBudgetRemaining, setEditBudgetRemaining] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<{ startDate?: string; endDate?: string; categories?: string[] }>({});

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    let mounted = true;
    Promise.all([
      budgetService.getBudgets(profile.id),
      transactionService.getTransactions(profile.id),
      categoryService.getCategories(profile.id),
    ])
      .then(([bRes, tRes, cRes]) => {
        if (!mounted) return;
        const budgets = bRes.data || [];
        // pick the most recent budget
        const chosen = budgets.length ? budgets[0] : null;
        setBudget(chosen);

        const txs = Array.isArray(tRes.data) ? tRes.data : [];
        setTransactions(txs);
        const cats = Array.isArray(cRes.data) ? cRes.data : [];
        setCategories(cats);
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
      Promise.all([budgetService.getBudgets(profile.id), transactionService.getTransactions(profile.id), categoryService.getCategories(profile.id)])
        .then(([bRes, tRes, cRes]) => {
          const budgets = bRes.data || [];
          const chosen = budgets.length ? budgets[0] : null;
          setBudget(chosen);
          const txs = Array.isArray(tRes.data) ? tRes.data : [];
          setTransactions(txs);
          const cats = Array.isArray(cRes.data) ? cRes.data : [];
          setCategories(cats);
        })
        .catch((err) => console.error('Failed to refresh budgets/transactions', err));
    };

    const unsubscribeTx = on('transactions:changed', handler);
    const unsubscribeCat = on('categories:changed', handler);
    return () => { unsubscribeTx(); unsubscribeCat(); };
  }, [profile?.id]);

  // Handler when a transaction is selected from the list
  const handleSelectTransaction = (tx: any) => {
    setEditingTx(tx);
    setEditDescription(tx.description || '');
    setEditVendor(tx.vendorName || '');
    setEditAmount(String(tx.amount || ''));
    const cat = categories.find((c: any) => String(c.id) === String(tx.categoryId) || String(c._id) === String(tx.categoryId));
    setEditCategoryInput(cat ? (cat.name || String(cat.id || cat._id)) : String(tx.categoryId || ''));
    setEditModalVisible(true);
  };

  const resolveCategoryForEdit = async (rawInput: string) => {
    const raw = String(rawInput || '').trim();
    if (!raw) return 'misc';
    let found = categories.find((c: any) => String(c.id) === raw || String(c._id) === raw);
    if (found) return found.id || found._id;
    found = categories.find((c: any) => String(c.name || '').toLowerCase() === raw.toLowerCase());
    if (found) return found.id || found._id;
    if (profile?.id) {
      try {
        const capitalize = (s: string) => String(s || '').replace(/\b\w/g, (m) => m.toUpperCase()).trim();
        const createRes = await categoryServiceWritable.createCategory(profile.id, { name: capitalize(raw), type: 'expense', userId: profile.id });
        const created = createRes.data;
        try { emit('categories:changed'); } catch (e) { /* ignore */ }
        return created.id || created._id || raw;
      } catch (err: any) {
        if (err?.response?.status === 409) {
          try {
            const res = await categoryService.getCategories(profile.id);
            const cats = Array.isArray(res.data) ? res.data : [];
            const match = cats.find((c: any) => String(c.name || '').toLowerCase() === raw.toLowerCase());
            if (match) return match.id || match._id || raw;
          } catch (e) { /* fallthrough */ }
        }
        console.warn('Failed to create/find category', err);
      }
    }
    return 'misc';
  };

  const saveEditedTransaction = async () => {
    if (!editingTx) return;
    if (!profile?.id) { Alert.alert('Not signed in'); return; }
    const parsedAmount = Number(editAmount);
    if (!parsedAmount || parsedAmount <= 0) { Alert.alert('Invalid amount', 'Please enter a positive amount.'); return; }
    try {
      const resolvedCategoryId = await resolveCategoryForEdit(editCategoryInput || '');
      const payload: any = {
        vendorName: editVendor || 'Unknown',
        description: editDescription || '',
        amount: parsedAmount,
        categoryId: resolvedCategoryId || 'misc',
      };
      const txId = editingTx.id || editingTx._id;
      const res = await transactionService.updateTransaction(profile.id, txId, payload);
      // Update local state
      const updated = res.data || res;
      setTransactions(prev => prev.map(t => (String(t.id || t._id) === String(txId) ? updated : t)));
      try { emit('transactions:changed'); } catch (e) { /* ignore */ }
      setEditModalVisible(false);
      setEditingTx(null);
    } catch (err) {
      console.error('Failed to save edited transaction', err);
      const msg = (err as any)?.response?.data?.error || String(err);
      Alert.alert('Save failed', msg);
    }
  };

  const visibleTransactions = useMemo(() => {
    const all = transactions || [];
    let res = all.slice();
    if (filters.startDate) {
      const sd = new Date(filters.startDate).getTime();
      res = res.filter((t) => new Date(t.dateTime || t.createdAt || 0).getTime() >= sd);
    }
    if (filters.endDate) {
      const ed = new Date(filters.endDate);
      ed.setHours(23, 59, 59, 999);
      const ett = ed.getTime();
      res = res.filter((t) => new Date(t.dateTime || t.createdAt || 0).getTime() <= ett);
    }
    if (filters.categories && filters.categories.length) {
      res = res.filter((t) => {
        const key = String(t.categoryId || '').toLowerCase();
        return filters.categories!.some((cid) => {
          return String(cid) === String(t.categoryId) || String(cid) === String(t.categoryId || t.category || cid) || String(cid).toLowerCase() === String((t.categoryId || '').toLowerCase());
        });
      });
    }
    return res;
  }, [transactions, filters]);

  const totalSpent = useMemo(() => visibleTransactions.reduce((s, t) => s + (t.amount || 0), 0), [visibleTransactions]);

  const grouped = useMemo(() => {
    const m = new Map<string, { key: string; label: string; total: number; txs: any[] }>();
    const source = visibleTransactions || [];
    source.forEach((tx) => {
      const key = tx.categoryId || 'misc';
      const foundCat = categories.find((c: any) => String(c.id) === String(key) || String(c._id) === String(key));
      const capitalize = (s: string) => String(s || '').replace(/\b\w/g, (m) => m.toUpperCase()).trim();
      const label = foundCat ? (capitalize(foundCat.name || 'Misc')) : (tx.vendorName || 'Misc');
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
  }, [visibleTransactions, categories]);

  const totalBudget = budget?.amount ?? 0;
  // Always compute remaining from the budget total minus what has been spent so it stays in sync
  const remaining = Math.max(0, totalBudget - totalSpent);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.leftBox, { paddingVertical: 8 }]}
          activeOpacity={0.8}
          accessibilityRole="button"
          hitSlop={{ top: 12, left: 12, right: 12, bottom: 12 }}
          onPress={() => {
            setEditBudgetAmount(String(totalBudget || ''));
            setEditBudgetRemaining(String(remaining || ''));
            setEditBudgetModalVisible(true);
          }}
        >
          <Text style={styles.smallText}>Total Budget</Text>
          <Text style={styles.largeText}>${totalBudget.toFixed(2)}</Text>
        </TouchableOpacity>
        <View style={styles.rightBox}>
          <Text style={styles.smallText}>Remaining</Text>
          <Text style={[styles.largeText, { color: remaining < 0 ? '#EF4444' : '#10B981' }]}>${remaining.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.wheelRow}>
        <View style={styles.wheelContainer}>
          {/* Donut chart (separate widget) */}
          <View style={styles.svgWrapper}>
            <BudgetDonut grouped={grouped} selectedGroup={selectedGroup} setSelectedGroup={setSelectedGroup} totalSpent={totalSpent} categories={categories} />
          </View>
        </View>

        {/* Filter bar (below donut) */}
        <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8, marginBottom: 12 }}>
          <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={{ padding: 8, marginRight: 12 }}>
            <Text style={{ color: '#60A5FA' }}>Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setFilters({}); }} style={{ padding: 8 }}>
            <Text style={{ color: '#9CA3AF' }}>Clear Filters</Text>
          </TouchableOpacity>
        </View>

        <TransactionFilter
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          categories={categories}
          initial={{ startDate: filters.startDate, endDate: filters.endDate, categories: filters.categories }}
          onClear={() => { setFilters({}); }}
          onApply={(f) => { setFilters(f); }}
        />

        {/* Transactions list (separate widget) */}
  <TransactionsList transactions={visibleTransactions} onSelectTransaction={handleSelectTransaction} categories={categories} />

      {/* Edit transaction modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#051218', borderRadius: 12, padding: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Edit Transaction</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 6 }}>Vendor</Text>
            <TextInput value={editVendor} onChangeText={setEditVendor} style={{ backgroundColor: '#0b1220', color: '#fff', padding: 10, borderRadius: 8, marginBottom: 12 }} />
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 6 }}>Description</Text>
            <TextInput value={editDescription} onChangeText={setEditDescription} style={{ backgroundColor: '#0b1220', color: '#fff', padding: 10, borderRadius: 8, marginBottom: 12 }} />
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 6 }}>Amount</Text>
            <TextInput value={editAmount} onChangeText={setEditAmount} keyboardType="numeric" style={{ backgroundColor: '#0b1220', color: '#fff', padding: 10, borderRadius: 8, marginBottom: 12 }} />
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 6 }}>Category (name or id)</Text>
            <TextInput value={editCategoryInput} onChangeText={setEditCategoryInput} placeholder="e.g. Groceries" style={{ backgroundColor: '#0b1220', color: '#fff', padding: 10, borderRadius: 8, marginBottom: 12 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => { setEditModalVisible(false); setEditingTx(null); }} style={{ padding: 10, marginRight: 8 }}>
                <Text style={{ color: '#9CA3AF' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                if (!editingTx) return;
                const txId = editingTx.id || editingTx._id;
                Alert.alert('Delete transaction', 'Are you sure you want to delete this transaction? This action cannot be undone.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                      if (!profile?.id) { Alert.alert('Not signed in'); return; }
                      await transactionService.deleteTransaction(profile.id, txId);
                      // remove locally and emit
                      setTransactions(prev => prev.filter(t => String(t.id || t._id) !== String(txId)));
                      try { emit('transactions:changed'); } catch (e) { /* ignore */ }
                      setEditModalVisible(false);
                      setEditingTx(null);
                    } catch (err) {
                      console.error('Failed to delete transaction', err);
                      const msg = (err as any)?.response?.data?.error || String(err);
                      Alert.alert('Delete failed', msg);
                    }
                  } }
                ]);
              }} style={{ padding: 10, marginRight: 8 }}>
                <Text style={{ color: '#EF4444' }}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEditedTransaction} style={{ padding: 10, backgroundColor: '#0ea5a7', borderRadius: 8 }}>
                <Text style={{ color: '#fff' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Budget edit modal */}
      <Modal visible={editBudgetModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#051218', borderRadius: 12, padding: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Edit Budget</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 6 }}>Total amount</Text>
            <TextInput value={editBudgetAmount} onChangeText={setEditBudgetAmount} keyboardType="numeric" style={{ backgroundColor: '#0b1220', color: '#fff', padding: 10, borderRadius: 8, marginBottom: 12 }} />
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 6 }}>Remaining / Balance</Text>
            <View style={{ backgroundColor: '#0b1220', padding: 10, borderRadius: 8, marginBottom: 12 }}>
              <Text style={{ color: '#fff' }}>{editBudgetRemaining}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => { setEditBudgetModalVisible(false); }} style={{ padding: 10, marginRight: 8 }}>
                <Text style={{ color: '#9CA3AF' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                const parsedAmount = Number(editBudgetAmount);
                if (isNaN(parsedAmount)) { Alert.alert('Invalid input'); return; }
                try {
                  if (profile?.id) {
                    if (budget && (budget.id || budget._id)) {
                      const bid = budget.id || budget._id;
                      const remainingCalc = Math.max(0, parsedAmount - totalSpent);
                      const res = await budgetService.updateBudget(profile.id, bid, { amount: parsedAmount, remaining: remainingCalc });
                      const updated = res.data || res;
                      setBudget(updated);
                    } else {
                      const now = new Date();
                      const month = now.toLocaleString(undefined, { month: 'long' });
                      const year = now.getFullYear();
                      const remainingCalc = Math.max(0, parsedAmount - totalSpent);
                      const res = await budgetService.createBudget(profile.id, { userId: profile.id, month, year, amount: parsedAmount, remaining: remainingCalc });
                      const created = res.data || res;
                      setBudget(created);
                    }
                  }
                  setEditBudgetModalVisible(false);
                } catch (err) {
                  console.error('Failed to update/create budget', err);
                  const msg = (err as any)?.response?.data?.error || String(err);
                  Alert.alert('Save failed', msg);
                }
              }} style={{ padding: 10, backgroundColor: '#0ea5a7', borderRadius: 8 }}>
                <Text style={{ color: '#fff' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
