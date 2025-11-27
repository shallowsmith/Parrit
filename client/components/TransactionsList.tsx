import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CATEGORY_COLORS, FALLBACK_COLORS, normalizeCategoryKey, getCategoryColor } from '@/constants/categoryColors';

export default function TransactionsList({ transactions, onSelectTransaction, categories = [] }: { transactions: any[]; onSelectTransaction?: (tx: any) => void; categories?: any[] }) {
  const [showPreviousDays, setShowPreviousDays] = useState(false);
  const capitalize = (s: string) => String(s || '').replace(/\b\w/g, (m) => m.toUpperCase()).trim();

  const sorted = useMemo(() => transactions.slice().sort((a, b) => {
    const da = new Date(a.dateTime || a.createdAt || 0).getTime();
    const db = new Date(b.dateTime || b.createdAt || 0).getTime();
    return db - da;
  }), [transactions]);

  const groups: Record<string, any[]> = {};
  sorted.forEach((tx) => {
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

  const todayKey = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const hasToday = !!groups[todayKey];
  const visibleKeys = useMemo(() => {
    if (showPreviousDays) return dateKeys;
    if (hasToday) return [todayKey];
    return dateKeys.length ? [dateKeys[0]] : [];
  }, [showPreviousDays, dateKeys, hasToday, todayKey]);

  const otherDaysCount = Math.max(0, dateKeys.length - visibleKeys.length);

  return (
    <View style={styles.container}>
      {dateKeys.length > 1 && (
        <View style={styles.toggleRow}>
          <TouchableOpacity onPress={() => setShowPreviousDays((s) => !s)} style={styles.toggleButton}>
            <Text style={styles.toggleText}>{showPreviousDays ? 'Hide previous days' : `Show previous days (${otherDaysCount})`}</Text>
          </TouchableOpacity>
        </View>
      )}
      {visibleKeys.map((dateKey) => (
        <View key={dateKey} style={styles.dateGroup}>
          <Text style={styles.dateLabel}>{dateKey}</Text>
          {groups[dateKey].map((tx: any) => {
            const seed = String(tx.id || tx._id || tx.vendorName || '');
            const color = getCategoryColor(tx.categoryId || '', categories, undefined, seed);
            const foundCatForVendor = categories.find((c: any) => String(c.id) === String(tx.categoryId) || String(c._id) === String(tx.categoryId));
            const vendor = tx.vendorName || (foundCatForVendor ? capitalize(foundCatForVendor.name || '') : (tx.description || 'Unknown'));
            const amount = Number(tx.amount || 0).toFixed(2);
            let subtitle = tx.description || '';
            if (!subtitle || subtitle === '') {
              const foundCat = categories.find((c: any) => String(c.id) === String(tx.categoryId) || String(c._id) === String(tx.categoryId));
              if (foundCat) subtitle = capitalize(foundCat.name || '');
              else subtitle = String(tx.categoryId || '');
            }
            const time = new Date(tx.dateTime || tx.createdAt || 0).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            return (
              <TouchableOpacity key={tx.id || tx._id || Math.random()} style={styles.transactionCard} onPress={() => onSelectTransaction?.(tx)}>
                <View style={[styles.categoryColorBar, { backgroundColor: color }]} />
                <View style={styles.transactionLeft}>
                  <Text style={styles.vendorName}>{vendor}</Text>
                  <Text style={styles.subtitle}>{subtitle}</Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.amount}>${amount}</Text>
                  <Text style={styles.time}>{time}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  toggleButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  toggleText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  dateGroup: {
    width: '100%',
    marginTop: 12,
  },
  dateLabel: {
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
  categoryColorBar: {
    width: 6,
    height: '100%',
    borderRadius: 8,
    marginRight: 12,
  },
  transactionLeft: {
    flex: 1,
  },
  vendorName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  transactionRight: {
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
});
