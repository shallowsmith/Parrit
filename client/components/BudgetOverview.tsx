import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import BudgetDonut from '@/components/BudgetDonut';
import TransactionsList from '@/components/TransactionsList';
import TransactionFilter from '@/components/TransactionFilter';
import { normalizeCategoryKey, DEFAULT_NEW_CATEGORY_COLOR, getCategoryColor } from '@/constants/categoryColors';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import budgetService from '@/services/budget.service';
import transactionService from '@/services/transaction.service';
import categoryService from '@/services/category.service';
import { categoryServiceWritable } from '@/services/category.service';
import categoryPreferencesService from '@/services/categoryPreferences.service';
import { on } from '@/utils/events';
import { emit } from '@/utils/events';


export default function BudgetOverview({ editTransactionParam }: { editTransactionParam?: string }) {
  const { profile, refreshToken } = useAuth();
  const router = useRouter();

  const [budget, setBudget] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [processedParam, setProcessedParam] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editVendor, setEditVendor] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategoryInput, setEditCategoryInput] = useState('');
  const [editPaymentType, setEditPaymentType] = useState('Credit');
  const paymentTypes = ['Credit', 'Debit', 'Cash'];
  const [editBudgetModalVisible, setEditBudgetModalVisible] = useState(false);
  const [editBudgetAmount, setEditBudgetAmount] = useState('');
  const [editBudgetRemaining, setEditBudgetRemaining] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [categoriesModalVisible, setCategoriesModalVisible] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState<{ startDate?: string; endDate?: string; categories?: string[] }>({});

  useEffect(() => {
    if (!profile?.id) return;
    setLoading(true);
    let mounted = true;
    Promise.all([
      budgetService.getBudgets(profile.id),
      transactionService.getTransactions(profile.id),
      categoryService.getCategories(profile.id),
      categoryPreferencesService.getCategoryPreferences(profile.id),
    ])
      .then(([bRes, tRes, cRes, prefs]) => {
        if (!mounted) return;
        const budgets = bRes.data || [];

        // Pick budget for current month
        const now = new Date();
        const currentMonth = now.toLocaleString(undefined, { month: 'long' });
        const currentYear = now.getFullYear();

        const currentMonthBudget = budgets.find((b: any) =>
          b.month === currentMonth && b.year === currentYear
        );

        // If no budget for current month, pick the most recent one
        const chosen = currentMonthBudget || (budgets.length ? budgets[0] : null);
        setBudget(chosen);

        const txs = Array.isArray(tRes.data) ? tRes.data : [];
        setTransactions(txs);
        const cats = Array.isArray(cRes.data) ? cRes.data : [];
        setCategories(cats);
        setSelectedCategoryIds(prefs);
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
      Promise.all([budgetService.getBudgets(profile.id), transactionService.getTransactions(profile.id), categoryService.getCategories(profile.id), categoryPreferencesService.getCategoryPreferences(profile.id)])
        .then(([bRes, tRes, cRes, prefs]) => {
          const budgets = bRes.data || [];

          // Pick budget for current month
          const now = new Date();
          const currentMonth = now.toLocaleString(undefined, { month: 'long' });
          const currentYear = now.getFullYear();

          const currentMonthBudget = budgets.find((b: any) =>
            b.month === currentMonth && b.year === currentYear
          );

          // If no budget for current month, pick the most recent one
          const chosen = currentMonthBudget || (budgets.length ? budgets[0] : null);
          setBudget(chosen);
          const txs = Array.isArray(tRes.data) ? tRes.data : [];
          setTransactions(txs);
          const cats = Array.isArray(cRes.data) ? cRes.data : [];
          setCategories(cats);
          setSelectedCategoryIds(prefs);
        })
        .catch((err) => console.error('Failed to refresh budgets/transactions', err));
    };

    const unsubscribeTx = on('transactions:changed', handler);
    const unsubscribeCat = on('categories:changed', handler);
    return () => { unsubscribeTx(); unsubscribeCat(); };
  }, [profile?.id]);

  // Listen for navigation param to open edit modal for a specific transaction
  useEffect(() => {
    // Only process if we haven't already processed this exact param
    if (editTransactionParam && categories.length > 0 && editTransactionParam !== processedParam) {
      try {
        const transaction = JSON.parse(editTransactionParam);
        console.log('📝 [BUDGET OVERVIEW] Opening edit modal from navigation param:', transaction);
        handleSelectTransaction(transaction);
        // Mark this param as processed so we don't open it again
        setProcessedParam(editTransactionParam);
        // Clear the navigation param to prevent re-processing
        router.setParams({ editTransaction: undefined });
      } catch (err) {
        console.error('Failed to parse editTransactionParam:', err);
      }
    }
  }, [editTransactionParam, categories, processedParam]);

  // Debug: Monitor editModalVisible state changes
  useEffect(() => {
    console.log('🟢 [BUDGET OVERVIEW] editModalVisible changed to:', editModalVisible);
  }, [editModalVisible]);

  // Handler when a transaction is selected from the list
  const handleSelectTransaction = (tx: any) => {
    console.log('🔵 [BUDGET OVERVIEW] handleSelectTransaction called with:', tx);
    console.log('🔵 [BUDGET OVERVIEW] Transaction ID:', tx?.id || tx?._id);
    console.log('🔵 [BUDGET OVERVIEW] Setting modal visible to true');
    setEditingTx(tx);
    setEditDescription(tx.description || '');
    setEditVendor(tx.vendorName || '');
    setEditAmount(String(tx.amount || ''));
    setEditPaymentType(tx.paymentType || 'Credit');
    const cat = categories.find((c: any) => String(c.id) === String(tx.categoryId) || String(c._id) === String(tx.categoryId));
    setEditCategoryInput(cat ? (cat.name || String(cat.id || cat._id)) : String(tx.categoryId || ''));
    setEditModalVisible(true);
    console.log('🔵 [BUDGET OVERVIEW] Modal state updated');
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
        // Check if category exists but might be unchecked
        const res = await categoryService.getCategories(profile.id);
        const cats = Array.isArray(res.data) ? res.data : [];
        const match = cats.find((c: any) => String(c.name || '').toLowerCase() === raw.toLowerCase());

        if (match) {
          // Category exists - enable it and return its ID
          const catId = match.id || match._id;
          await categoryPreferencesService.enableCategory(profile.id, String(catId));
          return catId;
        }

        // Category doesn't exist - create it
        const capitalize = (s: string) => String(s || '').replace(/\b\w/g, (m) => m.toUpperCase()).trim();
        const createRes = await categoryServiceWritable.createCategory(profile.id, { name: capitalize(raw), type: 'expense', userId: profile.id, color: DEFAULT_NEW_CATEGORY_COLOR });
        const created = createRes.data;
        const createdId = created.id || created._id;
        // Auto-enable newly created category
        await categoryPreferencesService.enableCategory(profile.id, String(createdId));
        try { emit('categories:changed'); } catch (e) { /* ignore */ }
        return createdId || raw;
      } catch (err: any) {
        if (err?.response?.status === 409) {
          try {
            const res = await categoryService.getCategories(profile.id);
            const cats = Array.isArray(res.data) ? res.data : [];
            const match = cats.find((c: any) => String(c.name || '').toLowerCase() === raw.toLowerCase());
            if (match) {
              const catId = match.id || match._id;
              await categoryPreferencesService.enableCategory(profile.id, String(catId));
              return catId || raw;
            }
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
        paymentType: editPaymentType,
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
      setProcessedParam(null); // Clear processed param so it can be opened again if needed
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

  // Calculate current month's spending for budget display (always current month, regardless of filters)
  const currentMonthSpent = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return transactions
      .filter((t) => {
        const txDate = new Date(t.dateTime || t.createdAt || 0);
        return txDate >= startOfMonth && txDate <= endOfMonth;
      })
      .reduce((s, t) => s + (t.amount || 0), 0);
  }, [transactions]);

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
  // Always compute remaining from the budget total minus current month's spending
  const remaining = totalBudget - currentMonthSpent;

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
          <Text style={styles.smallText}>This Month's Budget</Text>
          <Text style={styles.largeText}>${totalBudget.toFixed(2)}</Text>
        </TouchableOpacity>
        <View style={styles.rightBox}>
          <Text style={styles.smallText}>{remaining < 0 ? 'Over Budget' : 'Remaining'}</Text>
          <Text style={[styles.largeText, { color: remaining < 0 ? '#EF4444' : '#7DA669' }]}>${Math.abs(remaining).toFixed(2)}</Text>
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
        <View style={styles.filterBar}>
          <View style={styles.filterBarLeft}>
            <TouchableOpacity onPress={() => setCategoriesModalVisible(true)} style={styles.filterBarButton}>
              <Text style={styles.filterBarButtonText}>Categories</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterBarRight}>
            <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={styles.filterBarButton}>
              <Text style={styles.filterBarButtonText}>Filter</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setFilters({}); }} style={styles.filterBarClearButton}>
              <Text style={styles.filterBarClearText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TransactionFilter
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          categories={categories}
          initial={{ startDate: filters.startDate, endDate: filters.endDate, categories: filters.categories }}
          onClear={() => { setFilters({}); }}
          onApply={(f) => { setFilters(f); }}
        />

        {/* Categories modal */}
        <Modal visible={categoriesModalVisible} transparent animationType="slide">
          <View style={styles.categoriesModalOverlay}>
            <View style={styles.categoriesModalContainer}>
              <View style={styles.categoriesModalHeader}>
                <Text style={styles.categoriesModalTitle}>Categories</Text>
              </View>
              {/* Close button (X) in top-right of the modal */}
              <TouchableOpacity onPress={() => {
                setCategoriesModalVisible(false);
                emit('categories:changed'); // Trigger reload in other components
              }} style={styles.categoriesModalCloseButton} accessibilityLabel="Close categories">
                <Text style={styles.categoriesModalCloseText}>✕</Text>
              </TouchableOpacity>
              <ScrollView style={styles.categoriesModalScrollView} contentContainerStyle={styles.categoriesModalScrollContent}>
                {/* Default categories */}
                <Text style={styles.categoriesSectionTitle}>Default Categories</Text>
                {(() => {
                  const defaults = ['Food','Groceries','Rent','Utilities','Transportation','Entertainment','Travel','Gifts','Misc'];
                  return defaults.map((dn) => {
                    const found = categories.find((c: any) => String(c.name || '').toLowerCase() === dn.toLowerCase());
                    const id = found ? (found.id || found._id) : dn;
                    const checked = Boolean(selectedCategoryIds[String(id)] ?? true);
                    const color = getCategoryColor(id, categories);
                    return (
                      <View key={`def-${dn}`} style={styles.categoryRow}>
                        <View style={styles.categoryRowLeft}>
                          <View style={[styles.categoryColorBar, { backgroundColor: color }]} />
                          <Text style={styles.categoryName}>{dn}</Text>
                        </View>
                        <TouchableOpacity onPress={async () => {
                          const newPrefs = { ...selectedCategoryIds, [String(id)]: !checked };
                          setSelectedCategoryIds(newPrefs);
                          if (profile?.id) {
                            await categoryPreferencesService.saveCategoryPreferences(profile.id, newPrefs);
                          }
                        }} style={[styles.categoryCheckbox, checked ? styles.categoryCheckboxChecked : styles.categoryCheckboxUnchecked]}>
                          {checked ? <Text style={styles.categoryCheckmark}>✓</Text> : null}
                        </TouchableOpacity>
                      </View>
                    );
                  });
                })()}

                {/* Custom categories */}
                <Text style={styles.categoriesCustomSectionTitle}>Custom Categories</Text>
                {(() => {
                  const defaultsSet = new Set(['food','groceries','rent','utilities','transportation','entertainment','travel','gifts','misc']);
                  const custom = (categories || []).filter((c: any) => !defaultsSet.has(String(c.name || '').toLowerCase()));
                  if (!custom.length) return <Text style={styles.noCategoriesText}>No custom categories</Text>;
                  return custom.map((c: any) => {
                    const id = c.id || c._id;
                    const checked = Boolean(selectedCategoryIds[String(id)] ?? true);
                    console.log(`[MODAL DEBUG] Getting color for custom category: ${c.name}, id=${id}, total categories=${categories.length}`);
                    const color = getCategoryColor(id, categories);
                    return (
                      <View key={id} style={styles.categoryRow}>
                        <View style={styles.categoryRowLeft}>
                          <View style={[styles.categoryColorBar, { backgroundColor: color }]} />
                          <Text style={styles.categoryName}>{c.name}</Text>
                        </View>
                        <TouchableOpacity onPress={async () => {
                          const newPrefs = { ...selectedCategoryIds, [String(id)]: !checked };
                          setSelectedCategoryIds(newPrefs);
                          if (profile?.id) {
                            await categoryPreferencesService.saveCategoryPreferences(profile.id, newPrefs);
                          }
                        }} style={[styles.categoryCheckbox, checked ? styles.categoryCheckboxChecked : styles.categoryCheckboxUnchecked]}>
                          {checked ? <Text style={styles.categoryCheckmark}>✓</Text> : null}
                        </TouchableOpacity>
                      </View>
                    );
                  });
                })()}

                <View style={styles.addCategoryContainer}>
                  <TextInput value={newCategoryInput} onChangeText={setNewCategoryInput} placeholder="Add new category" placeholderTextColor="#9CA3AF" style={styles.addCategoryInput} />
                  <TouchableOpacity onPress={async () => {
                    const raw = String(newCategoryInput || '').trim();
                    if (!raw) return;
                    if (!profile?.id) { Alert.alert('Not signed in'); return; }
                    try {
                      const res = await categoryServiceWritable.createCategory(profile.id, { name: raw, type: 'expense', userId: profile.id, color: DEFAULT_NEW_CATEGORY_COLOR });
                      try { emit('categories:changed'); } catch (e) { /* ignore */ }
                      setNewCategoryInput('');
                      // reload categories list
                      const all = await categoryService.getCategories(profile.id);
                      setCategories(Array.isArray(all.data) ? all.data : []);
                    } catch (err) {
                      console.error('Failed to create category from modal', err);
                      Alert.alert('Create failed', (err as any)?.response?.data?.error || String(err));
                    }
                  }} style={styles.addCategoryButton}>
                    <Text style={styles.addCategoryButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.addCategorySpacer} />
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Transactions list (separate widget) */}
  <TransactionsList transactions={visibleTransactions} onSelectTransaction={handleSelectTransaction} categories={categories} />

      {/* Edit transaction modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.editModalOverlay}>
          <View style={styles.editModalContainer}>
            <Text style={styles.editModalTitle}>Edit Transaction</Text>
            <Text style={styles.editModalLabel}>Vendor</Text>
            <TextInput value={editVendor} onChangeText={setEditVendor} style={styles.editModalInput} />
            <Text style={styles.editModalLabel}>Description</Text>
            <TextInput value={editDescription} onChangeText={setEditDescription} style={styles.editModalInput} />
            <Text style={styles.editModalLabel}>Amount</Text>
            <TextInput value={editAmount} onChangeText={setEditAmount} keyboardType="numeric" style={styles.editModalInput} />
            <Text style={styles.editModalLabel}>Payment Type</Text>
            <View style={styles.editModalChipsRow}>
              {paymentTypes.map((type) => (
                <TouchableOpacity key={type} onPress={() => setEditPaymentType(type)} style={[styles.editModalChip, editPaymentType === type ? styles.editModalChipSelected : styles.editModalChipUnselected]}>
                  <Text style={editPaymentType === type ? styles.editModalChipTextSelected : styles.editModalChipTextUnselected}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.editModalLabel}>Category (name or id)</Text>
            <TextInput value={editCategoryInput} onChangeText={setEditCategoryInput} placeholder="e.g. Groceries" style={styles.editModalInput} />

            <View style={styles.editModalButtonRow}>
              <TouchableOpacity onPress={() => { setEditModalVisible(false); setEditingTx(null); setProcessedParam(null); }} style={styles.editModalCancelButton}>
                <Text style={styles.editModalCancelText}>Cancel</Text>
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
                      setProcessedParam(null); // Clear processed param so it can be opened again if needed
                    } catch (err) {
                      console.error('Failed to delete transaction', err);
                      const msg = (err as any)?.response?.data?.error || String(err);
                      Alert.alert('Delete failed', msg);
                    }
                  } }
                ]);
              }} style={styles.editModalDeleteButton}>
                <Text style={styles.editModalDeleteText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEditedTransaction} style={styles.editModalSaveButton}>
                <Text style={styles.editModalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Budget edit modal */}
      <Modal visible={editBudgetModalVisible} transparent animationType="fade">
        <View style={styles.budgetModalOverlay}>
          <View style={styles.budgetModalContainer}>
            <Text style={styles.budgetModalTitle}>Edit Budget</Text>
            <Text style={styles.budgetModalLabel}>Total amount</Text>
            <TextInput value={editBudgetAmount} onChangeText={setEditBudgetAmount} keyboardType="numeric" style={styles.budgetModalInput} />
            <Text style={styles.budgetModalLabel}>Remaining / Balance</Text>
            <View style={styles.budgetModalRemainingContainer}>
              <Text style={styles.budgetModalRemainingText}>{editBudgetRemaining}</Text>
            </View>

            <View style={styles.budgetModalButtonRow}>
              <TouchableOpacity onPress={() => { setEditBudgetModalVisible(false); }} style={styles.budgetModalCancelButton}>
                <Text style={styles.budgetModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                const parsedAmount = Number(editBudgetAmount);
                if (isNaN(parsedAmount)) { Alert.alert('Invalid input'); return; }
                try {
                  if (profile?.id) {
                    if (budget && (budget.id || budget._id)) {
                      const bid = budget.id || budget._id;
                      const remainingCalc = Math.max(0, parsedAmount - currentMonthSpent);
                      const res = await budgetService.updateBudget(profile.id, bid, { amount: parsedAmount, remaining: remainingCalc });
                      const updated = res.data || res;
                      setBudget(updated);
                    } else {
                      const now = new Date();
                      const month = now.toLocaleString(undefined, { month: 'long' });
                      const year = now.getFullYear();
                      const remainingCalc = Math.max(0, parsedAmount - currentMonthSpent);
                      const res = await budgetService.createBudget(profile.id, { userId: profile.id, month, year, amount: parsedAmount, remaining: remainingCalc });
                      const created = res.data || res;
                      setBudget(created);
                    }
                  }
                  setEditBudgetModalVisible(false);
                } catch (err) {
                  console.error('Failed to update/create budget', err);
                  const errorDetails = (err as any)?.response?.data;
                  const errorMsg = errorDetails?.error || errorDetails?.message || String(err);
                  const statusCode = (err as any)?.response?.status;
                  console.error('Error details:', { statusCode, errorDetails });
                  Alert.alert('Save failed', `${errorMsg}${statusCode ? ` (${statusCode})` : ''}`);
                }
              }} style={styles.budgetModalSaveButton}>
                <Text style={styles.budgetModalSaveText}>Save</Text>
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
  container: { padding: 12, marginBottom: 12, backgroundColor: '#000000', borderRadius: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingTop: 50 },
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
  txCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000000', borderRadius: 12, padding: 12, marginBottom: 8 },
  txAccent: { width: 6, height: '100%', borderRadius: 8, marginRight: 12 },
  txContent: { flex: 1 },
  txVendor: { color: '#fff', fontSize: 16, fontWeight: '700' },
  txSubtitle: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
  txRight: { alignItems: 'flex-end', marginLeft: 12 },
  txAmount: { color: '#fff', fontSize: 16, fontWeight: '700' },
  txTime: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
  // Filter bar styles
  filterBar: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  filterBarLeft: { flexDirection: 'row', alignItems: 'center' },
  filterBarRight: { flexDirection: 'row', alignItems: 'center' },
  filterBarButton: { padding: 8, marginRight: 16 },
  filterBarButtonText: { color: '#fff' },
  filterBarClearButton: { padding: 8 },
  filterBarClearText: { color: '#fff' },
  // Categories modal styles
  categoriesModalOverlay: { flex: 1, backgroundColor: 'rgba(16, 19, 15, 0.3)', justifyContent: 'flex-end' },
  categoriesModalContainer: { backgroundColor: '#000000', padding: 12, borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: '80%' },
  categoriesModalHeader: { paddingHorizontal: 8 },
  categoriesModalTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  categoriesModalCloseButton: { position: 'absolute', right: 16, top: 16, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  categoriesModalCloseText: { color: '#fff', fontSize: 20 },
  categoriesModalScrollView: { marginTop: 6 },
  categoriesModalScrollContent: { paddingHorizontal: 8, paddingBottom: 32 },
  categoriesSectionTitle: { color: '#9CA3AF', marginTop: 6, marginBottom: 6 },
  categoriesCustomSectionTitle: { color: '#9CA3AF', marginTop: 12, marginBottom: 6 },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  categoryRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  categoryColorBar: { width: 6, height: 34, borderRadius: 3, marginRight: 12 },
  categoryName: { color: '#fff', fontSize: 16 },
  categoryCheckbox: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  categoryCheckboxChecked: { backgroundColor: '#7DA669', borderColor: '#7DA669' },
  categoryCheckboxUnchecked: { backgroundColor: 'transparent', borderColor: '#4B5563' },
  categoryCheckmark: { color: '#fff', fontWeight: '700' },
  noCategoriesText: { color: '#9CA3AF', marginTop: 12 },
  addCategoryContainer: { marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  addCategoryInput: { flex: 1, backgroundColor: '#0b1518', padding: 12, borderRadius: 8, color: '#fff' },
  addCategoryButton: { marginLeft: 8, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#10B981', borderRadius: 8 },
  addCategoryButtonText: { color: '#fff', fontWeight: '700' },
  addCategorySpacer: { height: 16 },
  // Edit transaction modal styles
  editModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  editModalContainer: { backgroundColor: '#000000', borderRadius: 12, padding: 16 },
  editModalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  editModalLabel: { color: '#9CA3AF', fontSize: 12, marginBottom: 6 },
  editModalInput: { backgroundColor: '#111310', color: '#fff', padding: 10, borderRadius: 8, marginBottom: 12 },
  editModalChipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  editModalChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 18, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  editModalChipSelected: { backgroundColor: '#10b981', borderColor: '#10b981' },
  editModalChipUnselected: { backgroundColor: '#222', borderColor: '#333' },
  editModalChipTextSelected: { color: '#fff' },
  editModalChipTextUnselected: { color: '#fff' },
  editModalButtonRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  editModalCancelButton: { padding: 10, marginRight: 8 },
  editModalCancelText: { color: '#fff' },
  editModalDeleteButton: { padding: 10, marginRight: 8 },
  editModalDeleteText: { color: '#fff' },
  editModalSaveButton: { padding: 10, backgroundColor: '#7DA669', borderRadius: 8 },
  editModalSaveText: { color: '#fff' },
  // Budget edit modal styles
  budgetModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  budgetModalContainer: { backgroundColor: '#051218', borderRadius: 12, padding: 16 },
  budgetModalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  budgetModalLabel: { color: '#9CA3AF', fontSize: 12, marginBottom: 6 },
  budgetModalInput: { backgroundColor: '#000000', color: '#fff', padding: 10, borderRadius: 8, marginBottom: 12 },
  budgetModalRemainingContainer: { backgroundColor: '#000000', padding: 10, borderRadius: 8, marginBottom: 12 },
  budgetModalRemainingText: { color: '#fff' },
  budgetModalButtonRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  budgetModalCancelButton: { padding: 10, marginRight: 8 },
  budgetModalCancelText: { color: '#fff' },
  budgetModalSaveButton: { padding: 10, backgroundColor: '#7DA669', borderRadius: 8 },
  budgetModalSaveText: { color: '#fff' },
});
