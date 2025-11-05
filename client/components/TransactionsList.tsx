import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const CATEGORY_COLORS: Record<string, string> = {
  food: '#10B981',
  rent: '#EF4444',
  utilities: '#3B82F6',
  transportation: '#F59E0B',
  entertainment: '#8B5CF6',
  travel: '#06B6D4',
  gift: '#EC4899',
  misc: '#ffe100ff',
};

const FALLBACK_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#A78BFA', '#F97316'];

export default function TransactionsList({ transactions, onSelectTransaction }: { transactions: any[]; onSelectTransaction?: (tx: any) => void }) {
  const [showPreviousDays, setShowPreviousDays] = useState(false);

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

  // Build an ordered list of keys (newest first)
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
    // fallback: show the most recent day if today has no transactions
    return dateKeys.length ? [dateKeys[0]] : [];
  }, [showPreviousDays, dateKeys, hasToday, todayKey]);

  const otherDaysCount = Math.max(0, dateKeys.length - visibleKeys.length);

  return (
    <View style={{ width: '100%', marginTop: 8 }}>
      {dateKeys.length > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
          <TouchableOpacity onPress={() => setShowPreviousDays((s) => !s)} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
            <Text style={{ color: '#60A5FA', fontSize: 13 }}>{showPreviousDays ? 'Hide previous days' : `Show previous days (${otherDaysCount})`}</Text>
          </TouchableOpacity>
        </View>
      )}
      {visibleKeys.map((dateKey) => (
        <View key={dateKey} style={{ width: '100%', marginTop: 12 }}>
          <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 8 }}>{dateKey}</Text>
          {groups[dateKey].map((tx: any) => {
            const color = CATEGORY_COLORS[tx.categoryId] || FALLBACK_COLORS[Math.abs(String(tx.id || tx._id || tx.vendorName || '').length) % FALLBACK_COLORS.length];
            const vendor = tx.vendorName || tx.description || 'Unknown';
            const amount = Number(tx.amount || 0).toFixed(2);
            const subtitle = tx.description || (tx.categoryId || '');
            const time = new Date(tx.dateTime || tx.createdAt || 0).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            return (
              <TouchableOpacity key={tx.id || tx._id || Math.random()} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0b1220', borderRadius: 12, padding: 12, marginBottom: 8 }} onPress={() => onSelectTransaction?.(tx)}>
                <View style={{ width: 6, height: '100%', borderRadius: 8, marginRight: 12, backgroundColor: color }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{vendor}</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>{subtitle}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>${amount}</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>{time}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}
