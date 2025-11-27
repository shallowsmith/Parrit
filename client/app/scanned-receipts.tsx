import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import transactionService from '@/services/transaction.service';
import categoryService from '@/services/category.service';
import { getCategoryColor } from '@/constants/categoryColors';

export default function ScannedReceipts() {
  const router = useRouter();
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    Promise.all([
      transactionService.getTransactions(profile.id),
      categoryService.getCategories(profile.id),
    ])
      .then(([tRes, cRes]) => {
        const allTransactions = Array.isArray(tRes.data) ? tRes.data : [];

        // 🔍 DEBUG: Log all transactions
        console.log('📊 [SCANNED RECEIPTS] Total transactions fetched:', allTransactions.length);
        console.log('📊 [SCANNED RECEIPTS] All transactions:', JSON.stringify(allTransactions, null, 2));

        // Filter only transactions with receiptId (scanned receipts)
        const transactionsWithReceipts = allTransactions.filter(tx => tx.receiptId);

        // 🔍 DEBUG: Log filtered results
        console.log('📊 [SCANNED RECEIPTS] Transactions with receiptId:', transactionsWithReceipts.length);
        console.log('📊 [SCANNED RECEIPTS] Receipt IDs found:', transactionsWithReceipts.map(tx => ({
          id: tx.id || tx._id,
          vendor: tx.vendorName,
          receiptId: tx.receiptId,
          amount: tx.amount
        })));

        // 🔍 DEBUG: Log transactions WITHOUT receiptId
        const transactionsWithoutReceipts = allTransactions.filter(tx => !tx.receiptId);
        console.log('📊 [SCANNED RECEIPTS] Transactions WITHOUT receiptId:', transactionsWithoutReceipts.length);
        console.log('📊 [SCANNED RECEIPTS] Transactions missing receiptId:', transactionsWithoutReceipts.map(tx => ({
          id: tx.id || tx._id,
          vendor: tx.vendorName,
          amount: tx.amount,
          dateTime: tx.dateTime
        })));

        setTransactions(transactionsWithReceipts);

        const cats = Array.isArray(cRes.data) ? cRes.data : [];
        setCategories(cats);
      })
      .catch((err) => {
        console.error('Failed to load transactions', err);
      })
      .finally(() => setLoading(false));
  }, [profile?.id]);

  const capitalize = (s: string) => String(s || '').replace(/\b\w/g, (m) => m.toUpperCase()).trim();

  // Sort by date (newest first)
  const sortedTransactions = transactions.slice().sort((a, b) => {
    const da = new Date(a.dateTime || a.createdAt || 0).getTime();
    const db = new Date(b.dateTime || b.createdAt || 0).getTime();
    return db - da;
  });

  // Group by date
  const groups: Record<string, any[]> = {};
  sortedTransactions.forEach((tx) => {
    const dt = new Date(tx.dateTime || tx.createdAt || Date.now());
    const key = dt.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    groups[key] = groups[key] || [];
    groups[key].push(tx);
  });

  const dateKeys = Object.keys(groups).sort((a, b) => {
    const ta = new Date(groups[a][0].dateTime || groups[a][0].createdAt || 0).getTime();
    const tb = new Date(groups[b][0].dateTime || groups[b][0].createdAt || 0).getTime();
    return tb - ta;
  });

  const handleSelectTransaction = (tx: any) => {
    // Navigate to receipt details screen
    router.push({
      pathname: '/receipt-details',
      params: {
        transactionData: JSON.stringify(tx),
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading receipts...</Text>
        </View>
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scanned Receipts</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No scanned receipts yet</Text>
          <Text style={styles.emptySubtext}>Start scanning receipts to see them here</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanned Receipts</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {dateKeys.map((dateKey) => (
          <View key={dateKey} style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{dateKey}</Text>
            {groups[dateKey].map((tx: any) => {
              const seed = String(tx.id || tx._id || tx.vendorName || '');
              const color = getCategoryColor(tx.categoryId || '', categories, undefined, seed);
              const foundCatForVendor = categories.find((c: any) =>
                String(c.id) === String(tx.categoryId) || String(c._id) === String(tx.categoryId)
              );
              const vendor = tx.vendorName || (foundCatForVendor ? capitalize(foundCatForVendor.name || '') : (tx.description || 'Unknown'));
              const amount = Number(tx.amount || 0).toFixed(2);
              let subtitle = tx.description || '';
              if (!subtitle || subtitle === '') {
                const foundCat = categories.find((c: any) =>
                  String(c.id) === String(tx.categoryId) || String(c._id) === String(tx.categoryId)
                );
                if (foundCat) subtitle = capitalize(foundCat.name || '');
                else subtitle = String(tx.categoryId || '');
              }
              const time = new Date(tx.dateTime || tx.createdAt || 0).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <TouchableOpacity
                  key={tx.id || tx._id || Math.random()}
                  style={styles.transactionCard}
                  onPress={() => handleSelectTransaction(tx)}
                >
                  <View style={[styles.colorBar, { backgroundColor: color }]} />
                  <View style={styles.transactionContent}>
                    <Text style={styles.vendor}>{vendor}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                  </View>
                  <View style={styles.amountContainer}>
                    <Text style={styles.amount}>${amount}</Text>
                    <Text style={styles.time}>{time}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#000',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 8,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10130F',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  colorBar: {
    width: 6,
    height: '100%',
    borderRadius: 8,
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  vendor: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  amountContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  amount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  time: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
});
